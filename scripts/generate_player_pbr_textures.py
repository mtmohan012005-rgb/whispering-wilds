import os
from PIL import Image, ImageDraw, ImageFilter

def generate_player_pbr_textures():
    size = 2048
    half = 1024
    
    src_dir = r"unity/Assets/_Project/Art/Characters/Procedural/Textures"
    dest_dirs = [
        r"assets/characters/player/textures",
        r"unity/Assets/_Project/Art/Models/Characters/Player/textures"
    ]
    
    for d in dest_dirs:
        os.makedirs(d, exist_ok=True)
        
    def load_and_tile(name, target_size=(half, half)):
        path = os.path.join(src_dir, name)
        if os.path.exists(path):
            img = Image.open(path).convert("RGBA")
            # Tile or resize smoothly
            tiled = Image.new("RGBA", target_size)
            w, h = img.size
            for x in range(0, target_size[0], w):
                for y in range(0, target_size[1], h):
                    tiled.paste(img, (x, y))
            return tiled
        else:
            return Image.new("RGBA", target_size, (128, 128, 128, 255))
            
    # 1. Albedo Map
    albedo = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    
    # Q1: Head & Face (Top-Left)
    head_skin = load_and_tile("skin_wheat.png")
    features = load_and_tile("features.png")
    head_combined = Image.alpha_composite(head_skin, Image.blend(head_skin, features, 0.4))
    albedo.paste(head_combined, (0, 0))
    
    # Q2: Hair (Top-Right)
    hair = load_and_tile("hair_black.png")
    albedo.paste(hair, (half, 0))
    
    # Q3: Upper Body / Cotton Shirt & Thundu (Bottom-Left)
    shirt = load_and_tile("fabric_white.png")
    thundu = load_and_tile("thundu_red.png", (half // 3, half))
    # Paste thundu as an angled shoulder sash on the shirt
    shirt.paste(thundu, (half - (half // 3), 0))
    albedo.paste(shirt, (0, half))
    
    # Q4: Lower Body / Handloom Veshti with Gold Zari Border (Bottom-Right)
    veshti = load_and_tile("veshti_white.png")
    # Draw gold border along lower edge of veshti
    draw_v = ImageDraw.Draw(veshti)
    gold_border_y = half - 80
    draw_v.rectangle([0, gold_border_y, half, gold_border_y + 30], fill=(212, 175, 55, 255))
    draw_v.rectangle([0, gold_border_y + 40, half, gold_border_y + 50], fill=(180, 140, 30, 255))
    albedo.paste(veshti, (half, half))
    
    # 2. Normal Map
    normal = Image.new("RGBA", (size, size), (128, 128, 255, 255))
    head_norm = load_and_tile("skin_wheat_normal.png")
    hair_norm = load_and_tile("hair_black_normal.png")
    shirt_norm = load_and_tile("fabric_white_normal.png")
    veshti_norm = load_and_tile("veshti_white_normal.png")
    
    normal.paste(head_norm, (0, 0))
    normal.paste(hair_norm, (half, 0))
    normal.paste(shirt_norm, (0, half))
    normal.paste(veshti_norm, (half, half))
    
    # 3. Roughness Map (Greyscale)
    # Skin: ~120 (0.47), Hair: ~100 (0.39), Shirt: ~200 (0.78), Veshti: ~190, Gold Border: ~60 (0.23)
    roughness = Image.new("L", (size, size), 128)
    draw_r = ImageDraw.Draw(roughness)
    # Head/Skin
    draw_r.rectangle([0, 0, half, half], fill=120)
    # Hair
    draw_r.rectangle([half, 0, size, half], fill=95)
    # Shirt
    draw_r.rectangle([0, half, half, size], fill=200)
    # Veshti
    draw_r.rectangle([half, half, size, size], fill=190)
    # Gold border on veshti
    draw_r.rectangle([half, half + gold_border_y, size, half + gold_border_y + 50], fill=60)
    # Subtle procedural texture noise on roughness for realistic microscopic variations
    noise = Image.effect_noise((size, size), 2.0).convert("L")
    roughness = Image.blend(roughness, noise, 0.08)
    
    # 4. Ambient Occlusion Map (Greyscale)
    # Base AO is light (240), with occluded seams and creases (100-160)
    ao = Image.new("L", (size, size), 245)
    draw_ao = ImageDraw.Draw(ao)
    # Neck crease
    draw_ao.rectangle([0, half - 40, half, half], fill=160)
    # Hairline boundary
    draw_ao.rectangle([half - 30, 0, half + 30, half], fill=170)
    # Waistline seam
    draw_ao.line([0, half, size, half], fill=130, width=12)
    # Veshti folds
    for f_x in range(half + 100, size, 120):
        draw_ao.line([f_x, half, f_x + 30, size], fill=175, width=16)
    ao = ao.filter(ImageFilter.GaussianBlur(radius=8))
    
    # Save both WebP and PNG formats
    maps = {
        "player_albedo": albedo,
        "player_normal": normal,
        "player_roughness": roughness,
        "player_ao": ao
    }
    
    for name, img in maps.items():
        for d in dest_dirs:
            webp_path = os.path.join(d, f"{name}.webp")
            png_path = os.path.join(d, f"{name}.png")
            img.save(webp_path, "WEBP", quality=95)
            img.save(png_path, "PNG")
            print(f"Generated: {webp_path} ({os.path.getsize(webp_path)} bytes)")
            print(f"Generated: {png_path} ({os.path.getsize(png_path)} bytes)")

if __name__ == "__main__":
    generate_player_pbr_textures()
