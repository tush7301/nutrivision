import os
import sys
import random
import asyncio
from pathlib import Path
from collections import defaultdict

# Add backend to path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.vision_service import vision_service

DATASET_PATH = Path("data/food-101/images")

async def evaluate():
    print(f"Loading dataset from {DATASET_PATH}...")
    if not DATASET_PATH.exists():
        print(f"Error: Dataset not found at {DATASET_PATH}")
        return

    # 1. Gather all images
    image_paths = []
    class_counts = defaultdict(int)
    
    for class_dir in DATASET_PATH.iterdir():
        if class_dir.is_dir():
            class_name = class_dir.name
            for img_file in class_dir.glob("*.jpg"):
                image_paths.append((str(img_file), class_name))
                class_counts[class_name] += 1
                
    total_images = len(image_paths)
    print(f"Found {total_images} images across {len(class_counts)} classes.")
    
    # 2. Split 80:20
    random.seed(42)  # reproducability
    random.shuffle(image_paths)
    
    split_idx = int(total_images * 0.8)
    train_set = image_paths[:split_idx]
    test_set = image_paths[split_idx:]
    
    print(f"Training Set: {len(train_set)} images (Ignored)")
    print(f"Test Set:     {len(test_set)} images (Evaluating...)")
    
    # 3. Evaluate Test Set
    # Limit to first 100 for speed in this demo, or run full if user wants
    EVAL_LIMIT = 50 
    print(f"\nRunning evaluation on random {EVAL_LIMIT} images from test set...")
    
    subset = test_set[:EVAL_LIMIT]
    
    correct_top1 = 0
    correct_top3 = 0
    gatekeeper_passed = 0
    
    for i, (img_path, true_label) in enumerate(subset):
        try:
            with open(img_path, "rb") as f:
                img_bytes = f.read()
            
            # Run prediction
            result = await vision_service.predict_food(img_bytes)
            
            # Check Metrics
            
            # 1. Gatekeeper: Did it say it's food?
            if result.get("is_food"):
                gatekeeper_passed += 1
            
            # 2. Specialist: Is label in candidates?
            candidates = result.get("candidates", [])
            predicted_labels = [c["class"] for c in candidates] # specific class name from model
            
            # Note: Food-101 labels might need normalization to match model labels
            # Model uses ImageNet labels. Food-101 labels are like 'apple_pie'.
            # We'll do a loose match or just check if our model's mapped name helps.
            # Ideally we check if `true_label` (e.g. 'hot_dog') is in the prediction.
            
            # Normalize true label for comparison (convert 'hot_dog' to 'hot dog' or keep as is depending on model)
            # The vision service returns labels like 'hot_dog' in "class" field.
            
            # Top-1
            if candidates and candidates[0]["class"] == true_label:
                correct_top1 += 1
            
            # Top-3
            if any(c["class"] == true_label for c in candidates):
                correct_top3 += 1
                
            print(f"[{i+1}/{EVAL_LIMIT}] True: {true_label:<20} Pred: {predicted_labels[0] if candidates else 'None':<20} | Top3: {'✅' if any(c['class'] == true_label for c in candidates) else '❌'}")
            
        except Exception as e:
            print(f"Error processing {img_path}: {e}")

    print("\n" + "="*30)
    print("EVALUATION RESULTS")
    print("="*30)
    print(f"Images Tested:      {len(subset)}")
    print(f"Gatekeeper Recall:  {gatekeeper_passed / len(subset):.2%} (Images accepted as food)")
    print(f"Top-1 Accuracy:     {correct_top1 / len(subset):.2%}")
    print(f"Top-3 Accuracy:     {correct_top3 / len(subset):.2%}")
    print("="*30)
    print("Note: Low accuracy might be due to label mismatches between Food-101 and ImageNet classes.")

if __name__ == "__main__":
    asyncio.run(evaluate())
