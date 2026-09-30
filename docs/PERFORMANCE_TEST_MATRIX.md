# THE WHISPERING WILDS (காட்டு வழி • தடம்)
## Performance Test Matrix & Hardware Profile Targets
**Engine**: Unity 6000.6.3f1 | HDRP 17.7.0  
**Target Platform**: Standalone Windows x64 Native  

---

### 1. Hardware Quality Tiers & Performance Targets

| Quality Tier | Target Hardware Profile | Target FPS | Render Scale Range | Shadow Distance | Volumetric Fog | Texture Budget |
|---|---|---|---|---|---|---|
| **Very Low** | Intel Iris Xe / UHD, 8GB RAM, integrated GPU | 30 FPS | 0.65 – 0.75 | 30m | Low / Screen-Space | 384 MB |
| **Low** | GTX 1050 Ti / GTX 1650, 8GB RAM, quad-core CPU | 30–45 FPS | 0.75 – 0.85 | 50m | Medium / Volumetric | 512 MB |
| **Medium** | GTX 1060 / RTX 2060, 16GB RAM, 6-core CPU | 60 FPS | 0.85 – 0.95 | 80m | High / Volumetric | 1024 MB |
| **High** | RTX 3060 / RTX 4060, 16GB RAM, 8-core CPU | 60 FPS | 1.00 | 120m | High / Volumetric | 2048 MB |
| **Ultra** | RTX 4070 / RTX 4080+, 32GB RAM, modern 8+ core | 90–120 FPS | 1.00 – 1.20 | 180m | Ultra / Volumetric + Reprojection | 4096 MB |

---

### 2. Regional Performance & Simulation Budget

| Region Scene | Biome Characteristics | Peak Draw Calls | Triangle Budget | Max Active NPCs | Max Active Wildlife |
|---|---|---|---|---|---|
| `02_Chennai_GeorgeTown` | Urban street grid, colonial facades, market stalls | 1,450 | 1.8M | 35 | 0 (Urban zone strictly free of wild animals) |
| `03_Pichavaram_Wetlands` | Estuarine tidal channels, dense mangrove root meshes | 1,200 | 1.5M | 15 (Fishermen) | 40 (Egrets, Kingfishers) |
| `04_Thanjavur_Delta` | Alluvial paddy basins, irrigation canals, Chola temple | 1,350 | 1.7M | 25 (Farmers) | 20 (Spotted Deer, Egret) |
| `05_Chettinad_Mansion` | Courtyard architecture, carved teak columns, terracotta | 980 | 1.2M | 12 (Residents) | 8 (Peafowl in outer scrub) |
| `06_Mamallapuram_Shore` | Granite monolith temples, coastline, stone artisan yards | 1,150 | 1.4M | 18 (Artisans/Fishermen) | 15 (Shore birds) |
| `07_Nilgiris_Sanctuary` | Steep montane tea terraces, shola cloud forest, mist | 1,600 | 2.1M | 20 (Tea workers) | 50 (Tahr, Gaur, Macaques, Elephants) |

---

### 3. Governor Budgets & Hysteresis Pacing
- **Adaptive Frame Rate Check**: Evaluated every frame against moving average of 60 frames.
- **Underperformance Drop Threshold**: If average FPS < 85% of target for > 3.0 continuous seconds, dynamic render scale steps down by 0.05.
- **Recovery Step-Up Threshold**: If average FPS >= 96% of target for > 8.0 continuous seconds, dynamic render scale steps up by 0.05.
- **Cooldown**: 4.0 second hysteresis lockout after any dynamic adjustment prevents rapid oscillations.
- **Emergency Memory Relief**: Triggered only if allocated memory exceeds 92% of the active tier budget; executes controlled boundary cleanup without in-game frame stutter.
