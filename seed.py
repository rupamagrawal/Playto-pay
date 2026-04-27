import os
import django
from django.utils import timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from api.models import User, KYCSubmission
from rest_framework.authtoken.models import Token

def run_seed():
    print("Clearing old data...")
    User.objects.all().delete()
    
    print("Creating Reviewer...")
    reviewer = User.objects.create_user(email="admin@playtopay.com", password="password123", role="reviewer")
    Token.objects.get_or_create(user=reviewer)

    print("Creating Merchants...")
    m1 = User.objects.create_user(email="merchant_one@test.com", password="password123", role="merchant")
    m2 = User.objects.create_user(email="merchant_two@test.com", password="password123", role="merchant")
    Token.objects.get_or_create(user=m1)
    Token.objects.get_or_create(user=m2)

    print("Creating Submissions...")
    sub1 = KYCSubmission.objects.create(
        merchant=m1, status="under_review", full_name="Alice McGee", email="alice@test.com", phone="12345", 
        business_name="Alice Store", business_type="Retail", monthly_volume_usd=5000,
        submitted_at=timezone.now() - timezone.timedelta(days=2) # "older than 24 hours" to test is_at_risk!
    )
    
    sub2 = KYCSubmission.objects.create(
        merchant=m2, status="draft", full_name="Bob Jones", email="bob@test.com", phone="54321", 
        business_name="Bob LLC", business_type="Online", monthly_volume_usd=15000
    )

    print("Seed complete!")
    print("Login credentials (Password is always 'password123'):")
    print("- admin@playtopay.com (Reviewer)")
    print("- merchant_one@test.com (Merchant w/ pending submission)")
    print("- merchant_two@test.com (Merchant w/ draft)")

if __name__ == '__main__':
    run_seed()
