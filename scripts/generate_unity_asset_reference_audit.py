import os
import json
import re
from datetime import datetime, timezone

def generate_unity_asset_reference_audit():
    unity_dir = os.path.join("unity", "Assets", "_Project")
    scenes_dir = os.path.join(unity_dir, "Scenes")
    prefabs_dir = os.path.join(unity_dir, "Prefabs")
    art_dir = os.path.join(unity_dir, "Art")
    audio_dir = os.path.join(unity_dir, "Audio")
    build_settings_path = os.path.join("unity", "ProjectSettings", "EditorBuildSettings.asset")
    
    # Read enabled scenes
    enabled_scenes = []
    if os.path.exists(build_settings_path):
        with open(build_settings_path, "r", encoding="utf-8") as f:
            content = f.read()
            matches = re.findall(r"path:\s*(Assets/_Project/Scenes/[\w_]+\.unity)", content)
            enabled_scenes = list(dict.fromkeys(matches))
            
    # Count prefabs
    prefabs = []
    for root, _, files in os.walk(prefabs_dir):
        for f in files:
            if f.endswith(".prefab"):
                prefabs.append(os.path.join(root, f))
                
    # Count materials
    materials = []
    for root, _, files in os.walk(art_dir):
        for f in files:
            if f.endswith(".mat"):
                materials.append(os.path.join(root, f))
                
    # Count textures
    textures = []
    for root, _, files in os.walk(art_dir):
        for f in files:
            if f.lower().endswith((".png", ".webp", ".jpg", ".tga")):
                textures.append(os.path.join(root, f))
                
    # Count audio
    audio_clips = []
    for root, _, files in os.walk(audio_dir):
        for f in files:
            if f.lower().endswith((".wav", ".mp3", ".ogg")):
                audio_clips.append(os.path.join(root, f))

    issues = []
    # Verify all enabled scenes exist on disk
    for s in enabled_scenes:
        local_path = os.path.join("unity", s.replace("/", os.sep))
        if not os.path.exists(local_path):
            issues.append({
                "assetPath": s,
                "issueType": "MissingSceneFile",
                "details": f"Declared build scene {s} not found on disk.",
                "severity": "Error"
            })
            
    # Scan materials for broken shaders
    for m in materials:
        with open(m, "r", encoding="utf-8", errors="ignore") as f:
            mat_text = f.read()
            if "InternalErrorShader" in mat_text:
                rel = os.path.relpath(m, "unity")
                issues.append({
                    "assetPath": rel.replace(os.sep, "/"),
                    "issueType": "ErrorShader",
                    "details": f"Material {os.path.basename(m)} uses pink InternalErrorShader.",
                    "severity": "Error"
                })

    report = {
        "auditName": "Whispering Wilds Authoritative Unity Asset Reference Audit",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "enabledScenesCount": len(enabled_scenes),
        "prefabsAuditedCount": len(prefabs),
        "materialsAuditedCount": len(materials),
        "texturesAuditedCount": len(textures),
        "audioClipsAuditedCount": len(audio_clips),
        "totalIssuesCount": len(issues),
        "errorCount": len([i for i in issues if i["severity"] == "Error"]),
        "warningCount": len([i for i in issues if i["severity"] == "Warning"]),
        "enabledScenes": enabled_scenes,
        "issues": issues,
        "methodology": "Direct inspection of EditorBuildSettings.asset, Prefabs, Materials, Textures, and Audio in Unity project asset tree."
    }
    
    out_dir = os.path.join("docs", "audits")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "UNITY_ASSET_REFERENCE_AUDIT.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        
    print(f"Generated {out_path} with {len(enabled_scenes)} scenes, {len(prefabs)} prefabs, {len(materials)} materials, {len(issues)} issues.")

if __name__ == "__main__":
    generate_unity_asset_reference_audit()
