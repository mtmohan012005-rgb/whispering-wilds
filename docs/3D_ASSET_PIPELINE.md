# 3D ASSET QUALITY CONTROL PIPELINE & BLENDER INTEGRATION
**Project**: THE WHISPERING WILDS (*Kaattu Vazhi* / காட்டு வழி)  

---

## 1. Asset Lifecycle & Approval Flow

Every 3D asset progresses through this strict gate before inclusion in production:

```
[ BLENDER MODELING & RIGGING ]
              │
              ▼
    [ CLEAN GLB EXPORT ]
              │
              ▼
[ LOCAL ASSET DIRECTORY (assets/) ]
              │
              ▼
[ AUTOMATED TECHNICAL VALIDATION (npm run assets:validate) ]
              │
              ▼
   [ ASSET MANIFEST RECORDING ]
              │
              ▼
    [ CULTURAL AUTHENTICITY REVIEW ]
              │
              ▼
  [ LICENSE & PROVENANCE VERIFICATION ]
              │
              ▼
 [ PERFORMANCE & MEMORY PROFILING ]
              │
              ▼
        [ APPROVED ]  ──>  [ GAME ENGINE INTEGRATION ]
```

---

## 2. Blender Export Standards

When exporting glTF 2.0 (`.glb`) models from Blender 3.6+ / 4.x:
1. **Apply All Transforms**: Rotation, Scale, and Location must be baked into object delta transforms (`Ctrl + A -> All Transforms`).
2. **Coordinate Orientation**: Player and entity forward vector must face **+Z** (standard Three.js camera alignment convention).
3. **Hierarchy Cleanup**: Remove extraneous helper nulls, cameras, and lights from export selection.
4. **Origin Alignment**:
   - Humanoids / Animals: Pivot placed strictly at feet / ground contact level $(0, 0, 0)$.
   - Doors: Pivot placed at vertical hinge line.
   - Wheels / Gears: Pivot placed at center axis of rotation.
5. **Collection Standard**:
   - `COLLECTION_RENDER`: Visible high/medium detail render meshes.
   - `COLLECTION_COLLISION`: Convex hulls / bounding boxes with `_col` suffix.
   - `COLLECTION_RIG`: Deform armature bones only.
   - `COLLECTION_LOD`: Discrete LOD0, LOD1, LOD2 mesh variants.

---

## 3. Cultural Asset Review Standards
- **Traditional Garments**: Veshti pleats, angavastram draping, and thundu placement must be reviewed for authentic Tamil styling.
- **Temple Architecture**: Dravidian gopuram tiers, stone pillar carvings, and mandapam proportions must be grounded in real Tamil architectural history. Fictionalized inscriptions must have `fictionalized = true` in data registries.

---

## 4. Production Commands
```bash
# Validate all GLB meshes, chunks, and transforms
npm run assets:validate

# Validate texture dimensions, formats, and power-of-two flags
npm run textures:validate

# Validate animation clip tracks, durations, and skeleton targets
npm run animations:validate

# Generate comprehensive markdown and JSON audit report
npm run assets:report
```
