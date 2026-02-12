from PIL import Image, ImageDraw, ImageFont, ImageFilter

# 1. Image Settings
WIDTH = 1024
HEIGHT = 500
BG_COLOR_1 = (16, 185, 129)  # #10b981 (Primary Green)
BG_COLOR_2 = (13, 148, 136)  # Tealish Darker Green

def create_gradient(width, height, c1, c2):
    """Creates a vertical gradient image."""
    base = Image.new('RGB', (width, height), c1)
    top = Image.new('RGB', (width, height), c2)
    mask = Image.new('L', (width, height))
    mask_data = []
    for y in range(height):
        mask_data.extend([int(255 * (y / height))] * width)
    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base

# 2. Base Image
img = create_gradient(WIDTH, HEIGHT, BG_COLOR_1, BG_COLOR_2)
draw = ImageDraw.Draw(img)

# 3. Add Geometric Decoration (Circle/Curve)
draw.ellipse((-100, -100, 300, 300), fill=(255, 255, 255, 30), outline=None)
draw.ellipse((800, 300, 1100, 600), fill=(255, 255, 255, 30), outline=None)
draw.line((0, 400, 1024, 100), fill=(255, 255, 255, 40), width=3)

# 4. Text - Center
try:
    font_path = "C:\\Windows\\Fonts\\arial.ttf"
    font_size = 100
    font = ImageFont.truetype(font_path, font_size)
    text = "FoodCoach"
    
    # Calculate text size (using textbbox for newer Pillow versions found often)
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
    except AttributeError:
        # Fallback for older Pillow
        text_w, text_h = draw.textsize(text, font=font)
    
    x = (WIDTH - text_w) / 2
    y = (HEIGHT - text_h) / 2
    
    # Shadow
    draw.text((x+4, y+4), text, font=font, fill=(0, 0, 0, 50))
    # Main Text
    draw.text((x, y), text, font=font, fill=(255, 255, 255))
    
    # Subtext
    sub_font_size = 40
    sub_font = ImageFont.truetype(font_path, sub_font_size)
    sub_text = "Your AI Nutritionist"
    
    try:
        sub_bbox = draw.textbbox((0, 0), sub_text, font=sub_font)
        sub_w = sub_bbox[2] - sub_bbox[0]
    except AttributeError:
        sub_w, sub_h = draw.textsize(sub_text, font=sub_font)
        
    sub_x = (WIDTH - sub_w) / 2
    sub_y = y + text_h + 20
    
    draw.text((sub_x+2, sub_y+2), sub_text, font=sub_font, fill=(0, 0, 0, 50))
    draw.text((sub_x, sub_y), sub_text, font=sub_font, fill=(236, 253, 245)) # lighter teal

except IOError:
    print("Font not found, skipping text")

# 5. Save
output_path = "feature_graphic.png"
img.save(output_path)
print(f"Image saved to {output_path}")
