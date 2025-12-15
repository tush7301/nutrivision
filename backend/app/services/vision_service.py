import torch
from PIL import Image
import io
from app.models.food_classifier import FoodClassifier, get_transforms
from app.core.config import settings
import json
from pathlib import Path

class VisionService:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = FoodClassifier(num_classes=101, pretrained=True) # Load pretrained initially
        self.model.to(self.device)
        self.model.eval()
        self.transforms = get_transforms(is_training=False)
        
        # Load class names (Food-101 classes)
        # For now, we'll try to load from a file or use a placeholder list if file missing
        self.class_names = self._load_class_names()

    def _load_class_names(self):
        # Placeholder: In a real scenario, we load 'classes.json' or 'labels.txt'
        # generated during data prep.
        # Returning generic list or checking for file.
        classes_path = Path("data/food-101/meta/classes.txt")
        if classes_path.exists():
            with open(classes_path, "r") as f:
                return [line.strip() for line in f.readlines()]
        return [f"Class_{i}" for i in range(101)]

    async def predict_food(self, image_bytes: bytes):
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = self.transforms(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(tensor)
            _, predicted = torch.max(outputs, 1)
            
        class_idx = predicted.item()
        class_name = self.class_names[class_idx] if class_idx < len(self.class_names) else "Unknown"
        confidence = torch.nn.functional.softmax(outputs, dim=1)[0][class_idx].item()
        
        return {
            "food_name": class_name,
            "confidence": confidence,
            "class_id": class_idx
        }
    
    async def estimate_portion(self, image_bytes: bytes):
        # Heuristic portion estimation
        # In a real system, this would use depth estimation or reference objects
        # For now, we return a standard "medium" portion with a volume proxy
        return {
            "portion_size": "medium",
            "estimated_weight_g": 300, # Mock value
            "confidence": 0.7
        }

vision_service = VisionService()
