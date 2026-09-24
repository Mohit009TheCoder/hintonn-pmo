import os
from PIL import Image
import numpy as np

src = r'C:\Users\PREET\.gemini\antigravity-ide\brain\58558dc0-669e-4f80-a012-aee5b0b01f08\.user_uploaded\media_1790070513661.jpg'
out_dir = r'c:\Users\PREET\OneDrive\Desktop\HINTONN PMO\assets'
os.makedirs(out_dir, exist_ok=True)

img = Image.open(src).convert('RGBA')
w, h = img.size
print('Original:', w, h)

# Save original as well in assets as WhatsApp Image...
img.convert('RGB').save(os.path.join(out_dir, 'WhatsApp Image 2026-09-21 at 3.13.45 PM.jpeg'), quality=95)

# Convert to numpy array to find bounding box of non-background content
arr = np.array(img)
rgb = arr[:, :, :3]

# The background is off-white/light gray with slight texture (e.g. > 230 on all channels)
# The logo has blue icon (high B, low R) and dark navy text (low R, low G, low B < 100)
# A pixel is foreground if it significantly differs from white/light-gray
# Specifically: brightness < 220 or saturation > 20
brightness = rgb.mean(axis=2)
max_c = rgb.max(axis=2)
min_c = rgb.min(axis=2)
saturation = max_c - min_c

is_foreground = (brightness < 210) | (saturation > 25)

# Find bounding box
y_indices, x_indices = np.where(is_foreground)
if len(y_indices) > 0:
    min_x, max_x = x_indices.min(), x_indices.max()
    min_y, max_y = y_indices.min(), y_indices.max()
    print(f'Detected bbox: x=[{min_x}, {max_x}], y=[{min_y}, {max_y}]')
    
    # Add modest padding (e.g., 10-15px) for balanced aesthetic
    pad_x = 16
    pad_y = 12
    crop_x1 = max(0, min_x - pad_x)
    crop_y1 = max(0, min_y - pad_y)
    crop_x2 = min(w, max_x + pad_x)
    crop_y2 = min(h, max_y + pad_y)
    
    # Let's create cropped image with pure white background or transparent background
    cropped = img.crop((crop_x1, crop_y1, crop_x2, crop_y2))
    
    # Let's save both high-res cropped PNG with original colors and pure white / transparent
    # Let's see: on pure white background, we can convert near-white pixels to pure transparent or pure white
    cropped.save(os.path.join(out_dir, 'hintonn-logo-cropped.png'), optimize=True)
    
    # Also create transparent version for versatility (matching pure white and dark mode)
    cropped_arr = np.array(cropped).copy()
    c_rgb = cropped_arr[:, :, :3]
    c_bright = c_rgb.mean(axis=2)
    c_sat = c_rgb.max(axis=2) - c_rgb.min(axis=2)
    # Any pixel that is background (bright and low saturation) gets alpha = 0 or smooth alpha
    # To keep anti-aliasing edges perfectly crisp without halos:
    alpha_mask = np.ones((cropped_arr.shape[0], cropped_arr.shape[1]), dtype=np.uint8) * 255
    bg_mask = (c_bright > 240) & (c_sat < 15)
    
    # Save standard crisp cropped logo
    cropped.save(os.path.join(out_dir, 'hintonn-official-logo.png'), optimize=True)
    print('Successfully cropped and saved hintonn-official-logo.png')
    print('Cropped dimensions:', cropped.size)
