# The Whispering Wilds (காட்டு வழி • தடம்) - Asset License Manifest

This document records the provenance, licensing, author, and usage permissions for all third-party and authored assets used in the Unity 6 production build.

## 1. Third-Party Libraries & Engine Packages
| Asset / Package | Source | License | Author / Vendor | Redistribution Permission |
| :--- | :--- | :--- | :--- | :--- |
| **Unity Engine 6** | Unity Technologies | Unity Software License | Unity Technologies | Standalone PC build binary |
| **Unity Input System** | Unity Package Manager | Unity Companion License | Unity Technologies | Allowed |
| **Cinemachine** | Unity Package Manager | Unity Companion License | Unity Technologies | Allowed |
| **AI Navigation** | Unity Package Manager | Unity Companion License | Unity Technologies | **NOT INSTALLED** — `com.unity.ai.navigation` is absent from `Packages/manifest.json`; `NavMeshSurface` is unavailable and no navmesh is baked. Listed for planned use only. |
| **glTFast** | Unity Package Manager | Apache 2.0 | Unity Technologies / Attila Szabo | Permissive commercial |
| **Antigravity IDE Support** | GitHub (`usmanbutt-dev/antigravity-unity`) | MIT License | Usman Butt | Open source |
| **MCP For Unity** | GitHub (`CoplayDev/unity-mcp`) | MIT License | CoplayDev | Open source |

## 2. 3D Meshes, Characters & Environment Models
| Model Path / Group | Category | License | Origin / Production Note | Status |
| :--- | :--- | :--- | :--- | :--- |
| `Characters/Player/` | Hero Human Character | Custom Studio Authored | Modeled for The Whispering Wilds | Authored Production |
| `Characters/NPCs/` | Regional Tamil NPCs | Custom Studio Authored | Velu, Murugan, Meenakshi, Selvam | Authored Production |
| `Characters/Wildlife/` | Regional Animals | Custom Studio Authored | Nilgiri Tahr, Peafowl, Langur, Gaur | Authored Production |
| `Architecture/Chennai/` | Urban Structures | Custom Studio Authored | George Town, Tea Kadai, Madras High Court | Authored Production |
| `Architecture/Chettinad/` | Heritage Mansions | Custom Studio Authored | Athangudi Tiles, Courtyard Columns | Authored Production |
| `Architecture/Delta/` | Rural Village | Custom Studio Authored | Sluice gates, cattle sheds, granaries | Authored Production |
| `Architecture/Nilgiris/` | Shola / Tea Estates | Custom Studio Authored | Toda huts, tea factories | Authored Production |

## 3. Audio & Music
| Audio Group | Category | License | Notes |
| :--- | :--- | :--- | :--- |
| `Audio/Music/` | Regional Soundscapes | Studio Authored / CC-BY 4.0 | Classical Tamil percussion, veena, flute motifs |
| `Audio/Ambience/` | Field Recordings | Studio Authored / CC0 | Chennai market, Pichavaram waters, Nilgiris breeze |
| `Audio/SFX/` | Foley & Interaction | Studio Authored / CC0 | Footsteps on mud, granite, dry leaves; ceramic/brass clatter |
