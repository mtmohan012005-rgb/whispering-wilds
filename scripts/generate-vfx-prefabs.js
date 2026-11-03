#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const VFX_DIR = path.join(ROOT_DIR, 'unity/Assets/_Project/Prefabs/VFX');

function randId() {
  return Math.floor(100000000000000000 + Math.random() * 900000000000000000).toString();
}

// 1. MonsoonRainSystem.prefab
function generateMonsoonRain() {
  const rootId = randId();
  const trId = randId();
  const psId = randId();
  const psrId = randId();

  const yaml = `%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!1 &${rootId}
GameObject:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  serializedVersion: 6
  m_Component:
  - component: {fileID: ${trId}}
  - component: {fileID: ${psId}}
  - component: {fileID: ${psrId}}
  m_Layer: 0
  m_Name: MonsoonRainSystem
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!4 &${trId}
Transform:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${rootId}}
  m_LocalRotation: {x: 0.7071068, y: 0, z: 0, w: 0.7071068}
  m_LocalPosition: {x: 0, y: 15, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
--- !u!198 &${psId}
ParticleSystem:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${rootId}}
  serializedVersion: 6
  lengthInSeconds: 5
  simulationSpeed: 1
  looping: 1
  prewarm: 1
  playOnAwake: 1
  autoRandomSeed: 1
  startDelay: {scalar: 0, maxCurve: {serializedVersion: 2, m_Curve: [{time: 0, value: 0}], m_PreInfinity: 2, m_PostInfinity: 2}}
  startLifetime: {scalar: 1.2, maxCurve: {serializedVersion: 2, m_Curve: [{time: 0, value: 1.2}], m_PreInfinity: 2, m_PostInfinity: 2}}
  startSpeed: {scalar: 25, maxCurve: {serializedVersion: 2, m_Curve: [{time: 0, value: 25}], m_PreInfinity: 2, m_PostInfinity: 2}}
  startColor: {maxColor: {r: 0.75, g: 0.85, b: 0.95, a: 0.6}}
  startSize: {scalar: 0.15, maxCurve: {serializedVersion: 2, m_Curve: [{time: 0, value: 0.15}], m_PreInfinity: 2, m_PostInfinity: 2}}
  gravityModifier: {scalar: 2.5, maxCurve: {serializedVersion: 2, m_Curve: [{time: 0, value: 2.5}], m_PreInfinity: 2, m_PostInfinity: 2}}
  maxNumParticles: 3000
--- !u!199 &${psrId}
ParticleSystemRenderer:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${rootId}}
  m_Enabled: 1
  m_RenderMode: 1
  m_SortMode: 0
  m_MinParticleSize: 0.0001
  m_MaxParticleSize: 0.5
  m_CameraVelocityScale: 0
  m_VelocityScale: 0.65
  m_LengthScale: 2.5
  m_SortingLayerID: 0
  m_SortingOrder: 0
`;
  const target = path.join(VFX_DIR, 'MonsoonRainSystem.prefab');
  fs.writeFileSync(target, yaml, 'utf8');
  const meta = `fileFormatVersion: 2\nguid: 8f456d837446cc055fc34f53672ca759\nPrefabImporter:\n  externalObjects: {}\n  userData: \n  assetBundleName: \n  assetBundleVariant: \n`;
  fs.writeFileSync(target + '.meta', meta, 'utf8');
  console.log('Generated:', target);
}

// 2. TempleLampFlame.prefab
function generateTempleLamp() {
  const rootId = randId();
  const trId = randId();
  const psId = randId();
  const psrId = randId();
  const lightId = randId();

  const yaml = `%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!1 &${rootId}
GameObject:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  serializedVersion: 6
  m_Component:
  - component: {fileID: ${trId}}
  - component: {fileID: ${psId}}
  - component: {fileID: ${psrId}}
  - component: {fileID: ${lightId}}
  m_Layer: 0
  m_Name: TempleLampFlame
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!4 &${trId}
Transform:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${rootId}}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0.5, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
--- !u!198 &${psId}
ParticleSystem:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${rootId}}
  serializedVersion: 6
  lengthInSeconds: 2
  simulationSpeed: 1
  looping: 1
  prewarm: 1
  playOnAwake: 1
  autoRandomSeed: 1
  startLifetime: {scalar: 0.8, maxCurve: {serializedVersion: 2, m_Curve: [{time: 0, value: 0.8}], m_PreInfinity: 2, m_PostInfinity: 2}}
  startSpeed: {scalar: 0.6, maxCurve: {serializedVersion: 2, m_Curve: [{time: 0, value: 0.6}], m_PreInfinity: 2, m_PostInfinity: 2}}
  startColor: {maxColor: {r: 1.0, g: 0.72, b: 0.22, a: 0.95}}
  startSize: {scalar: 0.12, maxCurve: {serializedVersion: 2, m_Curve: [{time: 0, value: 0.12}], m_PreInfinity: 2, m_PostInfinity: 2}}
  gravityModifier: {scalar: -0.2, maxCurve: {serializedVersion: 2, m_Curve: [{time: 0, value: -0.2}], m_PreInfinity: 2, m_PostInfinity: 2}}
  maxNumParticles: 60
--- !u!199 &${psrId}
ParticleSystemRenderer:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${rootId}}
  m_Enabled: 1
  m_RenderMode: 0
  m_MinParticleSize: 0.001
  m_MaxParticleSize: 0.5
--- !u!108 &${lightId}
Light:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${rootId}}
  m_Enabled: 1
  serializedVersion: 10
  m_Type: 2
  m_Color: {r: 1.0, g: 0.75, b: 0.35, a: 1}
  m_Intensity: 2.5
  m_Range: 6
  m_SpotAngle: 30
  m_InnerSpotAngle: 21.80208
  m_CookieSize: 10
  m_Shadows:
    m_Type: 1
    m_Resolution: -1
    m_CustomResolution: -1
    m_Strength: 0.75
    m_Bias: 0.05
    m_NormalBias: 0.4
    m_NearPlane: 0.2
`;
  const target = path.join(VFX_DIR, 'TempleLampFlame.prefab');
  fs.writeFileSync(target, yaml, 'utf8');
  const meta = `fileFormatVersion: 2\nguid: ac44763735f0350b03c17f28c78a8c37\nPrefabImporter:\n  externalObjects: {}\n  userData: \n  assetBundleName: \n  assetBundleVariant: \n`;
  fs.writeFileSync(target + '.meta', meta, 'utf8');
  console.log('Generated:', target);
}

generateMonsoonRain();
generateTempleLamp();
console.log('✅ VFX prefabs generated successfully.');
