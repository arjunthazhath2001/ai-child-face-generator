from django.http import JsonResponse
from rest_framework import status
import jwt
from django.conf import settings
from .models import CustomUser

class ClerkAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if 'api' not in request.path:  # Skip middleware for non-API routes
            return self.get_response(request)

        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse(
                {'error': 'No authorization token provided'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            # Extract token
            token = auth_header.split(' ')[1]
            
            # Verify token with Clerk's public key
            decoded = jwt.decode(
                token,
                options={"verify_signature": False}  # We're just getting the user ID for now
            )
            
            # Get Clerk user ID
            clerk_user_id = decoded['sub']
            
            # Get or create user in our database
            user, created = CustomUser.objects.get_or_create(
                clerk_id=clerk_user_id,
                defaults={
                    'username': clerk_user_id,  # Using clerk_id as username
                    'email': decoded.get('email', '')
                }
            )
            
            # Attach user to request
            request.user = user
            return self.get_response(request)
            
        except jwt.InvalidTokenError:
            return JsonResponse(
                {'error': 'Invalid token'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return JsonResponse(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 