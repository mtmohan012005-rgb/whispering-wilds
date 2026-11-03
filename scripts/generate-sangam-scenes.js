const fs = require('fs');
const path = require('path');

const scenesDir = path.resolve(__dirname, '..', 'unity/Assets/_Project/Scenes');
const templateScenePath = path.join(scenesDir, '07_Nilgiris_Sanctuary.unity');
const templateYaml = fs.readFileSync(templateScenePath, 'utf8');

const sangamScenes = [
  {
    fileName: '09_Madurai_Meenakshi.unity',
    guid: 'af7553a3c9a45fd4fa0d5108ea1fb1f9',
    regionId: 'madurai_meenakshi',
    engName: 'Madurai Cultural Sanctuary',
    tamName: 'மதுரை பண்பாட்டு சரணாலயம்',
    rootName: '--- MADURAI_ENVIRONMENT ---',
    npcName: 'Meenakshi (Garland Vendor)'
  },
  {
    fileName: '10_Kanyakumari_Cape.unity',
    guid: 'af7553a3c9a45fd4fa0d5108ea1fb1fa',
    regionId: 'kanyakumari_cape',
    engName: 'Kanyakumari Oceans Confluence',
    tamName: 'கன்னியாகுமரி முக்கடல் சங்கமம்',
    rootName: '--- KANYAKUMARI_ENVIRONMENT ---',
    npcName: 'Kumaran (Coastal Navigator)'
  },
  {
    fileName: '11_Agasthyamalai_Wilds.unity',
    guid: 'af7553a3c9a45fd4fa0d5108ea1fb1fb',
    regionId: 'agasthyamalai_wilds',
    engName: 'Agasthyamalai Sacred Biosphere',
    tamName: 'அகத்தியமலை புனித உயிர்க்கோளம்',
    rootName: '--- AGASTHYAMALAI_ENVIRONMENT ---',
    npcName: 'Siddhar Maruthuvar'
  }
];

function generateMeta(guid) {
  return `fileFormatVersion: 2
guid: ${guid}
DefaultImporter:
  externalObjects: {}
  userData: 
  assetBundleName: 
  assetBundleVariant: 
`;
}

for (const sc of sangamScenes) {
  let sceneYaml = templateYaml;
  sceneYaml = sceneYaml.replace(/NILGIRIS_ENVIRONMENT/g, sc.rootName.replace(/---/g, '').trim());
  sceneYaml = sceneYaml.replace(/nilgiris/g, sc.regionId);
  sceneYaml = sceneYaml.replace(/Nilgiris Shola-Tea Biosphere/g, sc.engName);
  sceneYaml = sceneYaml.replace(/நீலகிரி சோலை - தேயிலை வனம்/g, sc.tamName);

  const destPath = path.join(scenesDir, sc.fileName);
  const metaPath = path.join(scenesDir, `${sc.fileName}.meta`);

  fs.writeFileSync(destPath, sceneYaml);
  fs.writeFileSync(metaPath, generateMeta(sc.guid));
  console.log(`Generated Sangam scene: ${sc.fileName} (GUID: ${sc.guid})`);
}
