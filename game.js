/**
 * G3 King Fight – Game Logic
 * A turn-based 1-vs-AI fighting game.
 */

// ── Constants ──────────────────────────────────────────────────────────────
const MAX_HP = 100;
const MAX_MP = 50;
const MP_REGEN = 5;

const ACTIONS = {
  attack: {
    label: 'Attack',
    mpCost: 0,
    minDmg: 10,
    maxDmg: 25,
  },
  heavy: {
    label: 'Heavy Strike',
    mpCost: 5,
    minDmg: 20,
    maxDmg: 40,
  },
  guard: {
    label: 'Guard',
    mpCost: 0,
  },
  heal: {
    label: 'Heal',
    mpCost: 10,
    minHeal: 15,
    maxHeal: 25,
  },
};

// ── State ──────────────────────────────────────────────────────────────────
let state = {};

function createFighter(name) {
  return { name, hp: MAX_HP, mp: MAX_MP, guarding: false };
}

function initState() {
  state = {
    player: createFighter('You'),
    enemy: createFighter('Enemy King'),
    playerTurn: true,
    busy: false,
  };
}

// ── DOM Helpers ────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function log(msg) {
  const el = document.getElementById('battle-log');
  const p = document.createElement('p');
  p.textContent = msg;
  el.appendChild(p);
  el.scrollTop = el.scrollHeight;
}

function updateUI() {
  updateFighter('player', state.player);
  updateFighter('enemy', state.enemy);

  const indicator = document.getElementById('turn-indicator');
  indicator.textContent = state.playerTurn ? '⚔️  Your Turn' : '🤴  Enemy Turn';

  // Disable action buttons when it's not the player's turn or game is busy
  const disabled = !state.playerTurn || state.busy;
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.disabled = disabled;
  });

  // Disable MP-costing actions if not enough MP
  if (!disabled) {
    document.getElementById('btn-heavy').disabled = state.player.mp < ACTIONS.heavy.mpCost;
    document.getElementById('btn-heal').disabled  = state.player.mp < ACTIONS.heal.mpCost;
  }
}

function updateFighter(who, fighter) {
  const hpPct = Math.max(0, (fighter.hp / MAX_HP) * 100);
  const mpPct = Math.max(0, (fighter.mp / MAX_MP) * 100);

  document.getElementById(`${who}-hp-bar`).style.width = hpPct + '%';
  document.getElementById(`${who}-mp-bar`).style.width = mpPct + '%';
  document.getElementById(`${who}-hp-value`).textContent = Math.max(0, fighter.hp);
  document.getElementById(`${who}-mp-value`).textContent = Math.max(0, fighter.mp);

  const statusEl = document.getElementById(`${who}-status`);
  statusEl.innerHTML = '';
  if (fighter.guarding) {
    const b = document.createElement('span');
    b.className = 'badge badge-guard';
    b.textContent = '🛡 Guard';
    statusEl.appendChild(b);
  }
}

function spawnFloater(text, targetEl, color) {
  const rect = targetEl.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'floater';
  el.textContent = text;
  el.style.left = (rect.left + rect.width / 2 - 30) + 'px';
  el.style.top  = (rect.top  + rect.height / 2) + 'px';
  el.style.color = color;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

function shakeSprite(who) {
  const sprite = document.querySelector(`#${who}-fighter .fighter-sprite`);
  sprite.classList.remove('shake');
  void sprite.offsetWidth; // reflow
  sprite.classList.add('shake');
}

// ── Randomness ─────────────────────────────────────────────────────────────
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── Core Combat ────────────────────────────────────────────────────────────
/**
 * Apply an action from attacker to defender.
 * Returns true if the game is over.
 */
function applyAction(attacker, defender, attackerKey, defenderKey, action) {
  // Clear the attacker's guard at the start of their turn so it only
  // protects against the opponent's immediately preceding action.
  attacker.guarding = false;

  switch (action) {
    case 'attack': {
      let dmg = randInt(ACTIONS.attack.minDmg, ACTIONS.attack.maxDmg);
      if (defender.guarding) {
        dmg = Math.ceil(dmg / 2);
        log(`${attacker.name} attacks! ${defender.name} is guarding — reduced to ${dmg} damage.`);
      } else {
        log(`${attacker.name} attacks for ${dmg} damage!`);
      }
      defender.hp -= dmg;
      shakeSprite(defenderKey);
      spawnFloater(`-${dmg}`, document.querySelector(`#${defenderKey}-fighter .fighter-sprite`), '#ff6666');
      break;
    }
    case 'heavy': {
      if (attacker.mp < ACTIONS.heavy.mpCost) {
        log(`${attacker.name} doesn't have enough MP for Heavy Strike!`);
        return false;
      }
      attacker.mp -= ACTIONS.heavy.mpCost;
      let dmg = randInt(ACTIONS.heavy.minDmg, ACTIONS.heavy.maxDmg);
      if (defender.guarding) {
        dmg = Math.ceil(dmg / 2);
        log(`${attacker.name} uses Heavy Strike! ${defender.name} guards — reduced to ${dmg} damage.`);
      } else {
        log(`${attacker.name} unleashes a Heavy Strike for ${dmg} damage!`);
      }
      defender.hp -= dmg;
      shakeSprite(defenderKey);
      spawnFloater(`-${dmg}`, document.querySelector(`#${defenderKey}-fighter .fighter-sprite`), '#ff4400');
      break;
    }
    case 'guard': {
      attacker.guarding = true;
      log(`${attacker.name} takes a defensive stance!`);
      break;
    }
    case 'heal': {
      if (attacker.mp < ACTIONS.heal.mpCost) {
        log(`${attacker.name} doesn't have enough MP to Heal!`);
        return false;
      }
      attacker.mp -= ACTIONS.heal.mpCost;
      const heal = randInt(ACTIONS.heal.minHeal, ACTIONS.heal.maxHeal);
      const before = attacker.hp;
      attacker.hp = Math.min(MAX_HP, attacker.hp + heal);
      const actual = attacker.hp - before;
      log(`${attacker.name} heals for ${actual} HP!`);
      spawnFloater(`+${actual}`, document.querySelector(`#${attackerKey}-fighter .fighter-sprite`), '#66ff88');
      break;
    }
  }

  // Regenerate MP
  attacker.mp = Math.min(MAX_MP, attacker.mp + MP_REGEN);

  return false;
}

function checkWinner() {
  if (state.player.hp <= 0) return 'enemy';
  if (state.enemy.hp <= 0) return 'player';
  return null;
}

// ── AI Logic ───────────────────────────────────────────────────────────────
function chooseEnemyAction() {
  const e = state.enemy;
  const p = state.player;

  // Heal when low HP and has MP
  if (e.hp < 35 && e.mp >= ACTIONS.heal.mpCost) return 'heal';

  // Heavy Strike when player is not guarding and has MP
  if (e.mp >= ACTIONS.heavy.mpCost && !p.guarding && Math.random() < 0.4) return 'heavy';

  // Guard if player is likely to do heavy damage
  if (e.hp < 55 && Math.random() < 0.25) return 'guard';

  return 'attack';
}

// ── Turn Flow ──────────────────────────────────────────────────────────────
function playerTakeTurn(action) {
  if (!state.playerTurn || state.busy) return;

  state.busy = true;
  updateUI();

  applyAction(state.player, state.enemy, 'player', 'enemy', action);
  updateUI();

  const winner = checkWinner();
  if (winner) {
    setTimeout(() => endGame(winner), 800);
    return;
  }

  state.playerTurn = false;
  updateUI();

  // Enemy turn after short delay
  setTimeout(enemyTakeTurn, 1200);
}

function enemyTakeTurn() {
  const action = chooseEnemyAction();
  log(`${state.enemy.name} chooses ${ACTIONS[action].label}…`);

  applyAction(state.enemy, state.player, 'enemy', 'player', action);
  updateUI();

  const winner = checkWinner();
  if (winner) {
    setTimeout(() => endGame(winner), 800);
    return;
  }

  state.playerTurn = true;
  state.busy = false;
  updateUI();
}

// ── End Game ───────────────────────────────────────────────────────────────
function endGame(winner) {
  if (winner === 'player') {
    document.getElementById('result-icon').textContent = '👑';
    document.getElementById('result-title').textContent = 'Victory!';
    document.getElementById('result-message').textContent = 'You defeated the Enemy King and claimed the throne!';
  } else {
    document.getElementById('result-icon').textContent = '💀';
    document.getElementById('result-title').textContent = 'Defeated';
    document.getElementById('result-message').textContent = 'The Enemy King has bested you. Try again!';
  }
  showScreen('result-screen');
}

// ── Event Listeners ────────────────────────────────────────────────────────
document.getElementById('start-btn').addEventListener('click', () => {
  initState();
  document.getElementById('battle-log').innerHTML = '<p>The battle begins! Choose your action.</p>';
  showScreen('game-screen');
  updateUI();
});

document.getElementById('how-to-play-btn').addEventListener('click', () => {
  showScreen('how-to-play-screen');
});

document.getElementById('back-btn').addEventListener('click', () => {
  showScreen('title-screen');
});

document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    playerTakeTurn(btn.dataset.action);
  });
});

document.getElementById('play-again-btn').addEventListener('click', () => {
  initState();
  document.getElementById('battle-log').innerHTML = '<p>The battle begins! Choose your action.</p>';
  showScreen('game-screen');
  updateUI();
});

document.getElementById('menu-btn').addEventListener('click', () => {
  showScreen('title-screen');
});
