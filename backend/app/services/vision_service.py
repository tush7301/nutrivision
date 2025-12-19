import torch
from torchvision.models import ResNet50_Weights
from PIL import Image
import io
import json
import os
from app.models.food_classifier import FoodClassifier, get_transforms

class VisionService:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
        print(f"VisionService using device: {self.device}")
        
        # Load Fine-Tuned Model
        self.model = FoodClassifier(num_classes=101, pretrained=False)
        model_path = "app/models/food_classifier_finetuned.pth"
        
        if os.path.exists(model_path):
            print(f"Loading fine-tuned weights from {model_path}")
            state_dict = torch.load(model_path, map_location=self.device)
            self.model.load_state_dict(state_dict)
        else:
            print("WARNING: Fine-tuned weights not found. Using random init (expect poor results).")
            
        self.model.to(self.device)
        self.model.eval()
        
        # Load Transforms
        self.transforms = get_transforms(is_training=False)
        
        # Load Class Mapping
        class_map_path = "app/models/food_classifier_finetuned.json"
        if os.path.exists(class_map_path):
            with open(class_map_path, 'r') as f:
                self.categories = json.load(f)
        else:
            print("WARNING: Class mapping not found. Using indices.")
            self.categories = [str(i) for i in range(101)]
            
    async def predict_food(self, image_bytes: bytes):
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = self.transforms(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(tensor)
            probs = torch.nn.functional.softmax(outputs, dim=1)
            top3_probs, top3_indices = torch.topk(probs, 3)

        candidates = []
        
        for i in range(3):
            idx = top3_indices[0][i].item()
            prob = top3_probs[0][i].item()
            
            if idx < len(self.categories):
                name = self.categories[idx]
            else:
                name = f"Class_{idx}"
            
            # Formatting: "hot_pot" -> "Hot Pot"
            formatted_name = name.replace("_", " ").title()
            
            candidates.append({"food": formatted_name, "class": name, "confidence": prob})
            
        # Since this model is trained ONLY on food, it assumes the input IS food.
        # We lose the "Non-Food" rejection capability of the original ImageNet model 
        # unless we train a specific "Background" class or use an ensemble.
        # For now, we assume valid food input for the specialist.
        
        return {
            "food_name": candidates[0]["food"],
            "confidence": candidates[0]["confidence"],
            "class_id": 0,
            "is_food": True, 
            "candidates": candidates
        }
    
    async def estimate_portion(self, image_bytes: bytes, food_name: str = "unknown"):
        from app.core.portion_data import PORTION_HEURISTICS, DEFAULT_WEIGHT
        
        weight = DEFAULT_WEIGHT
        # Simple fuzzy matching
        lower_name = food_name.lower()
        for key, val in PORTION_HEURISTICS.items():
            if key in lower_name:
                weight = val
                break
                
        return {
            "portion_size": f"standard ({weight}g)",
            "estimated_weight_g": weight,
            "confidence": 0.8
        }

vision_service = VisionService()
