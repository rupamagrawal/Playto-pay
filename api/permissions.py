from rest_framework.permissions import BasePermission

class MerchantPermission(BasePermission):
    """
    Allows access only to authenticated users with the 'merchant' role.
    """
    message = "Access denied. This endpoint is restricted to merchants only."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'merchant')


class ReviewerPermission(BasePermission):
    """
    Allows access only to authenticated users with the 'reviewer' role.
    """
    message = "Access denied. This endpoint is restricted to reviewers only."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'reviewer')


class IsOwnerOrReviewer(BasePermission):
    """
    Object-level permission to allow reviewers access to any submission,
    but restricts merchants to only access their own submissions.
    """
    message = "Access denied. You do not have ownership of this submission."

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Reviewers can view/access all submissions
        if request.user.role == 'reviewer':
            return True
            
        # Merchants can only access submissions where they are the owner
        if request.user.role == 'merchant':
            return obj.merchant == request.user
            
        return False
