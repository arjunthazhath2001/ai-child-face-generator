from rest_framework.views import APIView
from rest_framework.response import Response
from .s3 import generate_presigned_url
from django.conf import settings
import uuid
from .models import FatherModel

class GeneratePresignedURLView(APIView):
    
    def post(self,request):
        
        filename= request.data.get('filename')
        filetype= request.data.get('filetype')
        
        if not filename or not filetype:
            return Response({"error": "Missing file name or type"})
        
        bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        object_name = f"uploads/{uuid.uuid4()}/{filename}"
        
        
        presigned_url = generate_presigned_url(bucket_name, object_name)
        
        if not presigned_url:
            return Response({"error":"Could not generate URL"})
        
        file_url= f"https://{bucket_name}.s3.{settings.AWS_REGION_NAME}.amazonaws.com/{object_name}"
        
        context = {'upload_url': presigned_url,
                   'file_url':file_url}
        
        return Response(context)


class UploadFatherImage(APIView):
    def post(self,request):
        file_url= request.data.get('file_url')
        
        if not file_url:
            return Response({"error":"File url not found"})
        
        user= request.user
        
        
        father= FatherModel.objects.create(user=user,url=file_url)
        
        if father:
            return Response({"message":"success"},status=200)
        else:
            return Response({"error":"Try uploading again"},status=400)