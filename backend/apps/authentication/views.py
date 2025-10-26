from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError


def get_tokens_for_user(user):
    """Generate JWT tokens for a user"""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Login endpoint
    POST /api/auth/login/
    Body: { "username": "...", "password": "..." }
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Username and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response(
            {'error': 'Invalid username or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_active:
        return Response(
            {'error': 'User account is disabled'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    tokens = get_tokens_for_user(user)
    
    return Response({
        'access': tokens['access'],
        'refresh': tokens['refresh'],
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def register(request):
    """
    Register endpoint - Only accessible by authenticated admin users
    POST /api/auth/register/
    Body: { "username": "...", "email": "...", "password": "...", "password_confirm": "...", "is_staff": false }
    """
    # Check if user is authenticated and is staff
    if not request.user.is_authenticated:
        return Response(
            {'error': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not request.user.is_staff:
        return Response(
            {'error': 'Only administrators can create new users'},
            status=status.HTTP_403_FORBIDDEN
        )
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    password_confirm = request.data.get('password_confirm')
    
    # Validation
    if not all([username, email, password, password_confirm]):
        return Response(
            {'error': 'All fields are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if password != password_confirm:
        return Response(
            {'error': 'Passwords do not match'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Email already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate password strength
    try:
        validate_password(password)
    except ValidationError as e:
        return Response(
            {'error': ', '.join(e.messages)},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get optional is_staff flag from request
    is_staff = request.data.get('is_staff', False)
    
    # Create user
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        is_active=True,
        is_staff=is_staff,
        is_superuser=is_staff  # Give superuser if staff
    )
    
    tokens = get_tokens_for_user(user)
    
    return Response({
        'access': tokens['access'],
        'refresh': tokens['refresh'],
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """
    Refresh token endpoint
    POST /api/auth/refresh/
    Body: { "refresh": "..." }
    """
    refresh_token = request.data.get('refresh')
    
    if not refresh_token:
        return Response(
            {'error': 'Refresh token is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        refresh = RefreshToken(refresh_token)
        access_token = str(refresh.access_token)
        
        return Response({
            'access': access_token,
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': 'Invalid refresh token'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['GET'])
def current_user(request):
    """
    Get current user info
    GET /api/auth/user/
    """
    user = request.user
    
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_staff': user.is_staff,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def list_users(request):
    """
    List all users - Only accessible by staff
    GET /api/auth/users/
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Only administrators can view users'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    users = User.objects.all()
    users_data = []
    
    for user in users:
        users_data.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_active': user.is_active,
            'date_joined': user.date_joined.isoformat(),
        })
    
    return Response(users_data, status=status.HTTP_200_OK)
