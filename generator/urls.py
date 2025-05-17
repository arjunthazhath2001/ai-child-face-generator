from django.urls import path
from .views import *


urlpatterns=[
    
    path('api/get-presigned-url/',GeneratePresignedURLView.as_view()),
    path('uploadfather/',UploadFatherImage.as_view()),
    path('uploadmother/',UploadMotherImage.as_view()),
    path('generate/',GenerateChildImage.as_view()),
    

]