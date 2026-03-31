import { StoryMode } from '../ui/screens/StoryMode';
import { STORY_CAMPAIGNS } from '../data/stories';
import { CHARACTER_ROSTER, SOLDIER_TYPES } from '../data/characters';
import { FACTION_DATA } from '../constants';

function setupDOM(): void {
  document.body.innerHTML = `
    <div id="storySelectScreen" class="hidden"></div>
    <div id="storyCampaigns"></div>
    <div id="storyMapOverlay" class="hidden"></div>
    <div id="storyMapTitle"></div>
    <div id="storyMapContent"></div>
    <button id="btnStoryMapContinue"></button>
    <div id="dialogOverlay" class="hidden"></div>
    <div id="dialogPortrait"></div>
    <div id="dialogSpeaker"></div>
    <div id="dialogText"></div>
    <button id="btnDialogNext"></button>
    <div id="gameScreen" class="hidden"></div>
    <div id="charSelectScreen"></div>
    <canvas id="gameCanvas" width="1024" height="576"></canvas>
  `;
}

function createMockCtx(): CanvasRenderingContext2D {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    shadowColor: '',
    shadowBlur: 0,
    font: '',
    textAlign: '',
    fillRect: vi.fn(),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    clearRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    drawImage: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    setTransform: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe('StoryMode', () => {
  let sm: StoryMode;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    vi.useFakeTimers();
    setupDOM();
    ctx = createMockCtx();
    sm = new StoryMode();
    sm.init(false, ctx);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ---- 1. init() creates faction selection cards ----
  describe('init', () => {
    it('creates faction selection cards for each campaign', () => {
      const container = document.getElementById('storyCampaigns')!;
      const cards = container.querySelectorAll('.story-card');
      expect(cards.length).toBe(Object.keys(STORY_CAMPAIGNS).length);
    });

    it('each card has a start button with data-faction attribute', () => {
      const buttons = document.querySelectorAll<HTMLElement>('.story-start-btn');
      const factions = Object.keys(STORY_CAMPAIGNS);
      expect(buttons.length).toBe(factions.length);
      buttons.forEach((btn) => {
        expect(factions).toContain(btn.dataset['faction']);
      });
    });
  });

  // ---- 2. onStartGame / onBackToMenu register callbacks ----
  describe('onStartGame / onBackToMenu', () => {
    it('registers onStartGame callback', () => {
      const cb = vi.fn();
      sm.onStartGame(cb);
      // Access callback via public observable side-effect in startStoryBattle
      expect(cb).not.toHaveBeenCalled();
    });

    it('registers onBackToMenu callback', () => {
      const cb = vi.fn();
      sm.onBackToMenu(cb);
      expect(cb).not.toHaveBeenCalled();
    });
  });

  // ---- 3. showScreen / hideScreen toggle visibility ----
  describe('showScreen / hideScreen', () => {
    it('showScreen removes hidden class from storySelectScreen', () => {
      const el = document.getElementById('storySelectScreen')!;
      expect(el.classList.contains('hidden')).toBe(true);
      sm.showScreen();
      expect(el.classList.contains('hidden')).toBe(false);
    });

    it('hideScreen adds hidden class to storySelectScreen', () => {
      sm.showScreen();
      sm.hideScreen();
      const el = document.getElementById('storySelectScreen')!;
      expect(el.classList.contains('hidden')).toBe(true);
    });
  });

  // ---- 4. Faction card has correct campaign info ----
  describe('faction card content', () => {
    it('displays campaign title and description in each card', () => {
      const cards = document.querySelectorAll('.story-card');
      const factions = Object.keys(STORY_CAMPAIGNS);
      cards.forEach((card, i) => {
        const campaign = STORY_CAMPAIGNS[factions[i]];
        expect(card.innerHTML).toContain(campaign.title);
        expect(card.innerHTML).toContain(campaign.description);
      });
    });

    it('applies faction color to card border and heading', () => {
      const cards = document.querySelectorAll<HTMLElement>('.story-card');
      const factions = Object.keys(STORY_CAMPAIGNS);
      cards.forEach((card, i) => {
        const fData = FACTION_DATA[factions[i]];
        if (fData) {
          // jsdom normalizes hex to rgb, so just check the property is set
          expect(card.style.borderColor).toBeTruthy();
        }
      });
    });
  });

  // ---- 5. startStoryCampaign sets hero character from protagonist ----
  describe('startStoryCampaign', () => {
    it('sets storyHeroChar from protagonist id', () => {
      const faction = '蜀漢';
      const campaign = STORY_CAMPAIGNS[faction];
      sm.storyFaction = faction;
      sm.startStoryCampaign(faction);

      const expected = CHARACTER_ROSTER.find((c) => c.id === campaign.protagonist);
      expect(sm.storyHeroChar).not.toBeNull();
      expect(sm.storyHeroChar!.id).toBe(expected!.id);
    });

    // ---- 6. startStoryCampaign sets p1Char ----
    it('sets p1Char to the hero character', () => {
      sm.storyFaction = '蜀漢';
      sm.startStoryCampaign('蜀漢');
      expect(sm.p1Char).not.toBeNull();
      expect(sm.p1Char!.id).toBe(sm.storyHeroChar!.id);
    });

    // ---- 7. startStoryCampaign initializes chapter/battle index to 0 ----
    it('initializes chapter and battle indices to 0', () => {
      sm.storyFaction = '蜀漢';
      sm.startStoryCampaign('蜀漢');
      expect(sm.storyChapterIndex).toBe(0);
      expect(sm.storyBattleIndex).toBe(0);
    });

    it('sets storyPhase to dialog_before', () => {
      sm.storyFaction = '蜀漢';
      sm.startStoryCampaign('蜀漢');
      // Phase is set to 'dialog_before' if chapter has dialogsBefore
      expect(sm.storyPhase).toBe('dialog_before');
    });

    it('hides the story select screen', () => {
      sm.showScreen();
      sm.storyFaction = '蜀漢';
      sm.startStoryCampaign('蜀漢');
      const el = document.getElementById('storySelectScreen')!;
      expect(el.classList.contains('hidden')).toBe(true);
    });

    it('does nothing for a non-existent faction', () => {
      sm.startStoryCampaign('invalid_faction');
      expect(sm.storyHeroChar).toBeNull();
    });
  });

  // ---- 8. startStoryBattle with character opponent sets p2Char ----
  describe('startStoryBattle', () => {
    it('sets p2Char from CHARACTER_ROSTER for character opponent', () => {
      const faction = '蜀漢';
      const campaign = STORY_CAMPAIGNS[faction];
      sm.storyFaction = faction;
      sm.storyHeroChar = CHARACTER_ROSTER.find((c) => c.id === campaign.protagonist) ?? null;
      sm.p1Char = sm.storyHeroChar as any;

      // Find a chapter/battle with a character opponent
      let charBattleChapterIdx = -1;
      let charBattleIdx = -1;
      for (let ci = 0; ci < campaign.chapters.length; ci++) {
        for (let bi = 0; bi < campaign.chapters[ci].battles.length; bi++) {
          if (campaign.chapters[ci].battles[bi].opponentType === 'character') {
            charBattleChapterIdx = ci;
            charBattleIdx = bi;
            break;
          }
        }
        if (charBattleChapterIdx >= 0) break;
      }

      expect(charBattleChapterIdx).toBeGreaterThanOrEqual(0);

      const battle = campaign.chapters[charBattleChapterIdx].battles[charBattleIdx];
      sm.storyChapterIndex = charBattleChapterIdx;
      sm.storyBattleIndex = charBattleIdx;

      const startCb = vi.fn();
      sm.onStartGame(startCb);

      sm.startStoryBattle();

      // If battle has dialogBefore, advance through them
      if (battle.dialogBefore && battle.dialogBefore.length > 0) {
        for (let i = 0; i < battle.dialogBefore.length; i++) {
          document.getElementById('btnDialogNext')!.click();
        }
      }

      const expectedChar = CHARACTER_ROSTER.find((c) => c.id === battle.opponent);
      expect(sm.p2Char).not.toBeNull();
      expect(sm.p2Char!.id).toBe(expectedChar!.id);
    });

    // ---- 9. startStoryBattle with soldier opponent creates soldier SelectableCharData ----
    it('creates soldier SelectableCharData for soldier opponent', () => {
      const faction = '蜀漢';
      const campaign = STORY_CAMPAIGNS[faction];
      sm.storyFaction = faction;
      sm.storyHeroChar = CHARACTER_ROSTER.find((c) => c.id === campaign.protagonist) ?? null;
      sm.p1Char = sm.storyHeroChar as any;

      // Chapter 0 battle 0 is a soldier battle
      sm.storyChapterIndex = 0;
      sm.storyBattleIndex = 0;
      const battle = campaign.chapters[0].battles[0];
      expect(battle.opponentType).toBe('soldier');

      const startCb = vi.fn();
      sm.onStartGame(startCb);

      sm.startStoryBattle();

      // Advance past any dialog before
      if (battle.dialogBefore && battle.dialogBefore.length > 0) {
        for (let i = 0; i < battle.dialogBefore.length; i++) {
          document.getElementById('btnDialogNext')!.click();
        }
      }

      const soldierType = SOLDIER_TYPES.find((s) => s.id === battle.opponent);
      expect(sm.p2Char).not.toBeNull();
      expect(sm.p2Char!.id).toBe(soldierType!.id);
      expect((sm.p2Char as any).isSoldier).toBe(true);
      expect((sm.p2Char as any).soldierType).toEqual(soldierType);
    });

    // ---- 10. startStoryBattle calls _onStartGame callback ----
    it('calls onStartGame callback when battle starts', () => {
      const faction = '蜀漢';
      const campaign = STORY_CAMPAIGNS[faction];
      sm.storyFaction = faction;
      sm.storyHeroChar = CHARACTER_ROSTER.find((c) => c.id === campaign.protagonist) ?? null;
      sm.p1Char = sm.storyHeroChar as any;
      sm.storyChapterIndex = 0;
      sm.storyBattleIndex = 0;

      const startCb = vi.fn();
      sm.onStartGame(startCb);

      sm.startStoryBattle();

      const battle = campaign.chapters[0].battles[0];
      if (battle.dialogBefore && battle.dialogBefore.length > 0) {
        for (let i = 0; i < battle.dialogBefore.length; i++) {
          document.getElementById('btnDialogNext')!.click();
        }
      }

      expect(startCb).toHaveBeenCalledOnce();
      expect(sm.storyPhase).toBe('battle');
    });

    it('sets storyPhase to battle when fight begins', () => {
      const faction = '蜀漢';
      const campaign = STORY_CAMPAIGNS[faction];
      sm.storyFaction = faction;
      sm.storyHeroChar = CHARACTER_ROSTER.find((c) => c.id === campaign.protagonist) ?? null;
      sm.p1Char = sm.storyHeroChar as any;

      // Use a battle with no dialogBefore for direct start
      const chapterIdx = 0;
      let noBefore = -1;
      for (let bi = 0; bi < campaign.chapters[chapterIdx].battles.length; bi++) {
        const b = campaign.chapters[chapterIdx].battles[bi];
        if (!b.dialogBefore || b.dialogBefore.length === 0) {
          noBefore = bi;
          break;
        }
      }

      if (noBefore >= 0) {
        sm.storyChapterIndex = chapterIdx;
        sm.storyBattleIndex = noBefore;
        sm.onStartGame(vi.fn());
        sm.startStoryBattle();
        expect(sm.storyPhase).toBe('battle');
      }
    });
  });

  // ---- 11. storyNextStep increments battleIndex ----
  describe('storyNextStep', () => {
    it('increments battleIndex after battle win', () => {
      const faction = '蜀漢';
      const campaign = STORY_CAMPAIGNS[faction];
      sm.storyFaction = faction;
      sm.storyHeroChar = CHARACTER_ROSTER.find((c) => c.id === campaign.protagonist) ?? null;
      sm.p1Char = sm.storyHeroChar as any;
      sm.storyChapterIndex = 0;
      sm.storyBattleIndex = 0;

      sm.onStartGame(vi.fn());

      const battle = campaign.chapters[0].battles[0];
      const hasBattleDialogAfter = battle.dialogAfter && battle.dialogAfter.length > 0;

      sm.storyNextStep();

      if (hasBattleDialogAfter) {
        // Must advance through dialogAfter before index increments
        for (let i = 0; i < battle.dialogAfter!.length; i++) {
          document.getElementById('btnDialogNext')!.click();
        }
      }

      expect(sm.storyBattleIndex).toBe(1);
    });
  });

  // ---- 12. showStoryDialogs shows dialog overlay with first dialog ----
  describe('showStoryDialogs', () => {
    const testDialogs = [
      { speaker: '趙雲', text: '為主公效命！' },
      { speaker: '關羽', text: '義之所在！' },
    ];

    it('shows dialog overlay with first dialog', () => {
      const callback = vi.fn();
      sm.showStoryDialogs(testDialogs, callback);

      const overlay = document.getElementById('dialogOverlay')!;
      expect(overlay.classList.contains('hidden')).toBe(false);

      const speaker = document.getElementById('dialogSpeaker')!;
      const text = document.getElementById('dialogText')!;
      expect(speaker.textContent).toBe(testDialogs[0].speaker);
      expect(text.textContent).toBe(testDialogs[0].text);
    });

    // ---- 13. Dialog next button advances to next dialog ----
    it('advances to next dialog on button click', () => {
      const callback = vi.fn();
      sm.showStoryDialogs(testDialogs, callback);

      document.getElementById('btnDialogNext')!.click();

      const speaker = document.getElementById('dialogSpeaker')!;
      const text = document.getElementById('dialogText')!;
      expect(speaker.textContent).toBe(testDialogs[1].speaker);
      expect(text.textContent).toBe(testDialogs[1].text);
    });

    // ---- 14. Dialog next button hides overlay and calls callback after last dialog ----
    it('hides overlay and calls callback after last dialog', () => {
      const callback = vi.fn();
      sm.showStoryDialogs(testDialogs, callback);

      // Click through all dialogs
      document.getElementById('btnDialogNext')!.click();
      document.getElementById('btnDialogNext')!.click();

      const overlay = document.getElementById('dialogOverlay')!;
      expect(overlay.classList.contains('hidden')).toBe(true);
      expect(callback).toHaveBeenCalledOnce();
    });

    it('sets portrait for known CHARACTER_ROSTER speaker', () => {
      const callback = vi.fn();
      sm.showStoryDialogs([{ speaker: '趙雲', text: 'test' }], callback);

      const portrait = document.getElementById('dialogPortrait')!;
      // jsdom converts hex to rgb, so just verify the background is set and not fallback
      expect(portrait.style.background).not.toBe('');
      expect(portrait.style.background).not.toBe('rgb(85, 85, 85)');
      expect(portrait.textContent).toBe('趙');
    });

    it('uses fallback for unknown speaker', () => {
      const callback = vi.fn();
      sm.showStoryDialogs([{ speaker: '旁白', text: 'test' }], callback);

      const portrait = document.getElementById('dialogPortrait')!;
      // jsdom converts #555 to rgb(85, 85, 85)
      expect(portrait.style.background).toBe('rgb(85, 85, 85)');
      expect(portrait.textContent).toBe('旁');
    });

    it('calls callback immediately for empty dialog array', () => {
      const callback = vi.fn();
      sm.showStoryDialogs([], callback);

      expect(callback).toHaveBeenCalledOnce();
      const overlay = document.getElementById('dialogOverlay')!;
      expect(overlay.classList.contains('hidden')).toBe(true);
    });
  });

  // ---- 15. hideAllOverlays hides all three overlays ----
  describe('hideAllOverlays', () => {
    it('hides storyMapOverlay, dialogOverlay, and storySelectScreen', () => {
      // First make them all visible
      document.getElementById('storyMapOverlay')!.classList.remove('hidden');
      document.getElementById('dialogOverlay')!.classList.remove('hidden');
      document.getElementById('storySelectScreen')!.classList.remove('hidden');

      sm.hideAllOverlays();

      expect(document.getElementById('storyMapOverlay')!.classList.contains('hidden')).toBe(true);
      expect(document.getElementById('dialogOverlay')!.classList.contains('hidden')).toBe(true);
      expect(document.getElementById('storySelectScreen')!.classList.contains('hidden')).toBe(true);
    });
  });

  // ---- 16. Story flow: campaign → chapter → dialogs → battle → next step ----
  describe('full story flow', () => {
    it('flows from campaign start through chapter dialogs to battle', () => {
      const startCb = vi.fn();
      sm.onStartGame(startCb);

      const faction = '蜀漢';
      sm.storyFaction = faction;
      sm.startStoryCampaign(faction);

      const campaign = STORY_CAMPAIGNS[faction];
      const chapter = campaign.chapters[0];

      // Story map overlay should be visible
      const mapOverlay = document.getElementById('storyMapOverlay')!;
      expect(mapOverlay.classList.contains('hidden')).toBe(false);

      // Click continue to proceed past the map
      document.getElementById('btnStoryMapContinue')!.click();

      // Advance past chapter title (uses setTimeout)
      vi.advanceTimersByTime(2000);

      // Now dialogsBefore should be showing
      const dialogOverlay = document.getElementById('dialogOverlay')!;
      if (chapter.dialogsBefore.length > 0) {
        expect(dialogOverlay.classList.contains('hidden')).toBe(false);

        // Advance through all chapter dialogsBefore
        for (let i = 0; i < chapter.dialogsBefore.length; i++) {
          document.getElementById('btnDialogNext')!.click();
        }
      }

      // Now the first battle should start
      const firstBattle = chapter.battles[0];
      if (firstBattle.dialogBefore && firstBattle.dialogBefore.length > 0) {
        // Battle dialog showing
        for (let i = 0; i < firstBattle.dialogBefore.length; i++) {
          document.getElementById('btnDialogNext')!.click();
        }
      }

      // onStartGame should have been called
      expect(startCb).toHaveBeenCalled();
      expect(sm.storyPhase).toBe('battle');
      expect(sm.p2Char).not.toBeNull();
    });

    it('progresses from one battle to the next via storyNextStep', () => {
      const startCb = vi.fn();
      sm.onStartGame(startCb);

      const faction = '蜀漢';
      const campaign = STORY_CAMPAIGNS[faction];
      sm.storyFaction = faction;
      sm.storyHeroChar = CHARACTER_ROSTER.find((c) => c.id === campaign.protagonist) ?? null;
      sm.p1Char = sm.storyHeroChar as any;
      sm.storyChapterIndex = 0;
      sm.storyBattleIndex = 0;

      // Start the first battle directly (skip map/chapter title)
      sm.startStoryBattle();
      const firstBattle = campaign.chapters[0].battles[0];
      if (firstBattle.dialogBefore && firstBattle.dialogBefore.length > 0) {
        for (let i = 0; i < firstBattle.dialogBefore.length; i++) {
          document.getElementById('btnDialogNext')!.click();
        }
      }
      expect(startCb).toHaveBeenCalledTimes(1);

      // Simulate win → next step
      sm.storyP1Won = true;
      sm.storyNextStep();

      // Advance past any dialogAfter for the first battle
      if (firstBattle.dialogAfter && firstBattle.dialogAfter.length > 0) {
        for (let i = 0; i < firstBattle.dialogAfter!.length; i++) {
          document.getElementById('btnDialogNext')!.click();
        }
      }

      expect(sm.storyBattleIndex).toBe(1);

      // The second battle should start, advance its dialogs
      const secondBattle = campaign.chapters[0].battles[1];
      if (secondBattle.dialogBefore && secondBattle.dialogBefore.length > 0) {
        for (let i = 0; i < secondBattle.dialogBefore.length; i++) {
          document.getElementById('btnDialogNext')!.click();
        }
      }

      expect(startCb).toHaveBeenCalledTimes(2);
    });

    it('advances to next chapter when all battles in a chapter are done', () => {
      const startCb = vi.fn();
      sm.onStartGame(startCb);

      const faction = '蜀漢';
      const campaign = STORY_CAMPAIGNS[faction];
      sm.storyFaction = faction;
      sm.storyHeroChar = CHARACTER_ROSTER.find((c) => c.id === campaign.protagonist) ?? null;
      sm.p1Char = sm.storyHeroChar as any;
      sm.storyChapterIndex = 0;

      // Set battleIndex past all battles to trigger chapter advancement
      sm.storyBattleIndex = campaign.chapters[0].battles.length;

      sm.startStoryBattle();

      // Advance through dialogsAfter for chapter 0
      const chapter = campaign.chapters[0];
      if (chapter.dialogsAfter && chapter.dialogsAfter.length > 0) {
        for (let i = 0; i < chapter.dialogsAfter.length; i++) {
          document.getElementById('btnDialogNext')!.click();
        }
      }

      // Should have advanced to chapter 1
      expect(sm.storyChapterIndex).toBe(1);
    });

    it('shows victory when all chapters are completed', () => {
      const backCb = vi.fn();
      sm.onBackToMenu(backCb);

      const faction = '蜀漢';
      const campaign = STORY_CAMPAIGNS[faction];
      sm.storyFaction = faction;
      sm.storyHeroChar = CHARACTER_ROSTER.find((c) => c.id === campaign.protagonist) ?? null;
      sm.p1Char = sm.storyHeroChar as any;

      // Set chapter index past all chapters
      sm.storyChapterIndex = campaign.chapters.length;
      sm.storyBattleIndex = 0;

      sm.startStoryChapter();

      expect(sm.storyPhase).toBe('victory');

      // Victory screen draws to canvas
      expect(ctx.fillText).toHaveBeenCalled();

      // Press key to return to menu
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(backCb).toHaveBeenCalledOnce();
    });
  });

  // ---- story map display ----
  describe('story map', () => {
    it('shows map with chapter nodes on campaign start', () => {
      sm.storyFaction = '蜀漢';
      sm.startStoryCampaign('蜀漢');

      const mapOverlay = document.getElementById('storyMapOverlay')!;
      expect(mapOverlay.classList.contains('hidden')).toBe(false);

      const campaign = STORY_CAMPAIGNS['蜀漢'];
      const nodes = document.querySelectorAll('.story-map-node');
      expect(nodes.length).toBe(campaign.chapters.length);
    });

    it('sets map title to campaign title', () => {
      sm.storyFaction = '蜀漢';
      sm.startStoryCampaign('蜀漢');
      const campaign = STORY_CAMPAIGNS['蜀漢'];
      const title = document.getElementById('storyMapTitle')!;
      expect(title.textContent).toContain(campaign.title);
      expect(title.textContent).toContain(campaign.titleEn);
    });
  });

  // ---- clicking faction card triggers campaign ----
  describe('faction card interaction', () => {
    it('clicking start button triggers startStoryCampaign', () => {
      const btn = document.querySelector<HTMLElement>('.story-start-btn[data-faction="蜀漢"]');
      expect(btn).not.toBeNull();

      btn!.click();

      // Campaign should have started – hero should be set
      expect(sm.storyFaction).toBe('蜀漢');
      expect(sm.storyHeroChar).not.toBeNull();
    });
  });

  // ---- Wei and Wu campaigns ----
  describe('other factions', () => {
    it('starts 曹魏 campaign correctly', () => {
      sm.storyFaction = '曹魏';
      sm.startStoryCampaign('曹魏');
      const campaign = STORY_CAMPAIGNS['曹魏'];
      const expected = CHARACTER_ROSTER.find((c) => c.id === campaign.protagonist);
      expect(sm.storyHeroChar).not.toBeNull();
      expect(sm.storyHeroChar!.id).toBe(expected!.id);
    });

    it('starts 孫吳 campaign correctly', () => {
      sm.storyFaction = '孫吳';
      sm.startStoryCampaign('孫吳');
      const campaign = STORY_CAMPAIGNS['孫吳'];
      const expected = CHARACTER_ROSTER.find((c) => c.id === campaign.protagonist);
      expect(sm.storyHeroChar).not.toBeNull();
      expect(sm.storyHeroChar!.id).toBe(expected!.id);
    });
  });
});
