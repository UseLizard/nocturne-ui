#!/usr/bin/env python3
"""
Generate album-shadow.webp - a pre-baked shadow effect for album art
Creates a 300x300 transparent WebP with a rounded rectangle shadow
"""

from PIL import Image, ImageDraw, ImageFilter
import os

def create_album_shadow():
    # Create a larger image to accommodate shadow bleed
    # Album art is 280x280, shadow needs: 5px blur on sides + 8px offset down + 5px blur
    # So we need at least 280 + 10 (blur sides) + 8 (offset) = ~298, round up to 320 for safety
    img_size = 320
    img = Image.new('RGBA', (img_size, img_size), (0, 0, 0, 0))
    
    # Create a separate image for the shadow
    shadow_img = Image.new('RGBA', (img_size, img_size), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_img)
    
    # Position the shadow for a 280x280 album art
    # Center horizontally with room for blur: (320-280)/2 = 20px margin
    # Vertical: 20px margin + 8px shadow offset
    x = 20  # left margin for centering
    y = 20 + 8  # top margin + shadow offset
    width = 280
    height = 280
    radius = 12  # matches rounded-[12px] in CSS
    
    # Draw rounded rectangle for shadow
    # PIL's rounded_rectangle is available in newer versions
    try:
        shadow_draw.rounded_rectangle(
            [x, y, x + width, y + height],
            radius=radius,
            fill=(0, 0, 0, 80)  # Black with ~31% opacity (80/255)
        )
    except AttributeError:
        # Fallback for older PIL versions - draw a simple rectangle
        shadow_draw.rectangle(
            [x, y, x + width, y + height],
            fill=(0, 0, 0, 80)
        )
    
    # Apply Gaussian blur to create soft shadow (5px blur radius)
    shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(radius=5))
    
    # Composite the shadow onto the main image
    img.paste(shadow_img, (0, 0), shadow_img)
    
    # Ensure output directory exists
    os.makedirs('public/images', exist_ok=True)
    
    # Save as WebP with good quality
    output_path = 'public/images/album-shadow.webp'
    img.save(output_path, 'WebP', quality=90, method=6)
    
    print(f"✓ Album shadow created successfully: {output_path}")
    print(f"  Size: {img_size}x{img_size}px")
    print(f"  Shadow: 8px down, 5px blur, 25% opacity")
    print(f"  Border radius: {radius}px")

if __name__ == "__main__":
    try:
        create_album_shadow()
    except ImportError:
        print("Error: Pillow library is required")
        print("Install with: pip install Pillow")
    except Exception as e:
        print(f"Error creating shadow: {e}")