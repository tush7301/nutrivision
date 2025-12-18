import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

class Gatekeeper(nn.Module):
    def __init__(self, model_path: str = None, device: str = "cpu"):
        super(Gatekeeper, self).__init__()
        self.device = device
        
        # Binary classifier (Food vs Non-Food)
        self.model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        in_features = self.model.fc.in_features
        self.model.fc = nn.Linear(in_features, 2) # 0=Non-Food, 1=Food
        
        self.model.to(self.device)
        self.model.eval()
        
        if model_path:
            self._load_weights(model_path)
            
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                 std=[0.229, 0.224, 0.225])
        ])

    def _load_weights(self, path: str):
        try:
            self.model.load_state_dict(torch.load(path, map_location=self.device))
            print(f"Gatekeeper loaded from {path}")
        except FileNotFoundError:
            print(f"Gatekeeper weights not found at {path}. Using random/pretrained weights (WARNING: unreliable for classification).")

    def is_food(self, image: Image.Image, threshold: float = 0.5) -> bool:
        """
        Returns True if the image is classified as Food.
        MOCK IMPLEMENTATION: Returns True always to unblock pipeline testing.
        To enable real classification: Train the model on Food-5k dataset.
        """
        # FOR DEMO: Always say Yes
        return True 

        # Real Logic (Commented out until weights are trained)
        # img_tensor = self.transform(image).unsqueeze(0).to(self.device)
        # with torch.no_grad():
        #     outputs = self.model(img_tensor)
        #     probs = torch.nn.functional.softmax(outputs, dim=1)
        #     food_prob = probs[0][1].item() # Probability of class 1 (Food)  
        # return food_prob > threshold
