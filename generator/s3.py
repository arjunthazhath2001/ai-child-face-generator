import boto3
from django.conf import settings
from datetime import timedelta
from django.utils import timezone

def generate_presigned_url(bucket_name, object_name, expiration=3600):
    """Generates a presigned URL for an S3 object.

    Args:
        bucket_name: S3 bucket name.
        object_name: S3 object key.
        expiration: Time in seconds for the URL to remain valid (default: 1 hour).

    Returns:
        Presigned URL as a string, or None if an error occurs.
    """
    s3_client = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION_NAME
    )
    try:
        response = s3_client.generate_presigned_url(
            'put_object',
            Params={'Bucket': bucket_name, 'Key': object_name},
            ExpiresIn=expiration
        )
    except Exception as e:
        print(f"Error generating presigned URL: {e}")
        return None
    return response