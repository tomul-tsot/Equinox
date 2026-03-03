import os
from PIL import Image

image_dir = r"C:\Users\AJ Kaarthick\.gemini\antigravity\brain\eb975365-bbd7-4314-9d35-08b13fc54574"
images = [f for f in os.listdir(image_dir) if ("timing_" in f or "seq_" in f) and f.endswith(".png")]
images.sort()

for img in images:
    try:
        path = os.path.join(image_dir, img)
        with Image.open(path) as i:
            w, h = i.size
            if w > 0:
                print(f"{img}: center pixel = {i.getpixel((w//2, h//2))}")
    except Exception as e:
        print(f"Error reading {img}: {e}")
