from django.urls import path
from .views import *


urlpatterns=[
    
    path('presigned-url/',GeneratePresignedURLView.as_view()),

]