import os
import uuid

dir_path = os.path.join("unity", "Assets", "_Project", "Art", "Models", "Characters", "Player", "textures")

def make_meta(filename, is_normal=False, is_srgb=True):
    meta_path = os.path.join(dir_path, filename + ".meta")
    if os.path.exists(meta_path):
        return
    guid = uuid.uuid4().hex
    tex_type = 1 if is_normal else 0
    srgb = 1 if is_srgb else 0
    content = f"""fileFormatVersion: 2
guid: {guid}
TextureImporter:
  internalIDToNameTable: []
  externalObjects: {{}}
  serializedVersion: 13
  mipmaps:
    mipMapMode: 0
    enableMipMap: 1
    sRGBTexture: {srgb}
    linearTexture: {1 - srgb}
    fadeOut: 0
    borderMipMap: 0
    mipMapsPreserveCoverage: 0
    alphaTestReferenceValue: 0.5
    mipMapFadeDistanceStart: 1
    mipMapFadeDistanceEnd: 3
  bumpmap:
    convertToNormalMap: 0
    externalNormalMap: 0
    heightScale: 0.25
    normalMapFilter: 0
    flipGreenChannel: 0
  isReadable: 0
  streamingMipmaps: 0
  streamingMipmapsPriority: 0
  vTOnly: 0
  ignoreMipmapLimit: 0
  grayScaleToAlpha: 0
  generateCubemap: 6
  cubemapConvolution: 0
  seamlessCubemap: 0
  textureFormat: 1
  maxTextureSize: 2048
  textureSettings:
    serializedVersion: 2
    filterMode: 1
    aniso: 1
    mipBias: 0
    wrapU: 0
    wrapV: 0
    wrapW: 0
  nPOTScale: 1
  lightmap: 0
  compressionQuality: 50
  spriteMode: 0
  spriteExtrude: 1
  spriteMeshType: 1
  alignment: 0
  spritePivot: {{x: 0.5, y: 0.5}}
  spritePixelsToUnits: 100
  spriteBorder: {{x: 0, y: 0, z: 0, w: 0}}
  spriteGenerateFallbackPhysicsShape: 1
  alphaUsage: 1
  alphaIsTransparency: 0
  spriteTessellationMethod: 0
  spriteTessellationDetail: -1
  spriteGeometrySubdivision: -1
  textureType: {tex_type}
  textureShape: 1
  singleChannelComponent: 0
  flipbookRows: 1
  flipbookColumns: 1
  maxTextureSizeSet: 0
  compressionQualitySet: 0
  textureFormatSet: 0
  ignorePngGamma: 0
  applyGammaDecoding: 0
  swizzle: 0
  cookieLightType: 0
  platformSettings: []
  userData: 
  assetBundleName: 
  assetBundleVariant: 
"""
    with open(meta_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created: {meta_path}")

if __name__ == "__main__":
    make_meta("player_albedo.webp", is_normal=False, is_srgb=True)
    make_meta("player_albedo.png", is_normal=False, is_srgb=True)
    make_meta("player_normal.webp", is_normal=True, is_srgb=False)
    make_meta("player_normal.png", is_normal=True, is_srgb=False)
    make_meta("player_roughness.webp", is_normal=False, is_srgb=False)
    make_meta("player_roughness.png", is_normal=False, is_srgb=False)
    make_meta("player_ao.webp", is_normal=False, is_srgb=False)
    make_meta("player_ao.png", is_normal=False, is_srgb=False)
