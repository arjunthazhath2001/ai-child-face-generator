from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    clerk_id = models.CharField(max_length=255, unique=True, null=True)
    # Add any other fields you need

    def __str__(self):
        return self.username


class FatherModel(models.Model):
    url= models.URLField(unique=True)
    user= models.ForeignKey(CustomUser,on_delete=models.CASCADE)
    uploaded_on= models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table="father"
    


class MotherModel(models.Model):
    url= models.URLField(unique=True)
    user= models.ForeignKey(CustomUser,on_delete=models.CASCADE)
    uploaded_on= models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table="mother"


class ChildImage(models.Model):
    url= models.URLField(unique=True)
    user= models.ForeignKey(CustomUser,on_delete=models.CASCADE)
    father= models.ForeignKey(FatherModel,on_delete=models.CASCADE)
    mother= models.ForeignKey(MotherModel,on_delete=models.CASCADE)
    generated_on= models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table="child"
