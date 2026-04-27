from rest_framework.exceptions import ValidationError
from django.utils import timezone
from api.models import Notification

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
                detail={
                    "error": True,
                    "message": f"Cannot transition from {current_state} to {new_state}",
                    "code": "invalid_transition"
                }
            )

        # Prepare payload for notification before saving
        payload = {
            "submission_id": submission.id,
            "from_state": current_state,
            "to_state": new_state,
            "note": reviewer_note or ""
        }

        # Apply state changes
        submission.status = new_state
        
        # Track submission time if it is entering 'submitted' state
        if new_state == "submitted" and current_state in ["draft", "more_info_requested"]:
            submission.submitted_at = timezone.now()

        if reviewer is not None:
            submission.reviewer = reviewer
        
        if reviewer_note is not None:
            submission.reviewer_note = reviewer_note

        submission.save()

        # Create Notification
        Notification.objects.create(
            merchant=submission.merchant,
            event_type=f"submission_{new_state}",
            payload=payload
        )

        return submission
