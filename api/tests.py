from rest_framework.test import APITestCase
from django.utils import timezone
from api.models import User, KYCSubmission
from api.state_machine import KYCStateMachine
from rest_framework.exceptions import ValidationError

class StateMachineTests(APITestCase):
    def setUp(self):
        self.merchant = User.objects.create_user(email="test@merchant.com", password="pw", role="merchant")
        self.submission = KYCSubmission.objects.create(
            merchant=self.merchant, 
            status="draft",
            business_name="Test Business"
        )

    def test_illegal_transition(self):
        # 'draft' -> 'under_review' is explicitly NOT in VALID_TRANSITIONS
        # VALID_TRANSITIONS['draft'] = ['submitted']
        with self.assertRaises(ValidationError) as context:
            KYCStateMachine.transition(self.submission, 'under_review')
            
        self.assertIn("Cannot transition from draft to under_review", str(context.exception))
        
    def test_legal_transition(self):
        # 'draft' -> 'submitted' is legal
        sub = KYCStateMachine.transition(self.submission, 'submitted')
        self.assertEqual(sub.status, 'submitted')
        self.assertIsNotNone(sub.submitted_at)
