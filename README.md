
---

## Directory Structure

```text
.
├─ index.js
└─ src/
   ├─ discord/
   │  ├─ client/
   │  │  ├─ CommandManager.js          # Scans and loads feature commands at runtime
   │  │  └─ EventManager.js            # Scans and loads both client + feature events
   │  └─ events/
   │     ├─ interactionCreate.js       # Global interaction entrypoint (slash buttons, selects, etc.)
   │     └─ ready.js                   # Bot ready handler (logs and boot checks)
   │
   ├─ features/
   │  ├─ gacha/
   │  │  ├─ commands/
   │  │  │  ├─ summon.js               # /summon
   │  │  │  └─ admin/
   │  │  │     └─ admin-gacha.js       # /admin-gacha (admin tools for gacha)
   │  │  ├─ app/
   │  │  │  └─ GachaService.js         # Gacha domain logic (draw rolls, rates, rewards)
   │  │  ├─ data/
   │  │  │  ├─ DevilFruits.js          # Fruit definitions (ids, names, rarities, metadata)
   │  │  │  └─ DevilFruitSkills.js     # Fruit→skills mapping (imports combat skills below)
   │  │  └─ ui/
   │  │     └─ GachaRevealUtils.js     # Reveal / animation helpers, embed building, etc.
   │  │
   │  ├─ pvp/
   │  │  ├─ commands/
   │  │  │  ├─ pvp-raid.js             # /pvp-raid
   │  │  │  └─ pvp-raid-history.js     # /pvp-raid-history
   │  │  ├─ events/
   │  │  │  └─ pvpChallengeHandler.js  # Button/select handlers & flow orchestration for PvP
   │  │  └─ app/
   │  │     └─ PvPService.js           # PvP domain logic (matches, raids, rewards, validation)
   │  │
   │  ├─ economy/
   │  │  ├─ commands/
   │  │  │  ├─ balance.js              # /balance
   │  │  │  └─ income.js               # /income
   │  │  └─ app/
   │  │     └─ EconomyService.js       # Economy domain (balances, income ticks, transfers)
   │  │
   │  └─ combat/
   │     ├─ app/
   │     │  └─ SkillEffectService.js   # Applies skill effects (damage, status, multipliers)
   │     └─ data/
   │        ├─ effects.js              # Core effect definitions used by combat resolution
   │        └─ skills/
   │           ├─ CommonSkills.js
   │           ├─ UncommonSkills.js
   │           ├─ RareSkills.js
   │           ├─ EpicSkills.js
   │           ├─ LegendarySkills.js
   │           ├─ MythicalSkills.js
   │           └─ DivineSkills.js      # (if present in your repo)
   │
   ├─ shared/
   │  ├─ config/
   │  │  ├─ Config.js                  # Central config loader/adapter
   │  │  ├─ default.json               # Default config profile
   │  │  └─ production.json            # Production overrides (example)
   │  ├─ constants/
   │  │  └─ Constants.js               # Global constants (numbers, ids, category names, emojis)
   │  ├─ db/
   │  │  ├─ DatabaseManager.js         # DB client / pool & helpers
   │  │  └─ migrations/
   │  │     └─ 001_initial_schema.sql  # Example SQL migration
   │  └─ utils/
   │     ├─ ErrorHandler.js            # Centralized try/catch wrappers & user-safe errors
   │     ├─ InteractionHandler.js      # Helpers for component collectors, pagination, etc.
   │     ├─ Logger.js                  # Logger adapter (respects LOG_LEVEL)
   │     ├─ RateLimiter.js             # Simple per-user or per-command rate limiting
   │     └─ SystemMonitor.js           # Health checks, memory/uptime logging, etc.
   │
   └─ (anything else that remained unchanged)
