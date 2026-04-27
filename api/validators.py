import magic
from rest_framework.exceptions import ValidationError
from django.core.files.uploadedfile import UploadedFile

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png'
]

def validate_document_file(file: UploadedFile):
    """
    Validates that the uploaded file does not exceed the maximum size
    and has an allowed MIME type (by reading file content, not extension).
    """
    if file.size > MAX_FILE_SIZE:
        raise ValidationError(
            detail={
                "error": True,
                "message": "File size exceeds the 5MB limit.",
                "code": "file_too_large"
            }
        )

    # Read the first 2048 bytes to determine MIME type securely
    file.seek(0)
    file_header = file.read(2048)
    file.seek(0)  # Reset file pointer after reading!

    mime_type = magic.from_buffer(file_header, mime=True)
    
    if mime_type not in ALLOWED_MIME_TYPES:
        raise ValidationError(
            detail={
                "error": True,
                "message": f"Unsupported file type: {mime_type}. Allowed types are PDF, JPEG, and PNG.",
                "code": "invalid_file_type"
            }
        )
