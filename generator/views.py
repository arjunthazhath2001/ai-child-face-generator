from rest_framework.views import APIView
from rest_framework.response import Response
from .s3 import generate_presigned_url
from django.conf import settings
import uuid
from .models import FatherModel,MotherModel, ChildImage,CustomUser
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model

class GeneratePresignedURLView(APIView):
    
    def post(self,request):
        print("hi")
        
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
    # permission_classes=[IsAuthenticated]

    def post(self,request):
        file_url= request.data.get('file_url')
        
        if not file_url:
            return Response({"error":"File url not found"})
        
        user= CustomUser.objects.get(id=1)
        
        
        father= FatherModel.objects.create(user=user,url=file_url)
        
        if father:
            return Response({"message":father.id},status=200)
        else:
            return Response({"error":"Try uploading again"},status=400)
        
    
class UploadMotherImage(APIView):
    # permission_classes=[IsAuthenticated]
    def post(self,request):
        file_url= request.data.get('file_url')
        
        if not file_url:
            return Response({"error":"File url not found"})
        
        user= CustomUser.objects.get(id=1)

        
        
        mother= MotherModel.objects.create(user=user,url=file_url)
        
        if mother:
            return Response({"message":mother.id},status=200)
        else:
            return Response({"error":"Try uploading again"},status=400)
        

# class GenerateChildImage(APIView):
#     permission_classes=[IsAuthenticated]
    
#     def post(self,request):
#         user= request.user
        
#         father_id= request.data.get('father_id')
#         mother_id= request.data.get('mother_id')
        
#         father_weight= request.data.get('father_weight')
#         mother_weight= request.data.get('mother_weight')
        
#         if not all([father_id,father_weight,mother_weight,mother_id]):
#             return Response({"error":"Missing required fields"})
        
#         try:
#             father= FatherModel.objects.get(id=father_id,user=user)
#             mother= MotherModel.objects.get(id=mother_id,user=user)
#         except FatherModel.DoesNotExist:
#             return Response({"error":"Invalid father_id"})
                
        
        
#         url= generateAIMixedImage(father.url,mother.url,father_weight,mother_weight)--> api call to an image gen model
        
        
#         child= ChildImage.objects.create(user=user,url=url,father=father,mother=mother) 
               
#         return Response("Here is the child image")