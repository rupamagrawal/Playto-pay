from django.urls import path
from .views import (
    RegisterView, LoginView,
    MerchantSubmissionView, MerchantSubmitView, MerchantDocumentView,
    ReviewerQueueView, ReviewerMetricsView, ReviewerSubmissionDetailView, ReviewerTransitionView
)

urlpatterns = [
    # Auth
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),

    # Merchant
    path('submissions/mine/', MerchantSubmissionView.as_view(), name='merchant-submission'),
    path('submissions/mine/submit/', MerchantSubmitView.as_view(), name='merchant-submit'),
    path('submissions/mine/documents/', MerchantDocumentView.as_view(), name='merchant-documents'),

    # Reviewer
    path('reviewer/queue/', ReviewerQueueView.as_view(), name='reviewer-queue'),
    path('reviewer/queue/metrics/', ReviewerMetricsView.as_view(), name='reviewer-metrics'),
    path('reviewer/submissions/<int:pk>/', ReviewerSubmissionDetailView.as_view(), name='reviewer-submission-detail'),
    path('reviewer/submissions/<int:pk>/transition/', ReviewerTransitionView.as_view(), name='reviewer-submission-transition'),
]
