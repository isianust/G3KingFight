import { CharacterSelect } from '../ui/screens/CharacterSelect';
import { CHARACTER_ROSTER } from '../data/characters';
import { FACTION_DATA } from '../constants';

function setupDOM(): void {
  document.body.innerHTML = `
    <div id="charSelectScreen"></div>
    <div id="modeSelect"></div>
    <div id="charSelectPanel" class="hidden"></div>
    <div id="selectLabel"></div>
    <div id="charGrid"></div>
    <button id="btnFight" class="hidden"></button>
    <div id="p1Portrait">P1</div>
    <div id="p2Portrait">P2</div>
    <div id="p1Name">---</div>
    <div id="p2Name">---</div>
    <button id="btnPvP"></button>
    <button id="btnPvCPU"></button>
    <button id="btnStory"></button>
    <div id="p1CharInfo"></div>
    <div id="p2CharInfo"></div>
    <button class="diff-btn selected" data-diff="easy"></button>
    <button class="diff-btn" data-diff="normal"></button>
    <button class="diff-btn" data-diff="hard"></button>
  `;
}

describe('CharacterSelect', () => {
  let cs: CharacterSelect;

  beforeEach(() => {
    setupDOM();
    cs = new CharacterSelect();
    cs.init(false);
  });

  // ---- init ----
  describe('init', () => {
    it('sets up DOM refs and initial state', () => {
      expect(cs.selectingFor).toBe(1);
      expect(cs.p1Char).toBeNull();
      expect(cs.p2Char).toBeNull();
      expect(cs.gameMode).toBe('');
    });
  });

  // ---- callbacks ----
  describe('onFight / onStory', () => {
    it('registers onFight callback', () => {
      const cb = vi.fn();
      cs.onFight(cb);
      // Set both chars so the fight button handler will fire
      cs.p1Char = CHARACTER_ROSTER[0] as any;
      cs.p2Char = CHARACTER_ROSTER[1] as any;
      document.getElementById('btnFight')!.click();
      expect(cb).toHaveBeenCalledOnce();
    });

    it('registers onStory callback', () => {
      const cb = vi.fn();
      cs.onStory(cb);
      document.getElementById('btnStory')!.click();
      expect(cb).toHaveBeenCalledOnce();
    });
  });

  // ---- PvP button ----
  describe('PvP button', () => {
    it('sets gameMode to pvp, hides modeSelect, shows charSelectPanel', () => {
      document.getElementById('btnPvP')!.click();

      expect(cs.gameMode).toBe('pvp');
      expect(document.getElementById('modeSelect')!.classList.contains('hidden')).toBe(true);
      expect(document.getElementById('charSelectPanel')!.classList.contains('hidden')).toBe(false);
    });

    it('does nothing on mobile', () => {
      setupDOM();
      const mobileSel = new CharacterSelect();
      mobileSel.init(true);
      document.getElementById('btnPvP')!.click();

      expect(mobileSel.gameMode).toBe('');
      expect(document.getElementById('modeSelect')!.classList.contains('hidden')).toBe(false);
    });
  });

  // ---- PvCPU button ----
  describe('PvCPU button', () => {
    it('sets gameMode to pvcpu and shows charSelectPanel', () => {
      document.getElementById('btnPvCPU')!.click();

      expect(cs.gameMode).toBe('pvcpu');
      expect(document.getElementById('modeSelect')!.classList.contains('hidden')).toBe(true);
      expect(document.getElementById('charSelectPanel')!.classList.contains('hidden')).toBe(false);
    });
  });

  // ---- Story button ----
  describe('Story button', () => {
    it('sets gameMode to story, hides charSelectScreen, calls onStory callback', () => {
      const storyCb = vi.fn();
      cs.onStory(storyCb);
      document.getElementById('btnStory')!.click();

      expect(cs.gameMode).toBe('story');
      expect(document.getElementById('charSelectScreen')!.classList.contains('hidden')).toBe(true);
      expect(storyCb).toHaveBeenCalledOnce();
    });
  });

  // ---- Fight button ----
  describe('Fight button', () => {
    it('calls onFight when both chars are selected', () => {
      const fightCb = vi.fn();
      cs.onFight(fightCb);
      cs.p1Char = CHARACTER_ROSTER[0] as any;
      cs.p2Char = CHARACTER_ROSTER[1] as any;
      document.getElementById('btnFight')!.click();

      expect(fightCb).toHaveBeenCalledOnce();
    });

    it('does nothing when p1Char is not selected', () => {
      const fightCb = vi.fn();
      cs.onFight(fightCb);
      cs.p2Char = CHARACTER_ROSTER[1] as any;
      document.getElementById('btnFight')!.click();

      expect(fightCb).not.toHaveBeenCalled();
    });

    it('does nothing when p2Char is not selected', () => {
      const fightCb = vi.fn();
      cs.onFight(fightCb);
      cs.p1Char = CHARACTER_ROSTER[0] as any;
      document.getElementById('btnFight')!.click();

      expect(fightCb).not.toHaveBeenCalled();
    });

    it('does nothing when no callback is registered', () => {
      cs.p1Char = CHARACTER_ROSTER[0] as any;
      cs.p2Char = CHARACTER_ROSTER[1] as any;
      // Should not throw
      expect(() => document.getElementById('btnFight')!.click()).not.toThrow();
    });
  });

  // ---- getDifficulty ----
  describe('getDifficulty', () => {
    it('returns "easy" by default', () => {
      expect(cs.getDifficulty()).toBe('easy');
    });

    it('returns selected difficulty when changed', () => {
      const normalBtn = document.querySelectorAll<HTMLElement>('.diff-btn')[1];
      normalBtn.click();
      expect(cs.getDifficulty()).toBe('normal');
    });

    it('returns "hard" when hard button is selected', () => {
      const hardBtn = document.querySelectorAll<HTMLElement>('.diff-btn')[2];
      hardBtn.click();
      expect(cs.getDifficulty()).toBe('hard');
    });
  });

  // ---- buildCharGrid ----
  describe('buildCharGrid', () => {
    beforeEach(() => {
      // Enter PvP mode to populate the grid
      document.getElementById('btnPvP')!.click();
    });

    it('populates the grid with character cells', () => {
      const cells = document.querySelectorAll('.char-cell');
      expect(cells.length).toBe(CHARACTER_ROSTER.length);
    });

    it('shows faction labels', () => {
      const factionLabels = document.querySelectorAll('.faction-label');
      const expectedFactions = Object.keys(FACTION_DATA);
      expect(factionLabels.length).toBe(expectedFactions.length);
      factionLabels.forEach((label) => {
        expect(expectedFactions).toContain(label.textContent);
      });
    });

    it('applies faction color to labels', () => {
      const factionLabels = document.querySelectorAll<HTMLElement>('.faction-label');
      factionLabels.forEach((label) => {
        const factionName = label.textContent!;
        const expectedColor = FACTION_DATA[factionName]?.color;
        if (expectedColor) {
          expect(label.style.color).toBeTruthy();
        }
      });
    });

    it('filters characters by faction when filterFaction is provided', () => {
      const faction = '蜀漢';
      cs.buildCharGrid(faction);
      const cells = document.querySelectorAll('.char-cell');
      const expectedCount = CHARACTER_ROSTER.filter((c) => c.faction === faction).length;
      expect(cells.length).toBe(expectedCount);
      expect(expectedCount).toBeGreaterThan(0);
    });

    it('shows only one faction label when filtered', () => {
      cs.buildCharGrid('曹魏');
      const factionLabels = document.querySelectorAll('.faction-label');
      expect(factionLabels.length).toBe(1);
      expect(factionLabels[0].textContent).toBe('曹魏');
    });

    it('clears grid before rebuilding', () => {
      cs.buildCharGrid();
      const firstCount = document.querySelectorAll('.char-cell').length;
      cs.buildCharGrid();
      const secondCount = document.querySelectorAll('.char-cell').length;
      expect(secondCount).toBe(firstCount);
    });

    it('each cell has a data-char-id attribute', () => {
      const cells = document.querySelectorAll<HTMLElement>('.char-cell');
      cells.forEach((cell) => {
        expect(cell.dataset['charId']).toBeDefined();
      });
    });
  });

  // ---- Character selection in PvP ----
  describe('character selection in PvP mode', () => {
    beforeEach(() => {
      document.getElementById('btnPvP')!.click();
    });

    it('first click selects P1 and advances to P2 selection', () => {
      const firstCell = document.querySelector<HTMLElement>('.char-cell')!;
      const charId = firstCell.dataset['charId']!;
      firstCell.click();

      expect(cs.p1Char).not.toBeNull();
      expect(cs.p1Char!.id).toBe(charId);
      expect(cs.selectingFor).toBe(2);
      expect(firstCell.classList.contains('selected-p1')).toBe(true);
    });

    it('updates P1 portrait and name on selection', () => {
      const firstCell = document.querySelector<HTMLElement>('.char-cell')!;
      firstCell.click();

      const p1Portrait = document.getElementById('p1Portrait')!;
      const p1Name = document.getElementById('p1Name')!;
      expect(p1Portrait.textContent).toBe(cs.p1Char!.name);
      expect(p1Name.textContent).toBe(cs.p1Char!.name);
    });

    it('second click selects P2 and shows fight button', () => {
      const cells = document.querySelectorAll<HTMLElement>('.char-cell');
      cells[0].click(); // P1
      cells[1].click(); // P2

      expect(cs.p2Char).not.toBeNull();
      expect(cs.p2Char!.id).toBe(cells[1].dataset['charId']);
      expect(cells[1].classList.contains('selected-p2')).toBe(true);
      expect(document.getElementById('btnFight')!.classList.contains('hidden')).toBe(false);
    });

    it('updates P2 portrait and name on selection', () => {
      const cells = document.querySelectorAll<HTMLElement>('.char-cell');
      cells[0].click();
      cells[1].click();

      const p2Portrait = document.getElementById('p2Portrait')!;
      const p2Name = document.getElementById('p2Name')!;
      expect(p2Portrait.textContent).toBe(cs.p2Char!.name);
      expect(p2Name.textContent).toBe(cs.p2Char!.name);
    });

    it('shows P1 char info after selecting P1', () => {
      const firstCell = document.querySelector<HTMLElement>('.char-cell')!;
      firstCell.click();
      const p1Info = document.getElementById('p1CharInfo')!;
      expect(p1Info.innerHTML).toContain(cs.p1Char!.name);
    });

    it('shows P2 char info after selecting P2', () => {
      const cells = document.querySelectorAll<HTMLElement>('.char-cell');
      cells[0].click();
      cells[1].click();
      const p2Info = document.getElementById('p2CharInfo')!;
      expect(p2Info.innerHTML).toContain(cs.p2Char!.name);
    });
  });

  // ---- Character selection in PvCPU ----
  describe('character selection in PvCPU mode', () => {
    beforeEach(() => {
      document.getElementById('btnPvCPU')!.click();
    });

    it('first click selects P1 and auto-picks a random P2', () => {
      const firstCell = document.querySelector<HTMLElement>('.char-cell')!;
      firstCell.click();

      expect(cs.p1Char).not.toBeNull();
      expect(cs.p2Char).not.toBeNull();
      expect(cs.p2Char!.id).not.toBe(cs.p1Char!.id);
    });

    it('shows the fight button immediately after P1 selection', () => {
      const firstCell = document.querySelector<HTMLElement>('.char-cell')!;
      firstCell.click();

      expect(document.getElementById('btnFight')!.classList.contains('hidden')).toBe(false);
    });

    it('updates P2 portrait and name with auto-picked character', () => {
      const firstCell = document.querySelector<HTMLElement>('.char-cell')!;
      firstCell.click();

      const p2Portrait = document.getElementById('p2Portrait')!;
      const p2Name = document.getElementById('p2Name')!;
      expect(p2Portrait.textContent).toBe(cs.p2Char!.name);
      expect(p2Name.textContent).toBe(cs.p2Char!.name);
    });
  });

  // ---- resetToMenu ----
  describe('resetToMenu', () => {
    it('resets all state to initial values', () => {
      // Set up some state first
      document.getElementById('btnPvP')!.click();
      const cells = document.querySelectorAll<HTMLElement>('.char-cell');
      cells[0].click();
      cells[1].click();

      cs.resetToMenu();

      expect(cs.p1Char).toBeNull();
      expect(cs.p2Char).toBeNull();
      expect(cs.selectingFor).toBe(1);
      expect(document.getElementById('charSelectScreen')!.classList.contains('hidden')).toBe(false);
      expect(document.getElementById('modeSelect')!.classList.contains('hidden')).toBe(false);
      expect(document.getElementById('charSelectPanel')!.classList.contains('hidden')).toBe(true);
      expect(document.getElementById('btnFight')!.classList.contains('hidden')).toBe(true);
      expect(document.getElementById('p1Portrait')!.textContent).toBe('P1');
      expect(document.getElementById('p2Portrait')!.textContent).toBe('P2');
      expect(document.getElementById('p1Name')!.textContent).toBe('---');
      expect(document.getElementById('p2Name')!.textContent).toBe('---');
      expect(document.getElementById('p1CharInfo')!.innerHTML).toBe('');
      expect(document.getElementById('p2CharInfo')!.innerHTML).toBe('');
    });
  });

  // ---- hideCharSelect ----
  describe('hideCharSelect', () => {
    it('adds hidden class to charSelectScreen', () => {
      cs.hideCharSelect();
      expect(document.getElementById('charSelectScreen')!.classList.contains('hidden')).toBe(true);
    });
  });

  // ---- difficulty buttons ----
  describe('difficulty button click', () => {
    it('changes selected class to clicked button', () => {
      const btns = document.querySelectorAll<HTMLElement>('.diff-btn');
      btns[1].click(); // click "normal"

      expect(btns[0].classList.contains('selected')).toBe(false);
      expect(btns[1].classList.contains('selected')).toBe(true);
      expect(btns[2].classList.contains('selected')).toBe(false);
    });

    it('only one button is selected at a time', () => {
      const btns = document.querySelectorAll<HTMLElement>('.diff-btn');
      btns[2].click(); // click "hard"

      const selectedBtns = document.querySelectorAll('.diff-btn.selected');
      expect(selectedBtns.length).toBe(1);
      expect(selectedBtns[0]).toBe(btns[2]);
    });
  });
});
