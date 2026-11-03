const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '..', 'unity/Assets/_Project/Scripts/Editor/AssembleAllRegions.cs');
let code = fs.readFileSync(filePath, 'utf8');

if (code.includes('BuildMaduraiScene')) {
  console.log('AssembleAllRegions.cs already includes BuildMaduraiScene.');
  process.exit(0);
}

const isCRLF = code.includes('\r\n');
const nl = isCRLF ? '\r\n' : '\n';

// 1. Update BuildAllScenes menu item call
const callTarget = 'BuildNilgirisScene();';
const newCalls = `BuildNilgirisScene();${nl}                BuildMaduraiScene();${nl}                BuildKanyakumariScene();${nl}                BuildAgasthyamalaiScene();`;

code = code.replace(callTarget, newCalls);

// 2. Update scenePaths array in RegisterAllScenesInBuildSettings
const arrayTarget = `"Assets/_Project/Scenes/WW_Benchmark_Nilgiris.unity"${nl}            };`;
const newArray = `"Assets/_Project/Scenes/WW_Benchmark_Nilgiris.unity",${nl}                "Assets/_Project/Scenes/08_Ancient_Temple_Ruins.unity",${nl}                "Assets/_Project/Scenes/09_Madurai_Meenakshi.unity",${nl}                "Assets/_Project/Scenes/10_Kanyakumari_Cape.unity",${nl}                "Assets/_Project/Scenes/11_Agasthyamalai_Wilds.unity"${nl}            };`;

code = code.replace(arrayTarget, newArray);

// 3. Add scene builder methods
const methodsToAdd = `
        private static void BuildMaduraiScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            string path = $"{SceneFolderPath}/09_Madurai_Meenakshi.unity";

            SetupSun(new Color(1.0f, 0.95f, 0.88f), 1.2f, Quaternion.Euler(50f, -30f, 0f));
            SetupCommonManagers("madurai_meenakshi", "Madurai Cultural Sanctuary", "மதுரை பண்பாட்டு சரணாலயம்");
            SetupPlayerAndCamera(new Vector3(0f, 0.5f, 0f));
            SetupHUD("Madurai Meenakshi", "மதுரை பண்பாட்டு சரணாலயம்");

            var envRoot = new GameObject("--- MADURAI_ENVIRONMENT ---");
            var ground = GameObject.CreatePrimitive(PrimitiveType.Cube);
            ground.name = "Temple_Courtyard_Stone";
            ground.transform.SetParent(envRoot.transform, false);
            ground.transform.position = new Vector3(0f, -0.1f, 0f);
            ground.transform.localScale = new Vector3(80f, 0.2f, 80f);

            EditorSceneManager.SaveScene(scene, path);
        }

        private static void BuildKanyakumariScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            string path = $"{SceneFolderPath}/10_Kanyakumari_Cape.unity";

            SetupSun(new Color(1.0f, 0.92f, 0.82f), 1.25f, Quaternion.Euler(35f, 45f, 0f));
            SetupCommonManagers("kanyakumari_cape", "Kanyakumari Oceans Confluence", "கன்னியாகுமரி முக்கடல் சங்கமம்");
            SetupPlayerAndCamera(new Vector3(0f, 0.5f, 0f));
            SetupHUD("Kanyakumari Cape", "கன்னியாகுமரி முக்கடல் சங்கமம்");

            var envRoot = new GameObject("--- KANYAKUMARI_ENVIRONMENT ---");
            var ground = GameObject.CreatePrimitive(PrimitiveType.Cube);
            ground.name = "Coastal_Confluence_Rock";
            ground.transform.SetParent(envRoot.transform, false);
            ground.transform.position = new Vector3(0f, -0.1f, 0f);
            ground.transform.localScale = new Vector3(80f, 0.2f, 80f);

            EditorSceneManager.SaveScene(scene, path);
        }

        private static void BuildAgasthyamalaiScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            string path = $"{SceneFolderPath}/11_Agasthyamalai_Wilds.unity";

            SetupSun(new Color(0.88f, 0.94f, 1.0f), 1.1f, Quaternion.Euler(40f, -15f, 0f));
            SetupCommonManagers("agasthyamalai_wilds", "Agasthyamalai Sacred Biosphere", "அகத்தியமலை புனித உயிர்க்கோளம்");
            SetupPlayerAndCamera(new Vector3(0f, 0.5f, 0f));
            SetupHUD("Agasthyamalai Wilds", "அகத்தியமலை புனித உயிர்க்கோளம்");

            var envRoot = new GameObject("--- AGASTHYAMALAI_ENVIRONMENT ---");
            var ground = GameObject.CreatePrimitive(PrimitiveType.Cube);
            ground.name = "Medicinal_Montane_Ridge";
            ground.transform.SetParent(envRoot.transform, false);
            ground.transform.position = new Vector3(0f, -0.1f, 0f);
            ground.transform.localScale = new Vector3(80f, 0.2f, 80f);

            EditorSceneManager.SaveScene(scene, path);
        }
`;

// Insert before the last closing brace of the class
const lastBraceIdx = code.lastIndexOf('}');
code = code.slice(0, lastBraceIdx) + methodsToAdd + code.slice(lastBraceIdx);

fs.writeFileSync(filePath, code);
console.log('Successfully updated AssembleAllRegions.cs with Sangam scene assembly methods.');
