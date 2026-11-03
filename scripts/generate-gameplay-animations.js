const fs = require('fs');
const path = require('path');

const clipsDir = path.resolve(__dirname, '..', 'unity/Assets/_Project/Art/Characters/Procedural/Clips');
if (!fs.existsSync(clipsDir)) {
  fs.mkdirSync(clipsDir, { recursive: true });
}

function generateAnimYaml(name, duration, loop, curves = []) {
  const isLoop = loop ? 1 : 0;
  let rotationCurvesYaml = '';

  for (const c of curves) {
    rotationCurvesYaml += `  - curve:
      serializedVersion: 2
      m_Curve:
      - serializedVersion: 3
        time: 0
        value: {x: ${c.v0.x}, y: ${c.v0.y}, z: ${c.v0.z}, w: ${c.v0.w}}
        inSlope: {x: 0, y: 0, z: 0, w: 0}
        outSlope: {x: 0, y: 0, z: 0, w: 0}
        tangentMode: 0
        weightedMode: 0
        inWeight: {x: 0.33333334, y: 0.33333334, z: 0.33333334, w: 0.33333334}
        outWeight: {x: 0.33333334, y: 0.33333334, z: 0.33333334, w: 0.33333334}
      - serializedVersion: 3
        time: ${duration * 0.5}
        value: {x: ${c.v1.x}, y: ${c.v1.y}, z: ${c.v1.z}, w: ${c.v1.w}}
        inSlope: {x: 0, y: 0, z: 0, w: 0}
        outSlope: {x: 0, y: 0, z: 0, w: 0}
        tangentMode: 0
        weightedMode: 0
        inWeight: {x: 0.33333334, y: 0.33333334, z: 0.33333334, w: 0.33333334}
        outWeight: {x: 0.33333334, y: 0.33333334, z: 0.33333334, w: 0.33333334}
      - serializedVersion: 3
        time: ${duration}
        value: {x: ${c.v2.x}, y: ${c.v2.y}, z: ${c.v2.z}, w: ${c.v2.w}}
        inSlope: {x: 0, y: 0, z: 0, w: 0}
        outSlope: {x: 0, y: 0, z: 0, w: 0}
        tangentMode: 0
        weightedMode: 0
        inWeight: {x: 0.33333334, y: 0.33333334, z: 0.33333334, w: 0.33333334}
        outWeight: {x: 0.33333334, y: 0.33333334, z: 0.33333334, w: 0.33333334}
      m_PreInfinity: 2
      m_PostInfinity: 2
      m_RotationOrder: 4
    path: ${c.path}
`;
  }

  return `%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!74 &7400000
AnimationClip:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_Name: ${name}
  serializedVersion: 8
  m_Legacy: 0
  m_Compressed: 0
  m_UseHighQualityCurve: 1
  m_RotationCurves:
${rotationCurvesYaml}  m_CompressedRotationCurves: []
  m_EulerCurves: []
  m_PositionCurves: []
  m_ScaleCurves: []
  m_FloatCurves: []
  m_PPtrCurves: []
  m_SampleRate: 30
  m_WrapMode: ${loop ? 2 : 0}
  m_Bounds:
    m_Center: {x: 0, y: 0, z: 0}
    m_Extent: {x: 0, y: 0, z: 0}
  m_ClipBindingConstant:
    genericBindings: []
    pptrCurveMapping: []
  m_AnimationClipSettings:
    serializedVersion: 2
    m_AdditiveReferencePoseClip: {fileID: 0}
    m_AdditiveReferencePoseTime: 0
    m_StartTime: 0
    m_StopTime: ${duration}
    m_OrientationOffsetY: 0
    m_Level: 0
    m_CycleOffset: 0
    m_HasAdditiveReferencePose: 0
    m_LoopTime: ${isLoop}
    m_LoopBlend: ${isLoop}
    m_LoopBlendOrientation: 0
    m_LoopBlendPositionY: 0
    m_LoopBlendPositionXZ: 0
    m_KeepOriginalOrientation: 0
    m_KeepOriginalPositionY: 1
    m_KeepOriginalPositionXZ: 0
    m_HeightFromFeet: 0
    m_Mirror: 0
  m_EditorCurves: []
  m_EulerEditorCurves: []
  m_HasGenericRootTransform: 0
  m_HasMotionFloatCurves: 0
  m_Events: []
`;
}

function generateMeta(guid) {
  return `fileFormatVersion: 2
guid: ${guid}
timeCreated: 1730600000
AnimationClip:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_Name: 
  serializedVersion: 8
  m_Legacy: 0
  m_Compressed: 0
  m_UseHighQualityCurve: 1
  m_RotationCurves: []
  m_CompressedRotationCurves: []
  m_EulerCurves: []
  m_PositionCurves: []
  m_ScaleCurves: []
  m_FloatCurves: []
  m_PPtrCurves: []
  m_SampleRate: 30
  m_WrapMode: 0
  m_Bounds:
    m_Center: {x: 0, y: 0, z: 0}
    m_Extent: {x: 0, y: 0, z: 0}
  m_ClipBindingConstant:
    genericBindings: []
    pptrCurveMapping: []
  m_AnimationClipSettings:
    serializedVersion: 2
    m_AdditiveReferencePoseClip: {fileID: 0}
    m_AdditiveReferencePoseTime: 0
    m_StartTime: 0
    m_StopTime: 1
    m_OrientationOffsetY: 0
    m_Level: 0
    m_CycleOffset: 0
    m_HasAdditiveReferencePose: 0
    m_LoopTime: 0
    m_LoopBlend: 0
    m_LoopBlendOrientation: 0
    m_LoopBlendPositionY: 0
    m_LoopBlendPositionXZ: 0
    m_KeepOriginalOrientation: 0
    m_KeepOriginalPositionY: 1
    m_KeepOriginalPositionXZ: 0
    m_HeightFromFeet: 0
    m_Mirror: 0
  m_EditorCurves: []
  m_EulerEditorCurves: []
  m_HasGenericRootTransform: 0
  m_HasMotionFloatCurves: 0
  m_Events: []
`;
}

const clipsToCreate = [
  {
    name: 'PlayerHarvestSickle',
    duration: 1.2,
    loop: false,
    guid: 'c9a0786e7c76cc443a62cb8fe78a1ad1',
    curves: [
      {
        path: 'CharacterOffset/Root/Hips/Spine/Chest/UpperChest/RightShoulder/RightUpperArm',
        v0: { x: 0.05, y: 0, z: -0.1, w: 0.99 },
        v1: { x: 0.55, y: 0.12, z: -0.15, w: 0.81 },
        v2: { x: 0.05, y: 0, z: -0.1, w: 0.99 }
      },
      {
        path: 'CharacterOffset/Root/Hips/Spine/Chest/UpperChest/RightShoulder/RightUpperArm/RightLowerArm',
        v0: { x: -0.2, y: 0, z: 0, w: 0.98 },
        v1: { x: -0.65, y: 0, z: 0, w: 0.76 },
        v2: { x: -0.2, y: 0, z: 0, w: 0.98 }
      }
    ]
  },
  {
    name: 'PlayerAimCamera',
    duration: 1.8,
    loop: true,
    guid: 'c9a0786e7c76cc443a62cb8fe78a1ad2',
    curves: [
      {
        path: 'CharacterOffset/Root/Hips/Spine/Chest/UpperChest/LeftShoulder/LeftUpperArm',
        v0: { x: -0.55, y: 0.2, z: 0.1, w: 0.8 },
        v1: { x: -0.56, y: 0.21, z: 0.1, w: 0.79 },
        v2: { x: -0.55, y: 0.2, z: 0.1, w: 0.8 }
      },
      {
        path: 'CharacterOffset/Root/Hips/Spine/Chest/UpperChest/RightShoulder/RightUpperArm',
        v0: { x: -0.55, y: -0.2, z: -0.1, w: 0.8 },
        v1: { x: -0.56, y: -0.21, z: -0.1, w: 0.79 },
        v2: { x: -0.55, y: -0.2, z: -0.1, w: 0.8 }
      }
    ]
  },
  {
    name: 'PlayerInteractInspect',
    duration: 1.4,
    loop: false,
    guid: 'c9a0786e7c76cc443a62cb8fe78a1ad3',
    curves: [
      {
        path: 'CharacterOffset/Root/Hips/Spine/Chest',
        v0: { x: 0.08, y: 0, z: 0, w: 0.99 },
        v1: { x: 0.18, y: 0, z: 0, w: 0.98 },
        v2: { x: 0.08, y: 0, z: 0, w: 0.99 }
      },
      {
        path: 'CharacterOffset/Root/Hips/Spine/Chest/UpperChest/RightShoulder/RightUpperArm',
        v0: { x: -0.3, y: 0, z: 0, w: 0.95 },
        v1: { x: -0.45, y: -0.1, z: 0, w: 0.88 },
        v2: { x: -0.3, y: 0, z: 0, w: 0.95 }
      }
    ]
  },
  {
    name: 'NilgiriTahr_Walk',
    duration: 1.0,
    loop: true,
    guid: 'c9a0786e7c76cc443a62cb8fe78a1ad4',
    curves: [
      {
        path: 'Hips/Spine/Neck/Head',
        v0: { x: 0.05, y: 0, z: 0, w: 0.99 },
        v1: { x: -0.05, y: 0, z: 0, w: 0.99 },
        v2: { x: 0.05, y: 0, z: 0, w: 0.99 }
      }
    ]
  },
  {
    name: 'NilgiriTahr_Graze',
    duration: 2.5,
    loop: true,
    guid: 'c9a0786e7c76cc443a62cb8fe78a1ad5',
    curves: [
      {
        path: 'Hips/Spine/Neck/Head',
        v0: { x: 0.35, y: 0, z: 0, w: 0.93 },
        v1: { x: 0.42, y: 0.05, z: 0, w: 0.9 },
        v2: { x: 0.35, y: 0, z: 0, w: 0.93 }
      }
    ]
  }
];

for (const clip of clipsToCreate) {
  const animPath = path.join(clipsDir, `${clip.name}.anim`);
  const metaPath = path.join(clipsDir, `${clip.name}.anim.meta`);
  fs.writeFileSync(animPath, generateAnimYaml(clip.name, clip.duration, clip.loop, clip.curves));
  fs.writeFileSync(metaPath, generateMeta(clip.guid));
  console.log(`Generated animation clip: ${clip.name} (GUID: ${clip.guid})`);
}
