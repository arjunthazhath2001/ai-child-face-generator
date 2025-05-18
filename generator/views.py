from rest_framework.views import APIView
from rest_framework.response import Response
from .s3 import generate_presigned_url
from django.conf import settings
import uuid
from .models import FatherModel,MotherModel, ChildImage,CustomUser
from rest_framework.permissions import IsAuthenticated
from .test_replicate import generateAIMixedImage
from concurrent.futures import ThreadPoolExecutor

executor= ThreadPoolExecutor(max_workers=2)

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
        

class GenerateChildImage(APIView):
    # permission_classes=[IsAuthenticated]

    def post(self,request):
        user= CustomUser.objects.get(id=1)

        template_id= int(request.data.get('father_id'))
        target_id= int(request.data.get('mother_id'))


        if not all([template_id,target_id]):
            return Response({"error":"Missing required fields"})

        try:
            template= FatherModel.objects.get(id=template_id,user=user)
            target= MotherModel.objects.get(id=target_id,user=user)
            
        except FatherModel.DoesNotExist:
            return Response({"error":"Invalid template_id"})
        
        def task():
            print("calling replicate")
            url= generateAIMixedImage(template.url,target.url)
            print("child_url"+ str(url))
            if url:
                ChildImage.objects.create(user=user,url=url,father=template,mother=target) 
            else:
                print("Failed")
        executor.submit(task)
        return Response({"message": "processing"})
        

class CheckChildImage(APIView):
    def get(self,request,father_id,mother_id):
        user= CustomUser.objects.get(id=1)
        
        try:
            child= ChildImage.objects.get(user=user,father_id=father_id,mother_id=mother_id)
            return Response({"status":"ready","url":child.url})
        except ChildImage.DoesNotExist:
            return Response({"status":"processing"})