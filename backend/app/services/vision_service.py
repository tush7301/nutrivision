import torch
from torchvision.models import resnet50, ResNet50_Weights
from PIL import Image
import io

class VisionService:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Use standard ImageNet weights which know about cars AND pizza
        weights = ResNet50_Weights.IMAGENET1K_V2
        self.model = resnet50(weights=weights)
        self.model.to(self.device)
        self.model.eval()
        
        self.transforms = weights.transforms()
        self.categories = weights.meta["categories"]
        
        # Heuristic list of keywords that indicate "Food" in ImageNet classes
        # This acts as our Zero-Shot Gatekeeper
        self.food_keywords = [
            "pizza", "burger", "sandwich", "meat", "soup", "salad", "bread",
            "cake", "chocolate", "fruit", "vegetable", "berry", "coffee",
            "tea", "wine", "beer", "juice", "chicken", "fish", "steak",
            "egg", "cheese", "pasta", "rice", "noodle", "sauce", "cream",
            "pie", "cookie", "muffin", "bagel", "toast", "pancake", "waffle",
            "cereal", "yogurt", "lemon", "apple", "banana", "orange", "grape",
            "broccoli", "carrot", "corn", "potato", "tomato", "cucumber",
            "mushroom", "nut", "seed", "bean", "lentil", "curry", "stew",
            "roast", "grill", "fry", "bake", "boil", "cook", "dish", "meal",
            "appetizer", "dessert", "snack", "beverage", "drink", "hotdog",
            "taco", "burrito", "sushi", "sashimi", "ramen", "pho", "chowder",
            "bisque", "broth", "custard", "pudding", "sorbet", "gelato",
            "ice cream", "sherbet", "candy", "sweet", "treat", "loaf",
            "bun", "roll", "biscuit", "scone", "croissant", "danish", "donut",
            "baguette", "pretzel", "cracker", "chip", "crisp", "popcorn",
            "nacho", "dip", "salsa", "guacamole", "hummus", "pesto", "tapenade",
            "spread", "jam", "jelly", "honey", "syrup", "sugar", "spice",
            "herb", "condiment", "salt", "pepper", "vinegar", "oil", "fat",
            "butter", "margarine", "lard", "shortening", "mayonnaise", "mustard",
            "ketchup", "relish", "chutney", "pickle", "olive", "caper", "anchovy",
            "caviar", "roe", "tofu", "tempeh", "seitan", "milk", "cheese",
            "yogurt", "kefir", "butter", "cream", "whey", "casein", "lactose",
            "egg", "espresso", "latte", "cappuccino", "macchiato", "mocha", "tea",
            "chai", "matcha", "cocoa", "chocolate", "soda", "cola", "pop",
            "tonic", "water", "juice", "cider", "punch", "lemonade", "limeade",
            "squash", "cordial", "syrup", "beer", "wine", "cider", "mead", "sake",
            "spirits", "liquor", "cocktail", "mocktail", "smoothie", "shake",
            "slush", "frappe", "float", "malt", "soup", "chowder", "bisque", "stew",
            "broth", "consomme", "gumbo", "jambalaya", "curry", "chili", "salad",
            "slaw", "tossed", "caesar", "greek", "caprese", "waldorf", "nicoise",
            "cobb", "chef", "fruit", "pasta", "potato", "bean", "grain", "rice",
            "quinoa", "couscous", "bulgur", "millet", "barley", "baking", "baked",
            "roast", "grilled", "fried", "boiled", "steamed", "poached", "raw",
            "fresh", "frozen", "canned", "dried", "pickled", "smoked", "cured",
            "salted", "sweetened", "unsweetened", "seasoned", "unseasoned",
            "spicy", "hot", "mild", "sweet", "sour", "bitter", "salty", "umami"
        ]

    def _is_food_label(self, label: str) -> bool:
        label = label.lower().replace("_", " ")
        # Specific overrides for typical confusing items
        if "car" in label or "wheel" in label or "dog" in label and "hotdog" not in label:
            return False
        return any(keyword in label for keyword in self.food_keywords)

    async def predict_food(self, image_bytes: bytes):
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = self.transforms(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(tensor)
            probs = torch.nn.functional.softmax(outputs, dim=1)
            top3_probs, top3_indices = torch.topk(probs, 3)

        candidates = []
        is_food_confident = False
        
        for i in range(3):
            idx = top3_indices[0][i].item()
            prob = top3_probs[0][i].item()
            name = self.categories[idx]
            
            # Formatting: "hot_pot" -> "Hot Pot"
            formatted_name = name.replace("_", " ").title()
            
            candidates.append({"food": formatted_name, "class": name, "confidence": prob})
            
            # If the primary or secondary prediction is definitely food, we accept it
            if self._is_food_label(name):
                is_food_confident = True

        # Phase 1: Gatekeeper Check (Logic based)
        # If the Top-1 prediction is clearly NON-FOOD (e.g., "sports_car"), reject.
        top_category = candidates[0]["class"]
        
        if not self._is_food_label(top_category):
             return {
                "food_name": "Non-Food Item",
                "confidence": candidates[0]["confidence"],
                "class_id": -1,
                "is_food": False,
                "candidates": candidates
            }

        # Success path
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
