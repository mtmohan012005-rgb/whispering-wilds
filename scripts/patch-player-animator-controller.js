const fs = require('fs');
const path = require('path');

const controllerPath = path.resolve(__dirname, '..', 'unity/Assets/_Project/Art/Animations/Characters/PlayerCharacter.controller');
let content = fs.readFileSync(controllerPath, 'utf8');

if (content.includes('HarvestTrigger')) {
  console.log('PlayerCharacter.controller already contains HarvestTrigger.');
  process.exit(0);
}

// 1. Add parameters to m_AnimatorParameters
const paramsTarget = `  - m_Name: Jump
    m_Type: 9
    m_DefaultFloat: 0
    m_DefaultInt: 0
    m_DefaultBool: 0
    m_Controller: {fileID: 9100000}`;

const newParams = `  - m_Name: Jump
    m_Type: 9
    m_DefaultFloat: 0
    m_DefaultInt: 0
    m_DefaultBool: 0
    m_Controller: {fileID: 9100000}
  - m_Name: IsAimingCamera
    m_Type: 4
    m_DefaultFloat: 0
    m_DefaultInt: 0
    m_DefaultBool: 0
    m_Controller: {fileID: 9100000}
  - m_Name: HarvestTrigger
    m_Type: 9
    m_DefaultFloat: 0
    m_DefaultInt: 0
    m_DefaultBool: 0
    m_Controller: {fileID: 9100000}
  - m_Name: InteractTrigger
    m_Type: 9
    m_DefaultFloat: 0
    m_DefaultInt: 0
    m_DefaultBool: 0
    m_Controller: {fileID: 9100000}
  - m_Name: InteractionType
    m_Type: 3
    m_DefaultFloat: 0
    m_DefaultInt: 0
    m_DefaultBool: 0
    m_Controller: {fileID: 9100000}`;

const isCRLF = content.includes('\r\n');
content = content.replace(isCRLF ? paramsTarget.replace(/\n/g, '\r\n') : paramsTarget,
                          isCRLF ? newParams.replace(/\n/g, '\r\n') : newParams);

// 2. Add states to m_ChildStates
const childStatesTarget = `  - serializedVersion: 1
    m_State: {fileID: 7875990444809416536}
    m_Position: {x: 4, y: 0, z: 0}`;

const newChildStates = `  - serializedVersion: 1
    m_State: {fileID: 7875990444809416536}
    m_Position: {x: 4, y: 0, z: 0}
  - serializedVersion: 1
    m_State: {fileID: 110200001}
    m_Position: {x: 0, y: 2, z: 0}
  - serializedVersion: 1
    m_State: {fileID: 110200002}
    m_Position: {x: 2, y: 2, z: 0}
  - serializedVersion: 1
    m_State: {fileID: 110200003}
    m_Position: {x: 4, y: 2, z: 0}`;

content = content.replace(isCRLF ? childStatesTarget.replace(/\n/g, '\r\n') : childStatesTarget,
                          isCRLF ? newChildStates.replace(/\n/g, '\r\n') : newChildStates);

// 3. Add transitions and states blocks at the end of the file
const extraBlocks = `
--- !u!1101 &110100001
AnimatorStateTransition:
  m_ObjectHideFlags: 1
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_Name: 
  m_Conditions:
  - m_ConditionMode: 1
    m_ConditionEvent: HarvestTrigger
    m_EventTreshold: 0
  m_DstStateMachine: {fileID: 0}
  m_DstState: {fileID: 110200001}
  m_Solo: 0
  m_Mute: 0
  m_IsExit: 0
  serializedVersion: 3
  m_TransitionDuration: 0.1
  m_TransitionOffset: 0
  m_ExitTime: 0
  m_HasExitTime: 0
  m_HasFixedDuration: 1
  m_InterruptionSource: 0
  m_OrderedInterruption: 1
  m_CanTransitionToSelf: 1
--- !u!1101 &110100002
AnimatorStateTransition:
  m_ObjectHideFlags: 1
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_Name: 
  m_Conditions: []
  m_DstStateMachine: {fileID: 0}
  m_DstState: {fileID: -5470000378495581234}
  m_Solo: 0
  m_Mute: 0
  m_IsExit: 0
  serializedVersion: 3
  m_TransitionDuration: 0.15
  m_TransitionOffset: 0
  m_ExitTime: 0.85
  m_HasExitTime: 1
  m_HasFixedDuration: 1
  m_InterruptionSource: 0
  m_OrderedInterruption: 1
  m_CanTransitionToSelf: 1
--- !u!1101 &110100003
AnimatorStateTransition:
  m_ObjectHideFlags: 1
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_Name: 
  m_Conditions:
  - m_ConditionMode: 1
    m_ConditionEvent: IsAimingCamera
    m_EventTreshold: 0
  m_DstStateMachine: {fileID: 0}
  m_DstState: {fileID: 110200002}
  m_Solo: 0
  m_Mute: 0
  m_IsExit: 0
  serializedVersion: 3
  m_TransitionDuration: 0.15
  m_TransitionOffset: 0
  m_ExitTime: 0
  m_HasExitTime: 0
  m_HasFixedDuration: 1
  m_InterruptionSource: 0
  m_OrderedInterruption: 1
  m_CanTransitionToSelf: 1
--- !u!1101 &110100004
AnimatorStateTransition:
  m_ObjectHideFlags: 1
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_Name: 
  m_Conditions:
  - m_ConditionMode: 2
    m_ConditionEvent: IsAimingCamera
    m_EventTreshold: 0
  m_DstStateMachine: {fileID: 0}
  m_DstState: {fileID: -5470000378495581234}
  m_Solo: 0
  m_Mute: 0
  m_IsExit: 0
  serializedVersion: 3
  m_TransitionDuration: 0.15
  m_TransitionOffset: 0
  m_ExitTime: 0
  m_HasExitTime: 0
  m_HasFixedDuration: 1
  m_InterruptionSource: 0
  m_OrderedInterruption: 1
  m_CanTransitionToSelf: 1
--- !u!1101 &110100005
AnimatorStateTransition:
  m_ObjectHideFlags: 1
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_Name: 
  m_Conditions:
  - m_ConditionMode: 1
    m_ConditionEvent: InteractTrigger
    m_EventTreshold: 0
  m_DstStateMachine: {fileID: 0}
  m_DstState: {fileID: 110200003}
  m_Solo: 0
  m_Mute: 0
  m_IsExit: 0
  serializedVersion: 3
  m_TransitionDuration: 0.1
  m_TransitionOffset: 0
  m_ExitTime: 0
  m_HasExitTime: 0
  m_HasFixedDuration: 1
  m_InterruptionSource: 0
  m_OrderedInterruption: 1
  m_CanTransitionToSelf: 1
--- !u!1101 &110100006
AnimatorStateTransition:
  m_ObjectHideFlags: 1
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_Name: 
  m_Conditions: []
  m_DstStateMachine: {fileID: 0}
  m_DstState: {fileID: -5470000378495581234}
  m_Solo: 0
  m_Mute: 0
  m_IsExit: 0
  serializedVersion: 3
  m_TransitionDuration: 0.15
  m_TransitionOffset: 0
  m_ExitTime: 0.85
  m_HasExitTime: 1
  m_HasFixedDuration: 1
  m_InterruptionSource: 0
  m_OrderedInterruption: 1
  m_CanTransitionToSelf: 1
--- !u!1102 &110200001
AnimatorState:
  serializedVersion: 6
  m_ObjectHideFlags: 1
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_Name: Harvest
  m_Speed: 1
  m_CycleOffset: 0
  m_Transitions:
  - {fileID: 110100002}
  m_StateMachineBehaviours: []
  m_Position: {x: 50, y: 50, z: 0}
  m_IKOnFeet: 0
  m_WriteDefaultValues: 1
  m_Mirror: 0
  m_SpeedParameterActive: 0
  m_MirrorParameterActive: 0
  m_CycleOffsetParameterActive: 0
  m_TimeParameterActive: 0
  m_Motion: {fileID: 7400000, guid: c9a0786e7c76cc443a62cb8fe78a1ad1, type: 2}
  m_Tag: 
  m_SpeedParameter: 
  m_MirrorParameter: 
  m_CycleOffsetParameter: 
  m_TimeParameter: 
--- !u!1102 &110200002
AnimatorState:
  serializedVersion: 6
  m_ObjectHideFlags: 1
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_Name: AimCamera
  m_Speed: 1
  m_CycleOffset: 0
  m_Transitions:
  - {fileID: 110100004}
  m_StateMachineBehaviours: []
  m_Position: {x: 50, y: 50, z: 0}
  m_IKOnFeet: 0
  m_WriteDefaultValues: 1
  m_Mirror: 0
  m_SpeedParameterActive: 0
  m_MirrorParameterActive: 0
  m_CycleOffsetParameterActive: 0
  m_TimeParameterActive: 0
  m_Motion: {fileID: 7400000, guid: c9a0786e7c76cc443a62cb8fe78a1ad2, type: 2}
  m_Tag: 
  m_SpeedParameter: 
  m_MirrorParameter: 
  m_CycleOffsetParameter: 
  m_TimeParameter: 
--- !u!1102 &110200003
AnimatorState:
  serializedVersion: 6
  m_ObjectHideFlags: 1
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_Name: Interact
  m_Speed: 1
  m_CycleOffset: 0
  m_Transitions:
  - {fileID: 110100006}
  m_StateMachineBehaviours: []
  m_Position: {x: 50, y: 50, z: 0}
  m_IKOnFeet: 0
  m_WriteDefaultValues: 1
  m_Mirror: 0
  m_SpeedParameterActive: 0
  m_MirrorParameterActive: 0
  m_CycleOffsetParameterActive: 0
  m_TimeParameterActive: 0
  m_Motion: {fileID: 7400000, guid: c9a0786e7c76cc443a62cb8fe78a1ad3, type: 2}
  m_Tag: 
  m_SpeedParameter: 
  m_MirrorParameter: 
  m_CycleOffsetParameter: 
  m_TimeParameter: 
`;

// Also append transitions 110100001, 110100003, 110100005 to Ground state transitions
const groundTransitionsTarget = `  m_Transitions:
  - {fileID: -8309170471081550870}
  - {fileID: -5785081977755866185}
  - {fileID: -1933934338905380582}`;

const newGroundTransitions = `  m_Transitions:
  - {fileID: -8309170471081550870}
  - {fileID: -5785081977755866185}
  - {fileID: -1933934338905380582}
  - {fileID: 110100001}
  - {fileID: 110100003}
  - {fileID: 110100005}`;

content = content.replace(isCRLF ? groundTransitionsTarget.replace(/\n/g, '\r\n') : groundTransitionsTarget,
                          isCRLF ? newGroundTransitions.replace(/\n/g, '\r\n') : newGroundTransitions);

content += (isCRLF ? extraBlocks.replace(/\n/g, '\r\n') : extraBlocks);

fs.writeFileSync(controllerPath, content);
console.log('Successfully patched PlayerCharacter.controller with gameplay action states and transitions.');
