import torch
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from app.models.food_classifier import FoodClassifier
from pathlib import Path
import sys
import os

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent))

def evaluate():
    print("Starting Model Evaluation...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    try:
        model = FoodClassifier(num_classes=101, pretrained=True).to(device)
        model.eval()
        print("Model loaded.")
    except Exception as e:
        print(f"Failed to load model: {e}")
        return

    transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    data_root = Path(__file__).parent.parent / "data"
    
    try:
        # Check if data exists, if not, download might take too long for this interaction
        if not (data_root / "food-101").exists():
            print("Food-101 dataset not found at expected path. Skipping full evaluation.")
            print("Please run 'python scripts/download_data.py' to download the dataset.")
            return

        test_data = datasets.Food101(root=str(data_root), split='test', transform=transform, download=False)
        
        # Evaluate on a small subset for demonstration speed
        subset_size = 50
        indices = list(range(subset_size))
        subset = torch.utils.data.Subset(test_data, indices)
        
        loader = DataLoader(subset, batch_size=10, shuffle=False)
        
        correct = 0
        total = 0
        
        with torch.no_grad():
            for images, labels in loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                _, predicted = torch.max(outputs.data, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
        
        acc = 100 * correct / total
        print(f"Evaluation on {total} images: Accuracy = {acc:.2f}%")
        
    except Exception as e:
        print(f"Evaluation Error: {e}")

if __name__ == "__main__":
    evaluate()
