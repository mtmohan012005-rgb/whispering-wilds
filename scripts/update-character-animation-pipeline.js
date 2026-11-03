const fs = require('fs');
const path = require('path');

const factoryPath = path.resolve(__dirname, '..', 'unity/Assets/_Project/Scripts/Editor/Characters/CharacterFactory.cs');
let factoryCode = fs.readFileSync(factoryPath, 'utf8');

// 1. Add clips to CharacterFactory.cs
const landTarget = `clips["PlayerLand"] = MakeClip("PlayerLand", bones, 0.4f, ctx =>
            {
                ApplyLand(ctx, 0.4f);
            });`;

const newClips = `clips["PlayerLand"] = MakeClip("PlayerLand", bones, 0.4f, ctx =>
            {
                ApplyLand(ctx, 0.4f);
            });

            clips["PlayerHarvestSickle"] = MakeClip("PlayerHarvestSickle", bones, 1.2f, ctx =>
            {
                ctx.HipsLocalY(t => -0.05f * Mathf.Sin(Phase(t, 1.2f)));
                ctx.Rotate("Spine", t => new Vector3(15f + 10f * Mathf.Sin(Phase(t, 1.2f)), 0f, 0f));
                ctx.Rotate("Chest", t => new Vector3(12f + 8f * Mathf.Sin(Phase(t, 1.2f)), 0f, 0f));
                ctx.Rotate("RightUpperArm", t => new Vector3(-20f + 70f * Mathf.Sin(Phase(t, 1.2f)), 15f, -10f));
                ctx.Rotate("RightLowerArm", t => new Vector3(-45f + 30f * Mathf.Sin(Phase(t, 1.2f)), 0f, 0f));
                ctx.Rotate("LeftUpperArm", t => new Vector3(-15f, 0f, 15f));
                ctx.Rotate("LeftLowerArm", t => new Vector3(-25f, 0f, 0f));
            });

            clips["PlayerAimCamera"] = MakeClip("PlayerAimCamera", bones, 1.8f, ctx =>
            {
                ctx.Rotate("Spine", t => new Vector3(2f * Mathf.Sin(Phase(t, 1.8f)), 0f, 0f));
                ctx.Rotate("Chest", t => new Vector3(3f * Mathf.Sin(Phase(t, 1.8f)), 0f, 0f));
                ctx.Rotate("LeftUpperArm", t => new Vector3(-65f, 25f, 15f));
                ctx.Rotate("RightUpperArm", t => new Vector3(-65f, -25f, -15f));
                ctx.Rotate("LeftLowerArm", t => new Vector3(-75f, 0f, 0f));
                ctx.Rotate("RightLowerArm", t => new Vector3(-75f, 0f, 0f));
            });

            clips["PlayerInteractInspect"] = MakeClip("PlayerInteractInspect", bones, 1.4f, ctx =>
            {
                ctx.Rotate("Spine", t => new Vector3(14f + 4f * Mathf.Sin(Phase(t, 1.4f)), 0f, 0f));
                ctx.Rotate("Chest", t => new Vector3(10f + 3f * Mathf.Sin(Phase(t, 1.4f)), 0f, 0f));
                ctx.Rotate("LeftUpperArm", t => new Vector3(-45f + 10f * Mathf.Sin(Phase(t, 1.4f)), 10f, 10f));
                ctx.Rotate("RightUpperArm", t => new Vector3(-45f + 10f * Mathf.Sin(Phase(t, 1.4f)), -10f, -10f));
                ctx.Rotate("LeftLowerArm", t => new Vector3(-35f, 0f, 0f));
                ctx.Rotate("RightLowerArm", t => new Vector3(-35f, 0f, 0f));
            });`;

if (!factoryCode.includes('PlayerHarvestSickle')) {
  // Normalize line endings for replacement
  const isCRLF = factoryCode.includes('\r\n');
  const normalizedTarget = isCRLF ? landTarget.replace(/\n/g, '\r\n') : landTarget;
  const normalizedNewClips = isCRLF ? newClips.replace(/\n/g, '\r\n') : newClips;
  factoryCode = factoryCode.replace(normalizedTarget, normalizedNewClips);

  // Update ClipShouldLoop
  const loopTarget = `case "PlayerJump":
                case "PlayerLand":
                    return false;`;
  const newLoop = `case "PlayerJump":
                case "PlayerLand":
                case "PlayerHarvestSickle":
                case "PlayerInteractInspect":
                    return false;`;
  const normalizedLoopTarget = isCRLF ? loopTarget.replace(/\n/g, '\r\n') : loopTarget;
  const normalizedNewLoop = isCRLF ? newLoop.replace(/\n/g, '\r\n') : newLoop;
  factoryCode = factoryCode.replace(normalizedLoopTarget, normalizedNewLoop);

  fs.writeFileSync(factoryPath, factoryCode);
  console.log('Updated CharacterFactory.cs with gameplay action clips.');
} else {
  console.log('CharacterFactory.cs already contains gameplay action clips.');
}

// 2. Update CharacterAssetBuilder.cs
const builderPath = path.resolve(__dirname, '..', 'unity/Assets/_Project/Scripts/Editor/Characters/CharacterAssetBuilder.cs');
let builderCode = fs.readFileSync(builderPath, 'utf8');

const paramTarget = `controller.AddParameter("Jump", AnimatorControllerParameterType.Trigger);`;
const newParams = `controller.AddParameter("Jump", AnimatorControllerParameterType.Trigger);
            controller.AddParameter("IsAimingCamera", AnimatorControllerParameterType.Bool);
            controller.AddParameter("HarvestTrigger", AnimatorControllerParameterType.Trigger);
            controller.AddParameter("InteractTrigger", AnimatorControllerParameterType.Trigger);
            controller.AddParameter("InteractionType", AnimatorControllerParameterType.Int);`;

const transTarget = `Transition(land, ground, true, 0.15f, 0.1f);`;
const newTrans = `Transition(land, ground, true, 0.15f, 0.1f);

            if (clips.ContainsKey("PlayerHarvestSickle"))
            {
                var harvest = AddState(sm, "Harvest", clips["PlayerHarvestSickle"], new Vector2(0, 1));
                Transition(ground, harvest, false, 0f, 0.1f, ("HarvestTrigger", AnimatorConditionMode.If, 1f));
                Transition(harvest, ground, true, 0.85f, 0.15f);
            }
            if (clips.ContainsKey("PlayerAimCamera"))
            {
                var aimCamera = AddState(sm, "AimCamera", clips["PlayerAimCamera"], new Vector2(1, 1));
                Transition(ground, aimCamera, false, 0f, 0.15f, ("IsAimingCamera", AnimatorConditionMode.If, 1f));
                Transition(aimCamera, ground, false, 0f, 0.15f, ("IsAimingCamera", AnimatorConditionMode.IfNot, 0f));
            }
            if (clips.ContainsKey("PlayerInteractInspect"))
            {
                var interact = AddState(sm, "Interact", clips["PlayerInteractInspect"], new Vector2(2, 1));
                Transition(ground, interact, false, 0f, 0.1f, ("InteractTrigger", AnimatorConditionMode.If, 1f));
                Transition(interact, ground, true, 0.85f, 0.15f);
            }`;

if (!builderCode.includes('HarvestTrigger')) {
  const isCRLF = builderCode.includes('\r\n');
  const normalizedParamTarget = isCRLF ? paramTarget.replace(/\n/g, '\r\n') : paramTarget;
  const normalizedNewParams = isCRLF ? newParams.replace(/\n/g, '\r\n') : newParams;
  builderCode = builderCode.replace(normalizedParamTarget, normalizedNewParams);

  const normalizedTransTarget = isCRLF ? transTarget.replace(/\n/g, '\r\n') : transTarget;
  const normalizedNewTrans = isCRLF ? newTrans.replace(/\n/g, '\r\n') : newTrans;
  builderCode = builderCode.replace(normalizedTransTarget, normalizedNewTrans);

  fs.writeFileSync(builderPath, builderCode);
  console.log('Updated CharacterAssetBuilder.cs with gameplay action states and parameters.');
} else {
  console.log('CharacterAssetBuilder.cs already contains gameplay action states.');
}
