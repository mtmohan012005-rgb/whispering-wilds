// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - EXPLORER CAMERA SYSTEM
// Mechanical Viewfinder, Focus, Zoom, Canvas Snapshot & Subject Recognition
// ============================================================================

class ExplorerCamera {
  constructor() {
    this.isActive = false;
    this.zoom = 1.0;
    this.focus = 50;
    this.photos = [];
    this.overlayEl = null;
    this.subjectLabelEl = null;
  }

  init(overlayEl, subjectLabelEl) {
    this.overlayEl = overlayEl;
    this.subjectLabelEl = subjectLabelEl;
  }

  toggle() {
    this.isActive = !this.isActive;
    if (this.overlayEl) {
      if (this.isActive) {
        this.overlayEl.classList.remove('hidden');
      } else {
        this.overlayEl.classList.add('hidden');
      }
    }
    return this.isActive;
  }

  setZoom(val) {
    this.zoom = Math.max(1.0, Math.min(3.5, val));
  }

  // Detect which landmarks, wildlife, or clues are in the camera's center frame
  scanSubjects(player, worldData, entityManager, camera) {
    if (!this.isActive) return null;

    // Viewfinder capture area in world coordinates
    const viewWidth = camera.viewportWidth * 0.55 / this.zoom;
    const viewHeight = camera.viewportHeight * 0.55 / this.zoom;
    const frameMinX = player.x - viewWidth / 2;
    const frameMaxX = player.x + viewWidth / 2;
    const frameMinY = player.y - viewHeight / 2;
    const frameMaxY = player.y + viewHeight / 2;

    // Check Landmarks
    for (let lm of worldData.landmarks) {
      if (lm.x >= frameMinX && lm.x <= frameMaxX && lm.y >= frameMinY && lm.y <= frameMaxY) {
        return { type: 'landmark', data: lm };
      }
    }

    // Check Living Wildlife
    for (let animal of entityManager.wildlife) {
      if (animal.x >= frameMinX && animal.x <= frameMaxX && animal.y >= frameMinY && animal.y <= frameMaxY) {
        return { type: 'wildlife', data: animal };
      }
    }

    // Check NPCs
    for (let npc of entityManager.npcs) {
      if (npc.x >= frameMinX && npc.x <= frameMaxX && npc.y >= frameMinY && npc.y <= frameMaxY) {
        return { type: 'npc', data: npc };
      }
    }

    return null;
  }

  captureSnapshot(sourceCanvas, detectedSubject, biomeName, audio, journal) {
    if (audio) {
      audio.playCameraShutter();
    }

    // Create thumbnail from game canvas
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = 320;
    snapCanvas.height = 240;
    const sCtx = snapCanvas.getContext('2d');

    // Crop center view
    const srcW = sourceCanvas.width * 0.6;
    const srcH = sourceCanvas.height * 0.6;
    const srcX = (sourceCanvas.width - srcW) / 2;
    const srcY = (sourceCanvas.height - srcH) / 2;

    sCtx.drawImage(sourceCanvas, srcX, srcY, srcW, srcH, 0, 0, 320, 240);

    // Add vintage sepia & vignette styling
    sCtx.fillStyle = 'rgba(120, 80, 30, 0.15)';
    sCtx.fillRect(0, 0, 320, 240);

    const photoData = {
      id: 'photo_' + Date.now(),
      dataUrl: snapCanvas.toDataURL('image/jpeg', 0.85),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      biome: biomeName,
      subjectName: detectedSubject ? (detectedSubject.data.tamilName || detectedSubject.data.name) : 'Scenic Tamil Nadu Trail',
      subjectId: detectedSubject ? detectedSubject.data.id : null,
      lore: detectedSubject ? (detectedSubject.data.lore || 'A tranquil moment captured in the field.') : 'Open wilderness path and shifting skies.'
    };

    this.photos.push(photoData);

    // Log into Field Journal
    if (journal) {
      journal.addPhoto(photoData);
      if (detectedSubject) {
        journal.unlockEntry(detectedSubject.data.id);
      }
    }

    if (audio && detectedSubject) {
      setTimeout(() => audio.playDiscoveryJingle(), 400);
    }

    return photoData;
  }
}

window.ExplorerCamera = ExplorerCamera;
