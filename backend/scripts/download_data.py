import torchvision.datasets as datasets
import os
from pathlib import Path

def download_data():
    # Define data path relative to this script
    root_dir = Path(__file__).parent.parent / "data"
    root_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Checking/Downloading Food-101 dataset to {root_dir}...")
    try:
        datasets.Food101(root=str(root_dir), download=True)
        print("Food-101 dataset is ready.")
    except Exception as e:
        print(f"Error downloading Food-101: {e}")

if __name__ == "__main__":
    download_data()
