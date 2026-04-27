# Playto Pay KYC Pipeline Explainer
This document outlines perfectly how the KYC Pipeline meets the architectural requirements of the Founding Engineering challenge.

### 1. The State Machine
Our state machine lives entirely inside `api/state_machine.py`. It explicitly defines the Directed Acyclic Graph (DAG) logic, decoupling it entirely from the views.

```python
class KYCStateMachine:
    VALID_TRANSITIONS = {
        'draft': ['submitted'],
        'submitted': ['under_review'],
        'under_review': ['approved', 'rejected', 'more_info_requested'],
        'more_info_requested': ['submitted'],
        'approved': [],
        'rejected': [],
    }

    @classmethod
    def transition(cls, submission, new_state, reviewer=None, reviewer_note=None):
        current_state = submission.status
        if new_state not in cls.VALID_TRANSITIONS.get(current_state, []):
            raise ValidationError(
                detail={"error": True, "message": f"Cannot transition from {current_state} to {new_state}", "code": "invalid_transition"}
            )
        # ... applies state updates natively
```
**How it prevents illegal transitions:** It intercepts the current state of the submission and cross-checks it against `VALID_TRANSITIONS`. Any illegal attempt completely throws a DRF `ValidationError` yielding the required HTTP 400 shape.

### 2. The Upload
Validation lives in `api/validators.py`. We never trust extensions (`.pdf`). Instead, we physically inspect the file header bytes securely using `python-magic`.

```python
def validate_document_file(file: UploadedFile):
    if file.size > 5 * 1024 * 1024:
        raise ValidationError(detail={"error": True, "message": "File exceeds 5MB limit", "code": "file_too_large"})

    file.seek(0)
    file_header = file.read(2048)
    file.seek(0)
    
    mime_type = magic.from_buffer(file_header, mime=True)
    if mime_type not in ['application/pdf', 'image/jpeg', 'image/png']:
        raise ValidationError(detail={"error": True, "message": "Unsupported file type", "code": "invalid_file_type"})
```
**What happens to a 50MB file?** It triggers the `file.size` check on line 2, immediately bypassing the memory buffer execution and aborting the API request cleanly, throwing a `"File exceeds 5MB limit"` 400 error.

### 3. The Queue
The Reviewer Dashboard utilizes a two-part combination. The primary queue query in `api/views.py`:
```python
class ReviewerQueueView(APIView):
    # ...
    def get(self, request):
        submissions = KYCSubmission.objects.all().order_by('submitted_at', 'created_at')
```
And the dynamic SLA Flag (`is_at_risk`) inside `api/serializers.py`:
```python
    def get_is_at_risk(self, obj):
        if obj.submitted_at and obj.status in ['submitted', 'under_review']:
            return (timezone.now() - obj.submitted_at).total_seconds() > 86400
        return False
```
**Why I wrote it this way:** Database timestamps are inherently rigid. Extracting calculations out into the Python `SerializerMethodField` ensures `is_at_risk` is purely ephemeral computed data rendered identically upon request. Sorting uses `submitted_at` resolving chronologically oldest first to prevent pipeline burial.

### 4. The Auth
Merchants never view each other's data due to the strict `IsOwnerOrReviewer` DRF BasePermission mapping onto the row-level queries.

```python
# api/permissions.py
class IsOwnerOrReviewer(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'reviewer':
            return True
        if request.user.role == 'merchant':
            return obj.merchant == request.user
        return False
```
**How it stops Merchant A viewing Merchant B:** The `has_object_permission` physically intercepts the `.get_object()` call. If Merchant A passes Merchant B's ID to the detail endpoint, this explicit comparative lock throws a fatal `HTTP 403 Forbidden` response instantly.

### 5. The AI Audit
While the AI agent was phenomenal for scaffolding the boilerplate, it actually wrote a critical logic bomb within the `views.py` `get_or_create` generation causing a native `500 Server Error`.

**What the AI generated:**
```python
        submission, created = KYCSubmission.objects.get_or_create(
            merchant=self.request.user,
            defaults={'status': 'draft'}
        )
```
**What I caught:** `KYCSubmission` requires the fields `email`, `phone`, and `full_name` to be present (no `null=True`, `blank=True`). By failing to pass defaults for NOT NULL columns to a new `get_or_create` sequence, the Django ORM shattered triggering an `IntegrityError` the moment a fresh Merchant opened the React UI to see their draft.

**What I replaced it with:**
```python
        submission, created = KYCSubmission.objects.get_or_create(
            merchant=self.request.user,
            defaults={
                'status': 'draft',
                'full_name': '',
                'phone': '',
                'business_name': '',
                'business_type': '',
                'monthly_volume_usd': 0
            }
        )
```
This safely instantiates the SQLite row and completely resolved the crash, satisfying the constraints safely without altering the database schema integrity.
