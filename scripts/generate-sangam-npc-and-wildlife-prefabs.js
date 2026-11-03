const fs = require('fs');
const path = require('path');

const charPrefabsDir = path.resolve(__dirname, '..', 'unity/Assets/_Project/Prefabs/Characters');
const wildlifePrefabsDir = path.resolve(__dirname, '..', 'unity/Assets/_Project/Prefabs/Wildlife');

if (!fs.existsSync(wildlifePrefabsDir)) {
  fs.mkdirSync(wildlifePrefabsDir, { recursive: true });
}

const templatePath = path.join(charPrefabsDir, 'NPC_Velu.prefab');
const veluYaml = fs.readFileSync(templatePath, 'utf8');

function generatePrefabMeta(guid) {
  return `fileFormatVersion: 2
guid: ${guid}
PrefabImporter:
  externalObjects: {}
  userData: 
  assetBundleName: 
  assetBundleVariant: 
`;
}

// 1. Generate NPC_Kumaran.prefab
const kumaranYaml = veluYaml.replace(/NPC_Velu/g, 'NPC_Kumaran');
fs.writeFileSync(path.join(charPrefabsDir, 'NPC_Kumaran.prefab'), kumaranYaml);
fs.writeFileSync(path.join(charPrefabsDir, 'NPC_Kumaran.prefab.meta'), generatePrefabMeta('c9a0786e7c76cc443a62cb8fe78a1ae1'));
console.log('Generated NPC_Kumaran.prefab');

// 2. Generate NPC_Siddhar.prefab
const siddharYaml = veluYaml.replace(/NPC_Velu/g, 'NPC_Siddhar');
fs.writeFileSync(path.join(charPrefabsDir, 'NPC_Siddhar.prefab'), siddharYaml);
fs.writeFileSync(path.join(charPrefabsDir, 'NPC_Siddhar.prefab.meta'), generatePrefabMeta('c9a0786e7c76cc443a62cb8fe78a1ae2'));
console.log('Generated NPC_Siddhar.prefab');

// 3. Generate Wildlife Prefabs
function generateWildlifePrefabYaml(name, speciesId) {
  return `%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!1 &1000001
GameObject:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  serializedVersion: 6
  m_Component:
  - component: {fileID: 1000002}
  - component: {fileID: 1000003}
  - component: {fileID: 1000004}
  - component: {fileID: 1000005}
  - component: {fileID: 1000006}
  m_Layer: 0
  m_Name: ${name}
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!4 &1000002
Transform:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: 1000001}
  serializedVersion: 2
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_ConstrainProportionsScale: 0
  m_Children: []
  m_Father: {fileID: 0}
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
--- !u!136 &1000003
CapsuleCollider:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: 1000001}
  m_Material: {fileID: 0}
  m_IncludeLayers:
    serializedVersion: 2
    m_Bits: 0
  m_ExcludeLayers:
    serializedVersion: 2
    m_Bits: 0
  m_LayerOverridePriority: 0
  m_IsTrigger: 0
  m_ProvidesContacts: 0
  m_Enabled: 1
  serializedVersion: 2
  m_Radius: 0.6
  m_Height: 1.4
  m_Direction: 1
  m_Center: {x: 0, y: 0.7, z: 0}
--- !u!114 &1000004
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: 1000001}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: a0bb5d8431bf3fa439ebaaee43ba0986, type: 3}
  m_Name: 
  m_EditorClassIdentifier: WhisperingWilds::WhisperingWilds.Wildlife.WildlifeEntity
--- !u!114 &1000005
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: 1000001}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: a0bb5d8431bf3fa439ebaaee43ba0987, type: 3}
  m_Name: 
  m_EditorClassIdentifier: WhisperingWilds::WhisperingWilds.Wildlife.AnimalAIController
--- !u!95 &1000006
Animator:
  serializedVersion: 7
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: 1000001}
  m_Enabled: 1
  m_Avatar: {fileID: 0}
  m_Controller: {fileID: 0}
  m_CullingMode: 0
  m_UpdateMode: 0
  m_ApplyRootMotion: 0
  m_LinearVelocityBlending: 0
  m_StabilizeFeet: 0
  m_AnimatePhysics: 0
  m_WarningMessage: 
  m_HasTransformHierarchy: 1
  m_AllowConstantClipSamplingOptimization: 1
  m_KeepAnimatorStateOnDisable: 0
  m_WriteDefaultValuesOnDisable: 0
`;
}

fs.writeFileSync(path.join(wildlifePrefabsDir, 'Wildlife_NilgiriTahr.prefab'), generateWildlifePrefabYaml('Wildlife_NilgiriTahr', 'nilgiri_tahr'));
fs.writeFileSync(path.join(wildlifePrefabsDir, 'Wildlife_NilgiriTahr.prefab.meta'), generatePrefabMeta('c9a0786e7c76cc443a62cb8fe78a1ae3'));
console.log('Generated Wildlife_NilgiriTahr.prefab');

fs.writeFileSync(path.join(wildlifePrefabsDir, 'Wildlife_Elephant.prefab'), generateWildlifePrefabYaml('Wildlife_Elephant', 'elephant'));
fs.writeFileSync(path.join(wildlifePrefabsDir, 'Wildlife_Elephant.prefab.meta'), generatePrefabMeta('c9a0786e7c76cc443a62cb8fe78a1ae4'));
console.log('Generated Wildlife_Elephant.prefab');

// Also create Wildlife folder .meta if not present
const wildlifeDirMeta = path.resolve(__dirname, '..', 'unity/Assets/_Project/Prefabs/Wildlife.meta');
if (!fs.existsSync(wildlifeDirMeta)) {
  fs.writeFileSync(wildlifeDirMeta, `fileFormatVersion: 2
guid: c9a0786e7c76cc443a62cb8fe78a1ae0
folderAsset: yes
DefaultImporter:
  externalObjects: {}
  userData: 
  assetBundleName: 
  assetBundleVariant: 
`);
}

// 4. Update CharacterPrefabCatalog.cs
const catalogPath = path.resolve(__dirname, '..', 'unity/Assets/_Project/Scripts/Characters/CharacterPrefabCatalog.cs');
let catalogCode = fs.readFileSync(catalogPath, 'utf8');

if (!catalogCode.includes('KumaranPrefabPath')) {
  const isCRLF = catalogCode.includes('\r\n');
  const nl = isCRLF ? '\r\n' : '\n';

  const constTarget = `public const string TeaWorkerPrefabPath = CharacterPrefabRoot + "NPC_TeaWorker.prefab";`;
  const newConsts = `public const string TeaWorkerPrefabPath = CharacterPrefabRoot + "NPC_TeaWorker.prefab";${nl}        public const string KumaranPrefabPath = CharacterPrefabRoot + "NPC_Kumaran.prefab";${nl}        public const string SiddharPrefabPath = CharacterPrefabRoot + "NPC_Siddhar.prefab";`;

  catalogCode = catalogCode.replace(constTarget, newConsts);

  const dictTarget = `{ "kannan", TeaWorkerPrefabPath },`;
  const newDict = `{ "kannan", TeaWorkerPrefabPath },${nl}            { "kumaran", KumaranPrefabPath },${nl}            { "siddhar", SiddharPrefabPath },`;

  catalogCode = catalogCode.replace(dictTarget, newDict);
  fs.writeFileSync(catalogPath, catalogCode);
  console.log('Updated CharacterPrefabCatalog.cs with Kumaran and Siddhar resolvers.');
}
