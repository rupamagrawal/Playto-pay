from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.utils import timezone
from django.shortcuts import get_object_or_404

from api.models import User, KYCSubmission, Document
from api.serializers import (
    UserRegistrationSerializer, 
    KYCSubmissionSerializer, 
    ReviewerSubmissionSerializer,
    DocumentSerializer
)
from api.permissions import MerchantPermission, ReviewerPermission, IsOwnerOrReviewer
from api.state_machine import KYCStateMachine

# ----------------- AUTHENTICATION VIEWS -----------------

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "message": "Registered successfully."}, status=status.HTTP_201_CREATED)
        return Response({"error": True, "message": "Validation failed", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        user = authenticate(username=email, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "token": token.key,
                "role": user.role
            })
        return Response({"error": True, "message": "Invalid credentials", "code": "invalid_credentials"}, status=status.HTTP_401_UNAUTHORIZED)


# ----------------- MERCHANT VIEWS -----------------

class MerchantSubmissionView(APIView):
    permission_classes = [IsAuthenticated, MerchantPermission]
    
    def get_object(self):
        # Dynamically grabs their own submission implicitly
        submission, created = KYCSubmission.objects.get_or_create(
            merchant=self.request.user,
            defaults={
                'status': 'draft',
                'full_name': '',
                'email': self.request.user.email,
                'phone': '',
                'business_name': '',
                'business_type': '',
                'monthly_volume_usd': 0
            }
        )
        self.check_object_permissions(self.request, submission)
        return submission

    def get(self, request):
        submission = self.get_object()
        serializer = KYCSubmissionSerializer(submission)
        return Response(serializer.data)

    def put(self, request):
        submission = self.get_object()
        
        if submission.status != 'draft':
            return Response(
                {"error": True, "message": "Submission cannot be edited in current state", "code": "invalid_state_for_edit"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        serializer = KYCSubmissionSerializer(submission, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response({"error": True, "message": "Validation failed", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class MerchantSubmitView(APIView):
    permission_classes = [IsAuthenticated, MerchantPermission]

    def get_object(self):
        submission = get_object_or_404(KYCSubmission, merchant=self.request.user)
        self.check_object_permissions(self.request, submission)
        return submission

    def post(self, request):
        submission = self.get_object()
        # Rule 2: Strictly delegate transition logic
        KYCStateMachine.transition(submission, 'submitted')
        return Response({"success": True, "message": "Submission successfully submitted for review."})


class MerchantDocumentView(APIView):
    permission_classes = [IsAuthenticated, MerchantPermission]

    def get_object(self):
        submission = get_object_or_404(KYCSubmission, merchant=self.request.user)
        self.check_object_permissions(self.request, submission)
        return submission

    def get(self, request):
        submission = self.get_object()
        documents = submission.documents.all()
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data)

    def post(self, request):
        submission = self.get_object()
        
        if submission.status != 'draft':
            return Response(
                {"error": True, "message": "Submission cannot be edited in current state", "code": "invalid_state_for_edit"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Rule 3: Do not write file validation here, rely on serializer->validate_document_file()
        serializer = DocumentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(submission=submission)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({"error": True, "message": "Validation failed", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


# ----------------- REVIEWER VIEWS -----------------

class ReviewerQueueView(APIView):
    permission_classes = [IsAuthenticated, ReviewerPermission]

    def get(self, request):
        submissions = KYCSubmission.objects.all().order_by('submitted_at', 'created_at')
        serializer = ReviewerSubmissionSerializer(submissions, many=True)
        return Response(serializer.data)


class ReviewerMetricsView(APIView):
    permission_classes = [IsAuthenticated, ReviewerPermission]

    def get(self, request):
        submissions = KYCSubmission.objects.exclude(status='draft')
        
        queue_count = submissions.filter(status__in=['submitted', 'under_review']).count()
        
        # Rule: Compute avg_time using Python, not raw SQL
        queue_submissions = submissions.filter(status__in=['submitted', 'under_review'])
        total_hours = 0
        now = timezone.now()
        valid_subs = 0
        
        for sub in queue_submissions:
            if sub.submitted_at:
                hours = (now - sub.submitted_at).total_seconds() / 3600.0
                total_hours += hours
                valid_subs += 1
                
        avg_time = (total_hours / valid_subs) if valid_subs > 0 else 0.0

        seven_days_ago = now - timezone.timedelta(days=7)
        recently_resolved = submissions.filter(status__in=['approved', 'rejected'], updated_at__gte=seven_days_ago)
        total_resolved = recently_resolved.count()
        approved_count = recently_resolved.filter(status='approved').count()
        
        approval_rate = (approved_count / total_resolved * 100) if total_resolved > 0 else 0.0
        
        return Response({
            "queue_count": queue_count,
            "avg_time_in_queue_hours": round(avg_time, 2),
            "approval_rate_last_7_days": round(approval_rate, 2)
        })


class ReviewerSubmissionDetailView(APIView):
    # Rule 1: Use IsOwnerOrReviewer for Detail endpoint handling submission visibility
    permission_classes = [IsAuthenticated, ReviewerPermission, IsOwnerOrReviewer]

    def get_object(self, pk):
        submission = get_object_or_404(KYCSubmission, pk=pk)
        self.check_object_permissions(self.request, submission)
        return submission

    def get(self, request, pk):
        submission = self.get_object(pk)
        serializer = ReviewerSubmissionSerializer(submission)
        return Response(serializer.data)


class ReviewerTransitionView(APIView):
    permission_classes = [IsAuthenticated, ReviewerPermission, IsOwnerOrReviewer]

    def get_object(self, pk):
        submission = get_object_or_404(KYCSubmission, pk=pk)
        self.check_object_permissions(self.request, submission)
        return submission

    def post(self, request, pk):
        submission = self.get_object(pk)
        to_state = request.data.get('to_state')
        note = request.data.get('note', '')
        
        if not to_state:
            return Response({"error": True, "message": "to_state is required", "code": "missing_state"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Rule 2: Strictly delegate transition logic 
        KYCStateMachine.transition(submission, to_state, reviewer=request.user, reviewer_note=note)
        serializer = ReviewerSubmissionSerializer(submission)
        return Response(serializer.data)
