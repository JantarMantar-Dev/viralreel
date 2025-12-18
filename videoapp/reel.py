import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy import ImageClip, concatenate_videoclips

def create_color_image(color, text, size=(1080, 1920)):
    """Creates a PIL image with the given color and text centered."""
    img = Image.new('RGB', size, color=color)
    draw = ImageDraw.Draw(img)
    
    # Try to load a font, fallback to default if not found
    try:
        # Generic large font for impact
        font = ImageFont.truetype("arial.ttf", 100)
    except IOError:
        font = ImageFont.load_default(size=100) # Fallback to default, size param for Pillow > 10

    # Get text bounding box to center it
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
    text_width = right - left
    text_height = bottom - top
    
    position = ((size[0] - text_width) // 2, (size[1] - text_height) // 2)
    
    # Draw text in white or black depending on brightness could be nice, 
    # but let's stick to black/white for simplicity or opposite color. 
    # For now, white text with black outline for visibility
    
    # Simple outline approach
    x, y = position
    outline_color = "black"
    text_color = "white"
    stroke_width = 3
    
    draw.text(position, text, font=font, fill=text_color, stroke_width=stroke_width, stroke_fill=outline_color)
    
    return np.array(img)

def generate_reel(output_path: str = "reel.mp4"):
    """Generates a 5-second reel with changing colors."""
    colors = [
        ("Red", "red"),
        ("Blue", "blue"),
        ("Green", "green"),
        ("Yellow", "yellow"),
        ("Purple", "purple")
    ]
    
    clips = []
    
    for name, color in colors:
        img_array = create_color_image(color, name)
        # Create clip with 1 second duration
        clip = ImageClip(img_array).with_duration(1.0).with_fps(24)
        clips.append(clip)
        
    final_clip = concatenate_videoclips(clips)
    final_clip.write_videofile(output_path, fps=24)
    return output_path

if __name__ == "__main__":
    generate_reel()
