# The Whispering Wilds - Storefront & Platform Integration Architecture

## Overview
*The Whispering Wilds* (`Kaattu Vazhi / Thadam`) uses an adapter-based architecture for PC storefront integration. The game is never hardcoded or locked to a single storefront ecosystem (such as Steam, Epic Games Store, or GOG).

---

## Authority & Provider Architecture

```mermaid
graph TD
    subgraph "Authoritative Gameplay Loop"
        GameState[GameState & SaveManager]
        AchSys[AchievementSystem]
        InputMgr[InputManager]
    end

    subgraph "Platform Integration Layer"
        PlatSys[PlatformIntegrationSystem]
        PlatSvc[PlatformService Facade]
    end

    subgraph "Provider Adapters"
        Generic[GenericPlatformProvider <br> Direct / Offline DRM-Free]
        Store[StorePlatformProvider <br> Steam / Epic / GOG Compatible]
        DevMock[DevelopmentPlatformProvider <br> Unit Testing & Mocking]
    end

    GameState --> PlatSys
    AchSys --> PlatSys
    InputMgr --> PlatSys
    PlatSys --> PlatSvc
    PlatSvc --> Generic
    PlatSvc --> Store
    PlatSvc --> DevMock
```

### Core Architecture Principles
1. **Single Authoritative Manager**: `PlatformIntegrationSystem` is the single point of entry connecting game systems to external platform services.
2. **Providers as Adapters**:
   - `GenericPlatformProvider`: Standalone direct release, DRM-free, zero network/store requirement.
   - `StorePlatformProvider`: Standardized adapter for Steam/Epic/GOG integrations.
   - `DevelopmentPlatformProvider`: Test mock simulating offline/cloud failures.
3. **100% Offline Gameplay Autonomy**:
   - Single-player exploration, quests, dialog, inventory, and local saves never require storefront connectivity.
   - If a storefront service fails or disconnects, gameplay continues completely unimpeded.
4. **Zero Credential Collection**:
   - Under no circumstances does the game collect, prompt for, or store storefront passwords, secret keys, or authentication tokens.
5. **Absolute Customization Ceiling**:
   - Player customization ceiling (`0 <= customizationChangesUsed <= 5`) is enforced before and after any cloud sync, achievement unlock, or platform event.
