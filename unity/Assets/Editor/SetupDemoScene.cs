using System;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace MyProject.Editor
{
    [InitializeOnLoad]
    public static class SetupDemoScene
    {
        static SetupDemoScene()
        {
            // Never auto-run under batchmode. This builds and modifies an unsaved scene, which
            // makes the Test Runner's pre-run SaveModifiedSceneTask open a modal "save changes?"
            // dialog; Unity refuses dialogs in batch mode, so the run aborted with RunError
            // before any test ran. It is a leftover template demo, not part of the game.
            if (Application.isBatchMode) return;

            EditorApplication.delayCall += Execute;
        }

        [MenuItem("Tools/Setup Demo Scene (All Features)")]
        public static void Execute()
        {
            try
            {
                Debug.Log("<color=#00D2FF><b>[Antigravity]</b></color> Starting full demo scene setup...");

                // 1. Ensure Materials Folder exists
                if (!AssetDatabase.IsValidFolder("Assets/Materials"))
                {
                    AssetDatabase.CreateFolder("Assets", "Materials");
                }

                // 2. Create Gold Metallic Material
                Material goldMat = AssetDatabase.LoadAssetAtPath<Material>("Assets/Materials/GoldMetallic.mat");
                if (goldMat == null)
                {
                    Shader litShader = Shader.Find("HDRP/Lit") ?? Shader.Find("Standard") ?? Shader.Find("Universal Render Pipeline/Lit");
                    goldMat = new Material(litShader);
                    Color goldColor = new Color(1.0f, 0.82f, 0.2f, 1.0f);
                    
                    if (goldMat.HasProperty("_BaseColor")) goldMat.SetColor("_BaseColor", goldColor);
                    if (goldMat.HasProperty("_Color")) goldMat.SetColor("_Color", goldColor);
                    if (goldMat.HasProperty("_Metallic")) goldMat.SetFloat("_Metallic", 0.9f);
                    if (goldMat.HasProperty("_Smoothness")) goldMat.SetFloat("_Smoothness", 0.8f);

                    AssetDatabase.CreateAsset(goldMat, "Assets/Materials/GoldMetallic.mat");
                    Debug.Log("<color=#00FF88><b>[Antigravity]</b></color> Created PBR Material: GoldMetallic.mat");
                }

                // 3. Create Ruby Red Material for PhysicsBall
                Material rubyMat = AssetDatabase.LoadAssetAtPath<Material>("Assets/Materials/RubyRed.mat");
                if (rubyMat == null)
                {
                    Shader litShader = Shader.Find("HDRP/Lit") ?? Shader.Find("Standard") ?? Shader.Find("Universal Render Pipeline/Lit");
                    rubyMat = new Material(litShader);
                    Color rubyColor = new Color(0.9f, 0.1f, 0.2f, 1.0f);

                    if (rubyMat.HasProperty("_BaseColor")) rubyMat.SetColor("_BaseColor", rubyColor);
                    if (rubyMat.HasProperty("_Color")) rubyMat.SetColor("_Color", rubyColor);
                    if (rubyMat.HasProperty("_Metallic")) rubyMat.SetFloat("_Metallic", 0.5f);
                    if (rubyMat.HasProperty("_Smoothness")) rubyMat.SetFloat("_Smoothness", 0.9f);

                    AssetDatabase.CreateAsset(rubyMat, "Assets/Materials/RubyRed.mat");
                }

                // 4. Create Ground Plane
                GameObject ground = GameObject.Find("Ground");
                if (ground == null)
                {
                    ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
                    ground.name = "Ground";
                    ground.transform.position = Vector3.zero;
                    ground.transform.localScale = new Vector3(10f, 1f, 10f);
                    Undo.RegisterCreatedObjectUndo(ground, "Create Ground Plane");
                    Debug.Log("<color=#00FF88><b>[Antigravity]</b></color> Created 'Ground' plane scaled (10, 1, 10)");
                }

                // 5. Create TestCube with Rotator & Gold Material
                GameObject cube = GameObject.Find("TestCube");
                if (cube == null)
                {
                    cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
                    cube.name = "TestCube";
                    cube.transform.position = new Vector3(0f, 0.5f, 0f);
                    Undo.RegisterCreatedObjectUndo(cube, "Create TestCube");
                }
                
                // Assign Material
                var cubeRenderer = cube.GetComponent<MeshRenderer>();
                if (cubeRenderer != null && goldMat != null)
                {
                    cubeRenderer.sharedMaterial = goldMat;
                }

                // Attach Rotator Script if not attached
                if (cube.GetComponent<Rotator>() == null)
                {
                    cube.AddComponent<Rotator>();
                    Debug.Log("<color=#00FF88><b>[Antigravity]</b></color> Attached 'Rotator' component to TestCube");
                }

                // 6. Create PhysicsBall with Rigidbody
                GameObject ball = GameObject.Find("PhysicsBall");
                if (ball == null)
                {
                    ball = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                    ball.name = "PhysicsBall";
                    ball.transform.position = new Vector3(0f, 5f, 0f);
                    
                    var ballRenderer = ball.GetComponent<MeshRenderer>();
                    if (ballRenderer != null && rubyMat != null)
                    {
                        ballRenderer.sharedMaterial = rubyMat;
                    }

                    var rb = ball.GetComponent<Rigidbody>();
                    if (rb == null)
                    {
                        rb = ball.AddComponent<Rigidbody>();
                        rb.mass = 2f;
                        rb.collisionDetectionMode = CollisionDetectionMode.Continuous;
                    }

                    Undo.RegisterCreatedObjectUndo(ball, "Create PhysicsBall");
                    Debug.Log("<color=#00FF88><b>[Antigravity]</b></color> Created 'PhysicsBall' at (0, 5, 0) with Rigidbody");
                }

                // 7. Create Point Light 'KeyLight'
                GameObject lightObj = GameObject.Find("KeyLight");
                if (lightObj == null)
                {
                    lightObj = new GameObject("KeyLight");
                    lightObj.transform.position = new Vector3(2f, 4f, -2f);
                    Light lightComp = lightObj.AddComponent<Light>();
                    lightComp.type = LightType.Point;
                    lightComp.color = new Color(1.0f, 0.75f, 0.45f); // warm golden orange
                    lightComp.range = 15f;
                    lightComp.intensity = 1000f; // HDRP intensity
                    Undo.RegisterCreatedObjectUndo(lightObj, "Create KeyLight");
                    Debug.Log("<color=#00FF88><b>[Antigravity]</b></color> Created 'KeyLight' point light at (2, 4, -2)");
                }

                // 8. Select TestCube in Hierarchy
                Selection.activeGameObject = cube;

                // 9. Save Scene Changes
                EditorSceneManager.MarkSceneDirty(EditorSceneManager.GetActiveScene());
                AssetDatabase.SaveAssets();

                Debug.Log("<color=#00FF88><b>[Antigravity]</b></color> Scene setup complete! All objects created and saved.");
            }
            catch (Exception ex)
            {
                Debug.LogError("[Antigravity] SetupDemoScene error: " + ex);
            }
        }
    }
}
