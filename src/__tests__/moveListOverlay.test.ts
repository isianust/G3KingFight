import { describe, it, expect, beforeEach } from 'vitest';
import { MoveListOverlay } from '../ui/screens/MoveListOverlay';
import { CHARACTER_ROSTER, SOLDIER_TYPES } from '../data/characters';
import { STORY_CAMPAIGNS } from '../data/stories';
import { STAGE_NAMES } from '../constants';

function setupDOM(): void {
  document.body.innerHTML = `
    <div id="moveListOverlay" class="hidden"></div>
    <div id="moveListContent"></div>
    <div id="stageListOverlay" class="hidden"></div>
    <div id="stageListContent"></div>
    <div id="imageListOverlay" class="hidden"></div>
    <div id="imageListContent"></div>
    <button id="btnMoveList"></button>
    <button id="btnCloseMoveList"></button>
    <button id="btnStageList"></button>
    <button id="btnCloseStageList"></button>
    <button id="btnImageList"></button>
    <button id="btnCloseImageList"></button>
  `;
}

describe('MoveListOverlay', () => {
  let overlay: MoveListOverlay;

  beforeEach(() => {
    setupDOM();
    overlay = new MoveListOverlay();
    overlay.init();
  });

  // ── init & default state ──────────────────────────────────

  describe('init()', () => {
    it('binds DOM elements so overlays are available', () => {
      // After init, clicking the open buttons should not throw
      expect(() => {
        document.getElementById('btnMoveList')!.click();
      }).not.toThrow();
    });

    it('selectedStage defaults to -1 (random)', () => {
      expect(overlay.selectedStage).toBe(-1);
    });
  });

  // ── Move List ─────────────────────────────────────────────

  describe('Move List', () => {
    beforeEach(() => {
      document.getElementById('btnMoveList')!.click();
    });

    it('opens overlay (removes "hidden")', () => {
      const el = document.getElementById('moveListOverlay')!;
      expect(el.classList.contains('hidden')).toBe(false);
    });

    it('close button hides overlay (adds "hidden")', () => {
      document.getElementById('btnCloseMoveList')!.click();
      const el = document.getElementById('moveListOverlay')!;
      expect(el.classList.contains('hidden')).toBe(true);
    });

    it('has a section for every character in CHARACTER_ROSTER', () => {
      const sections = document.querySelectorAll('#moveListContent .movelist-character');
      expect(sections.length).toBe(CHARACTER_ROSTER.length);
    });

    it('displays each character name', () => {
      const content = document.getElementById('moveListContent')!;
      CHARACTER_ROSTER.forEach((c) => {
        expect(content.innerHTML).toContain(c.name);
      });
    });

    it('displays each character English name', () => {
      const content = document.getElementById('moveListContent')!;
      CHARACTER_ROSTER.forEach((c) => {
        expect(content.innerHTML).toContain(c.nameEn);
      });
    });

    it('displays character stats (atk, def, spd)', () => {
      const content = document.getElementById('moveListContent')!;
      CHARACTER_ROSTER.forEach((c) => {
        expect(content.innerHTML).toContain(`攻:${c.stats.atk}`);
        expect(content.innerHTML).toContain(`防:${c.stats.def}`);
        expect(content.innerHTML).toContain(`速:${c.stats.spd}`);
      });
    });

    it('renders a moves table for each character', () => {
      const tables = document.querySelectorAll('#moveListContent .movelist-table');
      expect(tables.length).toBe(CHARACTER_ROSTER.length);
    });

    it('shows special move names in the table', () => {
      const content = document.getElementById('moveListContent')!;
      CHARACTER_ROSTER.forEach((c) => {
        c.moves?.forEach((m) => {
          expect(content.innerHTML).toContain(m.name);
        });
      });
    });

    it('shows move damage and energy cost', () => {
      const content = document.getElementById('moveListContent')!;
      const firstChar = CHARACTER_ROSTER[0];
      firstChar.moves?.forEach((m) => {
        expect(content.innerHTML).toContain(`${m.damage}`);
        expect(content.innerHTML).toContain(`${m.energyCost}`);
      });
    });

    it('shows ultimate moves with ★ prefix', () => {
      const content = document.getElementById('moveListContent')!;
      CHARACTER_ROSTER.forEach((c) => {
        if (c.ultimate) {
          expect(content.innerHTML).toContain(`★ ${c.ultimate.name}`);
        }
      });
    });

    it('shows ultimate-row class for ultimate moves', () => {
      const ultimateRows = document.querySelectorAll('#moveListContent .ultimate-row');
      const charsWithUltimate = CHARACTER_ROSTER.filter((c) => c.ultimate);
      expect(ultimateRows.length).toBe(charsWithUltimate.length);
    });

    it('clears previous content when reopened', () => {
      document.getElementById('btnMoveList')!.click();
      const sections = document.querySelectorAll('#moveListContent .movelist-character');
      expect(sections.length).toBe(CHARACTER_ROSTER.length);
    });
  });

  // ── Stage List ────────────────────────────────────────────

  describe('Stage List', () => {
    beforeEach(() => {
      document.getElementById('btnStageList')!.click();
    });

    it('opens overlay (removes "hidden")', () => {
      const el = document.getElementById('stageListOverlay')!;
      expect(el.classList.contains('hidden')).toBe(false);
    });

    it('close button hides overlay (adds "hidden")', () => {
      document.getElementById('btnCloseStageList')!.click();
      const el = document.getElementById('stageListOverlay')!;
      expect(el.classList.contains('hidden')).toBe(true);
    });

    it('has a random card plus one card per stage', () => {
      const cards = document.querySelectorAll('#stageListContent .stage-card');
      expect(cards.length).toBe(1 + STAGE_NAMES.length); // random + 6 stages
    });

    it('random card is selected by default', () => {
      const cards = document.querySelectorAll('#stageListContent .stage-card');
      expect(cards[0].classList.contains('selected-stage')).toBe(true);
    });

    it('random card displays "隨機" and "Random"', () => {
      const cards = document.querySelectorAll('#stageListContent .stage-card');
      expect(cards[0].innerHTML).toContain('隨機');
      expect(cards[0].innerHTML).toContain('Random');
    });

    it('stage cards display stage names', () => {
      const content = document.getElementById('stageListContent')!;
      STAGE_NAMES.forEach((stage) => {
        expect(content.innerHTML).toContain(stage.name);
        expect(content.innerHTML).toContain(stage.nameEn);
      });
    });

    it('clicking a stage card updates selectedStage', () => {
      const cards = document.querySelectorAll('#stageListContent .stage-card');
      // Click the second card (index 0 stage)
      (cards[1] as HTMLElement).click();
      expect(overlay.selectedStage).toBe(0);
    });

    it('clicking a stage card marks it as selected', () => {
      const cards = document.querySelectorAll('#stageListContent .stage-card');
      (cards[2] as HTMLElement).click();
      // After click, showStageList re-renders; re-query
      const updatedCards = document.querySelectorAll('#stageListContent .stage-card');
      expect(updatedCards[2].classList.contains('selected-stage')).toBe(true);
      expect(updatedCards[0].classList.contains('selected-stage')).toBe(false);
    });

    it('clicking random card resets selectedStage to -1', () => {
      // First select a stage
      const cards = document.querySelectorAll('#stageListContent .stage-card');
      (cards[3] as HTMLElement).click();
      expect(overlay.selectedStage).toBe(2);

      // Now click random
      const updatedCards = document.querySelectorAll('#stageListContent .stage-card');
      (updatedCards[0] as HTMLElement).click();
      expect(overlay.selectedStage).toBe(-1);
    });

    it('shows story campaigns section', () => {
      const content = document.getElementById('stageListContent')!;
      expect(content.innerHTML).toContain('故事模式關卡');
      expect(content.innerHTML).toContain('Story Campaign Stages');
    });

    it('shows all faction campaigns', () => {
      const content = document.getElementById('stageListContent')!;
      const factions = Object.keys(STORY_CAMPAIGNS);
      factions.forEach((factionName) => {
        const campaign = STORY_CAMPAIGNS[factionName];
        expect(content.innerHTML).toContain(campaign.title);
        expect(content.innerHTML).toContain(campaign.titleEn);
      });
    });

    it('shows campaign chapter titles', () => {
      const content = document.getElementById('stageListContent')!;
      const factions = Object.keys(STORY_CAMPAIGNS);
      for (const factionName of factions) {
        const campaign = STORY_CAMPAIGNS[factionName];
        campaign.chapters.forEach((chapter) => {
          expect(content.innerHTML).toContain(chapter.title);
          expect(content.innerHTML).toContain(chapter.titleEn);
        });
      }
    });

    it('shows battle entries within chapters', () => {
      const battleDivs = document.querySelectorAll('#stageListContent .stagelist-battle');
      expect(battleDivs.length).toBeGreaterThan(0);
    });

    it('shows stage descriptions', () => {
      const content = document.getElementById('stageListContent')!;
      STAGE_NAMES.forEach((stage) => {
        if (stage.desc) {
          expect(content.innerHTML).toContain(stage.desc);
        }
      });
    });
  });

  // ── Image List ────────────────────────────────────────────

  describe('Image List', () => {
    beforeEach(() => {
      document.getElementById('btnImageList')!.click();
    });

    it('opens overlay (removes "hidden")', () => {
      const el = document.getElementById('imageListOverlay')!;
      expect(el.classList.contains('hidden')).toBe(false);
    });

    it('close button hides overlay (adds "hidden")', () => {
      document.getElementById('btnCloseImageList')!.click();
      const el = document.getElementById('imageListOverlay')!;
      expect(el.classList.contains('hidden')).toBe(true);
    });

    it('has 5 image sections (characters, soldiers, backgrounds, UI, effects)', () => {
      const sections = document.querySelectorAll('#imageListContent .imagelist-section');
      expect(sections.length).toBe(5);
    });

    it('shows character art section', () => {
      const content = document.getElementById('imageListContent')!;
      expect(content.innerHTML).toContain('角色圖');
      expect(content.innerHTML).toContain('Character Art');
    });

    it('shows soldier art section', () => {
      const content = document.getElementById('imageListContent')!;
      expect(content.innerHTML).toContain('小兵圖');
      expect(content.innerHTML).toContain('Soldier Art');
    });

    it('shows background section', () => {
      const content = document.getElementById('imageListContent')!;
      expect(content.innerHTML).toContain('背景圖');
      expect(content.innerHTML).toContain('Stage Backgrounds');
    });

    it('shows UI assets section', () => {
      const content = document.getElementById('imageListContent')!;
      expect(content.innerHTML).toContain('介面圖');
      expect(content.innerHTML).toContain('UI Assets');
    });

    it('shows effects section', () => {
      const content = document.getElementById('imageListContent')!;
      expect(content.innerHTML).toContain('特效圖');
      expect(content.innerHTML).toContain('Effect Assets');
    });

    it('has image tables with correct headers', () => {
      const tables = document.querySelectorAll('#imageListContent .imagelist-table');
      expect(tables.length).toBe(5);
      tables.forEach((table) => {
        expect(table.innerHTML).toContain('名稱');
        expect(table.innerHTML).toContain('尺寸');
        expect(table.innerHTML).toContain('格式');
        expect(table.innerHTML).toContain('說明');
        expect(table.innerHTML).toContain('現狀');
      });
    });

    it('character section has 3 items per character (sprite, portrait, dialog)', () => {
      const sections = document.querySelectorAll('#imageListContent .imagelist-section');
      const charTable = sections[0].querySelector('tbody')!;
      const rows = charTable.querySelectorAll('tr');
      expect(rows.length).toBe(CHARACTER_ROSTER.length * 3);
    });

    it('soldier section has one item per soldier type', () => {
      const sections = document.querySelectorAll('#imageListContent .imagelist-section');
      const soldierTable = sections[1].querySelector('tbody')!;
      const rows = soldierTable.querySelectorAll('tr');
      expect(rows.length).toBe(SOLDIER_TYPES.length);
    });

    it('background section has one item per stage', () => {
      const sections = document.querySelectorAll('#imageListContent .imagelist-section');
      const bgTable = sections[2].querySelector('tbody')!;
      const rows = bgTable.querySelectorAll('tr');
      expect(rows.length).toBe(STAGE_NAMES.length);
    });

    it('UI section has 6 items', () => {
      const sections = document.querySelectorAll('#imageListContent .imagelist-section');
      const uiTable = sections[3].querySelector('tbody')!;
      const rows = uiTable.querySelectorAll('tr');
      expect(rows.length).toBe(6);
    });

    it('effects section has 3 items', () => {
      const sections = document.querySelectorAll('#imageListContent .imagelist-section');
      const fxTable = sections[4].querySelector('tbody')!;
      const rows = fxTable.querySelectorAll('tr');
      expect(rows.length).toBe(3);
    });

    it('shows total count summary at the bottom', () => {
      const summary = document.querySelector('#imageListContent .imagelist-summary')!;
      expect(summary).not.toBeNull();

      const expectedTotal =
        CHARACTER_ROSTER.length * 3 + SOLDIER_TYPES.length + STAGE_NAMES.length + 6 + 3;
      expect(summary.textContent).toContain(`${expectedTotal}`);
      expect(summary.textContent).toContain('總計需要');
    });

    it('clears previous content when reopened', () => {
      document.getElementById('btnImageList')!.click();
      const sections = document.querySelectorAll('#imageListContent .imagelist-section');
      expect(sections.length).toBe(5);
    });
  });
});
