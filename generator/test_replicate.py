import replicate
from replicate.client import Client
import os
from dotenv import load_dotenv

load_dotenv()

replicate = Client(api_token=os.environ["REPLICATE_API_TOKEN"])

def generateAIMixedImage(template, target):
    print("sent to the model")
    print("template:", template)
    print("target:", target)

    try:
        output = replicate.run(
            "lucataco/modelscope-facefusion:52edbb2b42beb4e19242f0c9ad5717211a96c63ff1f0b0320caa518b2745f4f7",
            input={
                "template_image": template,
                "user_image": target
            }
        )

        print("Replicate output:", output)
        return output

    except Exception as e:
        print("Error calling replicate:", str(e))
        return None
