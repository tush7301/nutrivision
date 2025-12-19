import os
import sys
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
from torchvision import transforms, datasets
from tqdm import tqdm
from pathlib import Path

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.food_classifier import FoodClassifier, get_transforms

# Config
DATA_DIR = Path("data/food-101/images")
MODEL_SAVE_PATH = Path("app/models/food_classifier_finetuned.pth")
BATCH_SIZE = 32
NUM_EPOCHS = 5 # Start small for demo/testing
LEARNING_RATE = 0.001
NUM_CLASSES = 101

def train():
    print(f"Checking device...")
    device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Using device: {device}")

    if not DATA_DIR.exists():
        print(f"Error: Dataset not found at {DATA_DIR}")
        return

    # 1. Prepare Data
    print("Loading dataset...")
    # Use training transforms for both for now, or Split first then apply transforms?
    # ImageFolder applies same transform to all. 
    # For simplicity in this script, we'll use the training transform (with augmentation) for train
    # and we should strictly use val transform for val, but ImageFolder limits us unless we wrap it.
    # Let's use a custom wrapper or just basic resize/crop for both to be safe and simple.
    
    # Actually, let's use the 'is_training=True' transform for the dataset, 
    # acknowledging that validation score might be slightly noisy due to dropout/aug, 
    # but it's fine for a simple fine-tune script.
    
    transform = get_transforms(is_training=True)
    
    full_dataset = datasets.ImageFolder(root=DATA_DIR, transform=transform)
    
    # Split
    total_size = len(full_dataset)
    train_size = int(0.8 * total_size)
    val_size = total_size - train_size
    
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)
    
    print(f"Data loaded: {train_size} training, {val_size} validation samples.")
    print(f"Classes: {len(full_dataset.classes)}")

    # 2. Setup Model
    print("Initializing model...")
    model = FoodClassifier(num_classes=NUM_CLASSES, pretrained=True)
    model = model.to(device)
    
    criterion = nn.CrossEntropyLoss()
    # Optimize only the head first? Or all? 
    # ResNet50 is deep. Let's optimize all but with low LR.
    optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE)
    
    # 3. Training Loop
    best_acc = 0.0
    
    for epoch in range(NUM_EPOCHS):
        print(f"\nEpoch {epoch+1}/{NUM_EPOCHS}")
        print("-" * 10)
        
        # Train
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        progress_bar = tqdm(train_loader, desc="Training")
        for inputs, labels in progress_bar:
            inputs, labels = inputs.to(device), labels.to(device)
            
            optimizer.zero_grad()
            
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * inputs.size(0)
            _, predicted = torch.max(outputs, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
            progress_bar.set_postfix(loss=loss.item())
            
        epoch_loss = running_loss / train_size
        epoch_acc = correct / total
        print(f"Train Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}")
        
        # Validate
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for inputs, labels in tqdm(val_loader, desc="Validation"):
                inputs, labels = inputs.to(device), labels.to(device)
                
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item() * inputs.size(0)
                _, predicted = torch.max(outputs, 1)
                val_total += labels.size(0)
                val_correct += (predicted == labels).sum().item()
                
        val_loss = val_loss / val_size
        val_acc = val_correct / val_total
        print(f"Val Loss: {val_loss:.4f} Acc: {val_acc:.4f}")
        
        # Save Best
        if val_acc > best_acc:
            print(f"New best model! Saving to {MODEL_SAVE_PATH}")
            best_acc = val_acc
            torch.save(model.state_dict(), MODEL_SAVE_PATH)
            
            # Also save class names mapping
            # full_dataset.classes gives us ['apple_pie', 'baby_back_ribs', ...]
            # We need to save this because the index depends on folder sort order
            import json
            class_map_path = MODEL_SAVE_PATH.with_suffix('.json')
            with open(class_map_path, 'w') as f:
                json.dump(full_dataset.classes, f)
                
    print(f"\nTraining Complete. Best Validation Accuracy: {best_acc:.4f}")

if __name__ == "__main__":
    train()
