# G3KingFight

三國志武將爭霸 (Sango Fighter) — HTML5 Canvas 2D 格鬥遊戲

## 🎮 遊戲簡介

基於 1993 年經典 DOS 遊戲《三國志武將爭霸》的網頁重製版，支援雙人對戰及 AI 對戰模式。

**Play**: 啟用 GitHub Pages 後，遊戲地址為 `https://isianust.github.io/G3KingFight/sango-fighter/index.html`

---

## 📋 Branch 版本對照表

| 版本 | 現有 Branch 名稱 | 建議重命名為 | PR | 說明 |
|------|------------------|-------------|-----|------|
| V1 | `copilot/g3-king-fight` | `V1-g3-king-fight` | #1 (Draft) | 初始遊戲版本（回合制戰鬥） |
| V2 | `copilot/setup-project-structure` | `V2-setup-project-structure` | #2 (Merged) | Sango Fighter HTML5 基礎框架、12 武將、PvP/PvCPU |
| V3 | `copilot/improve-game-design-elements` | `V3-improve-game-design-elements` | #3 (Merged) | 全面翻新：孫吳/群雄陣營、氣系統、必殺技、故事模式 |
| V4 | `copilot/link-to-game` | `V4-link-to-game` | — | 連結用分支（與 V3 合併點相同） |
| V5 | `copilot/full-testing-and-battle-ui-improvements` | `V5-full-testing-and-battle-ui-improvements` | #4 (Merged) | 修復黑屏、重新映射 P1 按鍵、戰鬥中招式表 |
| V6 | `copilot/update-game-ui-and-controls` | `V6-update-game-ui-and-controls` | #5 (Merged) | 場景背景、手機觸控、角色細節渲染、擊倒系統 |

### 🔄 如何重命名 Branch

在 GitHub 網頁上：
1. 進入 **Settings** → **Branches**
2. 點擊每個 branch 旁邊的 ✏️ 鉛筆圖標
3. 按上表重命名

或者使用 Git CLI：
```bash
# 對每個 branch 執行以下命令（以 V1 為例）：
git branch -m copilot/g3-king-fight V1-g3-king-fight
git push origin V1-g3-king-fight
git push origin --delete copilot/g3-king-fight
```

---

## 📝 Branch 命名規範（新版本必須遵守）

所有新 branch 必須使用以下格式：

```
V{版本號}-{功能描述}
```

### 規則

1. **版本號連續遞增**：下一個新版本為 `V7-...`，之後 `V8-...`，依此類推
2. **功能描述使用英文**：用 `-` 連接單詞，簡短描述該版本的主要改動
3. **全部小寫**（版本號 V 大寫除外）

### 範例

```
V7-add-sound-effects
V8-multiplayer-online-mode
V9-character-sprite-artwork
V10-performance-optimization
```

### `main` Branch

- `main` 始終是最新的穩定版本
- 每個版本 branch 開發完成後合併到 `main`
- 不要直接在 `main` 上開發

---

## 🕹️ 操作方式

| 動作 | P1 | P2 (PvP) |
|------|-----|-----------|
| 移動 | A / D | ← / → |
| 跳躍 | W | ↑ |
| 輕攻擊 | U | Enter |
| 重攻擊 | I | / |
| 防禦 | S + 後退 | ↓ + 後退 |
| 蓄氣 | E | . |

---

## 📁 專案結構

```
G3KingFight/
├── README.md
├── .gitignore
└── sango-fighter/
    ├── index.html      # 遊戲主頁面
    ├── style.css       # 暗黑奇幻主題樣式
    ├── game.js         # 遊戲引擎、戰鬥邏輯、AI
    ├── classes.js       # Sprite/Fighter 類別
    ├── characters.js    # 武將資料、招式、陣營
    └── story.js         # 故事模式劇情
```
