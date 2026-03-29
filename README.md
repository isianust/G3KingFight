# G3 King Fight

A browser-based turn-based battle game where you face off against an AI-controlled Enemy King.

## How to Play

Open `index.html` in any modern browser — no build step or server required.

### Actions

| Action | Effect | MP Cost |
|---|---|---|
| ⚔️ Attack | Deal 10–25 damage | 0 |
| 💥 Heavy Strike | Deal 20–40 damage | 5 |
| 🛡️ Guard | Reduce incoming damage by 50% next hit | 0 |
| 💊 Heal | Restore 15–25 HP | 10 |

- Each king starts with **100 HP** and **50 MP**.
- MP regenerates by **5** each turn.
- The last king standing wins. 👑

## Files

| File | Description |
|---|---|
| `index.html` | Game markup and screen layout |
| `style.css` | Visual styling |
| `game.js` | Game logic, AI, and DOM interactions |
