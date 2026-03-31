# 武將爭霸 Sango Fighter

<p align="center">
  <strong>A 2D web-based fighting game featuring Three Kingdoms heroes</strong><br>
  <em>三國武將格鬥遊戲 — 東漢末年，群雄爭霸</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-V12-gold" alt="Version">
  <img src="https://img.shields.io/badge/language-TypeScript-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/build-Vite-646cff" alt="Vite">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License">
  <img src="https://img.shields.io/badge/characters-24-red" alt="24 Characters">
  <img src="https://img.shields.io/badge/platform-Web%20%7C%20Mobile-orange" alt="Platform">
</p>

---

## ✨ Features

- **24 Playable Characters** — Heroes from Shu Han (蜀漢), Cao Wei (曹魏), Sun Wu (孫吳), and other factions
- **5 Game Modes** — PvP, vs CPU (3 difficulty levels), Story Mode, Move List, Stage List
- **Deep Combat System** — Special moves with command inputs (QCF, DPF, HCF), energy/chi meter, knockdown bar
- **3 Story Campaigns** — 15 chapters of historically-inspired narrative with dialogue
- **Procedural Sprites** — All character sprites generated via Canvas 2D (zero image dependencies)
- **Mobile Support** — Virtual joystick and touch buttons for mobile play
- **6 Battle Stages** — Themed backgrounds with particle effects
- **Zero Dependencies** — Pure TypeScript/HTML5 Canvas (no runtime libraries)

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.x
- npm >= 9.x

### Installation

```bash
# Clone the repository
git clone https://github.com/isianust/G3KingFight.git
cd G3KingFight

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:3000` in your browser to play.

### Build for Production

```bash
npm run build     # Build optimized output to dist/
npm run preview   # Preview the production build
```

---

## 🎮 Controls

### Player 1 (Keyboard)

| Action | Key |
|--------|-----|
| Move Left/Right | `A` / `D` |
| Jump | `W` |
| Light Attack | `U` |
| Heavy Attack | `I` |
| Block | `S` (+ hold back) |
| Charge Energy | `E` |
| Special Moves | Command + Attack |

### Player 2 (PvP Mode)

| Action | Key |
|--------|-----|
| Move Left/Right | `←` / `→` |
| Jump | `↑` |
| Light Attack | `Enter` |
| Heavy Attack | `/` |
| Block | `↓` (+ hold back) |
| Charge Energy | `.` |

### Command Inputs (Special Moves)

| Notation | Input | Description |
|----------|-------|-------------|
| QCF | ↓ ↘ → + Attack | Quarter-circle forward |
| QCB | ↓ ↙ ← + Attack | Quarter-circle back |
| DPF | → ↓ ↘ + Attack | Dragon punch forward |
| HCF | ← ↙ ↓ ↘ → + Attack | Half-circle forward |
| DD | ↓ ↓ + Attack | Double down |
| FF | → → + Attack | Double forward |

### Mobile

Touch controls with virtual joystick (left) and action buttons (right).

---

## ⚔️ Characters

### 蜀漢 Shu Han (Green)

| Character | Weapon | Role |
|-----------|--------|------|
| 關羽 Guan Yu | 青龍偃月刀 | Glaive master |
| 張飛 Zhang Fei | 丈八蛇矛 | Spear berserker |
| 趙雲 Zhao Yun | 亮銀槍 | Balanced hero |
| 馬超 Ma Chao | 龍騎槍 | Speed fighter |
| 黃忠 Huang Zhong | 金雀弓 | Ranged archer |

### 曹魏 Cao Wei (Blue)

| Character | Weapon | Role |
|-----------|--------|------|
| 曹操 Cao Cao | 倚天劍 | Tactician |
| 夏侯惇 Xiahou Dun | 麒麟牙 | Tank |
| 夏侯淵 Xiahou Yuan | 虎爪 | Aggressive |
| 徐晃 Xu Huang | 大斧 | Power |
| 許褚 Xu Chu | 裸衣雙刀 | Grappler |
| 典韋 Dian Wei | 雙鐵戟 | Dual wielder |

### 孫吳 Sun Wu (Orange/Red)

| Character | Weapon | Role |
|-----------|--------|------|
| 孫堅 Sun Jian | 古錠刀 | Founder |
| 孫策 Sun Ce | 霸王槍 | Conqueror |
| 周瑜 Zhou Yu | 古劍 | Fire strategist |
| 太史慈 Taishi Ci | 雙戟 | Dual striker |
| 甘寧 Gan Ning | 鈴鐺刀 | Bell pirate |
| 黃蓋 Huang Gai | 鐵鞭 | Iron whip |

### 群雄 Other Heroes

| Character | Weapon | Role |
|-----------|--------|------|
| 呂布 Lü Bu | 方天畫戟 | Legendary |
| 袁紹 Yuan Shao | 蒼狼劍 | Noble |
| 董卓 Dong Zhuo | 暴君刀 | Tyrant |

Plus **4 Soldier Types**: Sword (劍兵), Blade (刀兵), Spear (槍兵), Archer (弓兵)

---

## 📖 Story Mode

Three historical campaigns with 5 chapters each:

### 🟢 蜀漢傳 Legend of Shu Han
Follow Zhao Yun through the Yellow Turban Rebellion, Battle of Hulao Pass, Changban, Red Cliff, and Mount Dingjun.

### 🔵 曹魏傳 Legend of Cao Wei
Lead Cao Cao from the assassination of Dong Zhuo through Puyang, Guandu, Northern Campaign, to Red Cliff.

### 🟠 孫吳傳 Legend of Sun Wu
Rise with Sun Ce from Sun Jian's uprising through the Jiangdong unification, Red Cliff, to Yiling.

---

## 🏗️ Architecture

```
G3KingFight/
├── index.html                     # Root HTML (Vite entry)
├── package.json                   # Project configuration
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite build configuration
├── vitest.config.ts               # Test configuration
├── eslint.config.js               # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── src/
│   ├── main.ts                    # Application entry point
│   ├── style.css                  # Game styles (1800+ lines)
│   ├── constants/
│   │   ├── gameConfig.ts          # Game configuration constants
│   │   └── enums.ts               # Enums: ANIM, MOVE_TYPE, CMD, etc.
│   ├── types/
│   │   └── index.ts               # TypeScript type definitions
│   ├── entities/
│   │   ├── Sprite.ts              # Base sprite class
│   │   ├── Fighter.ts             # Fighter class (combat, moves, physics)
│   │   └── Projectile.ts          # Projectile class (glow effects)
│   ├── data/
│   │   ├── characters.ts          # 24 character roster + 4 soldier types
│   │   └── stories.ts             # 3 campaign storylines (15 chapters)
│   ├── core/
│   │   ├── GameEngine.ts          # Game loop, state management
│   │   └── InputManager.ts        # Keyboard + mobile input
│   ├── ai/
│   │   └── AIController.ts        # CPU opponent AI
│   ├── ui/screens/
│   │   ├── CharacterSelect.ts     # Character selection UI
│   │   ├── StoryMode.ts           # Story mode flow
│   │   ├── BattleUI.ts            # HUD, results, battle UI
│   │   └── MoveListOverlay.ts     # Move list, stage list overlays
│   └── rendering/
│       ├── SpriteGenerator.ts     # Procedural sprite generation
│       ├── BackgroundRenderer.ts  # Stage backgrounds + particles
│       └── EffectsRenderer.ts     # Screen effects (shake, flash)
├── sango-fighter/                 # Original vanilla JS (legacy)
└── public/                        # Static assets
    └── assets/
        ├── backgrounds/
        ├── characters/
        └── ui/
```

---

## 🛠️ Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint on src/ |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run typecheck` | TypeScript type checking |

### Tech Stack

| Category | Technology |
|----------|-----------|
| Language | TypeScript 6.x |
| Build | Vite 8.x |
| Rendering | HTML5 Canvas 2D |
| Linting | ESLint 10 + Prettier 3 |
| Testing | Vitest 4 |
| Git Hooks | Husky + lint-staged |

### Code Quality

- **TypeScript** strict mode with full type safety
- **ESLint** for code quality enforcement
- **Prettier** for consistent formatting
- **Husky** pre-commit hooks run lint-staged automatically
- **Modular architecture** with clear separation of concerns

---

## 🎯 Combat System

### Health & Energy

- **Health (HP)**: 200 for heroes, 40 for soldiers
- **Energy (氣)**: Charge to 100 for ultimate moves
  - +8 on hitting opponent
  - +5 when taking damage
  - +1.2 per frame while charging
- **Knockdown Bar (倒地條)**: Depletes from attacks; when empty, fighter is knocked down

### Damage & Defense

- **Light Attack**: Base damage per character, +20 knockdown
- **Heavy Attack**: Higher damage, +50 knockdown
- **Special Move**: Variable damage, instant knockdown (100)
- **Blocking**: 70% damage reduction, 50% knockback reduction
- **Ultimate**: Costs 100 energy, high damage

### Difficulty Levels

| Level | Damage Multiplier | AI Block Rate |
|-------|-------------------|---------------|
| 🟢 Easy | 1.0× | 40% |
| 🟡 Normal | 1.3× | 55% |
| 🔴 Hard | 1.6× | 70% |

---

## 🗺️ Roadmap

- [x] Core fighting engine with 24 characters
- [x] Story mode with 3 campaigns
- [x] Mobile touch controls
- [x] TypeScript migration
- [x] Vite build system
- [x] ESLint + Prettier
- [ ] Audio system (BGM + SFX)
- [ ] localStorage save system
- [ ] Settings page (volume, key config)
- [ ] Unit + E2E tests
- [ ] CI/CD with GitHub Actions
- [ ] Online multiplayer (WebSocket/WebRTC)
- [ ] Training mode
- [ ] Replay system
- [ ] i18n (multi-language support)

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code passes `npm run lint` and `npm run typecheck` before submitting.

---

<p align="center">
  <strong>武將爭霸 Sango Fighter</strong> — Built with ❤️ and TypeScript
</p>
