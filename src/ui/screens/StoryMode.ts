// ============================================================
// StoryMode.ts — Story mode screens and flow
// ============================================================

import { CANVAS_W, CANVAS_H, FACTION_DATA } from '../../constants';
import { STORY_CAMPAIGNS } from '../../data/stories';
import { CHARACTER_ROSTER, SOLDIER_TYPES } from '../../data/characters';
import type { CharacterData, DialogLine, StoryCampaign } from '../../types';
import type { SelectableCharData } from './CharacterSelect';

export class StoryMode {
  /* ---- State ---- */
  public storyFaction = '';
  public storyChapterIndex = 0;
  public storyBattleIndex = 0;
  public storyPhase = '';
  public storyHeroChar: CharacterData | null = null;
  public storyP1Won = false;

  private storyDialogQueue: DialogLine[] = [];
  private storyDialogIndex = 0;

  /* ---- DOM refs (assigned during init) ---- */
  private storySelectScreen!: HTMLElement;
  private storyMapOverlay!: HTMLElement;
  private storyMapTitle!: HTMLElement;
  private storyMapContent!: HTMLElement;
  private btnStoryMapContinue!: HTMLElement;
  private dialogOverlay!: HTMLElement;
  private dialogPortrait!: HTMLElement;
  private dialogSpeaker!: HTMLElement;
  private dialogText!: HTMLElement;
  private btnDialogNext!: HTMLElement;
  private gameScreen!: HTMLElement;
  private charSelectScreen!: HTMLElement;

  /* ---- Callbacks ---- */
  private _onStartGame: (() => void) | null = null;
  private _onBackToMenu: (() => void) | null = null;
  private _isMobile = false;

  /* ---- Char refs (set before each battle) ---- */
  public p1Char: SelectableCharData | null = null;
  public p2Char: SelectableCharData | null = null;

  /** Canvas context — used by showChapterTitle / showStoryVictory */
  private _ctx: CanvasRenderingContext2D | null = null;

  init(isMobile: boolean, ctx: CanvasRenderingContext2D): void {
    this._isMobile = isMobile;
    this._ctx = ctx;
    this.storySelectScreen = document.getElementById('storySelectScreen')!;
    this.storyMapOverlay = document.getElementById('storyMapOverlay')!;
    this.storyMapTitle = document.getElementById('storyMapTitle')!;
    this.storyMapContent = document.getElementById('storyMapContent')!;
    this.btnStoryMapContinue = document.getElementById('btnStoryMapContinue')!;
    this.dialogOverlay = document.getElementById('dialogOverlay')!;
    this.dialogPortrait = document.getElementById('dialogPortrait')!;
    this.dialogSpeaker = document.getElementById('dialogSpeaker')!;
    this.dialogText = document.getElementById('dialogText')!;
    this.btnDialogNext = document.getElementById('btnDialogNext')!;
    this.gameScreen = document.getElementById('gameScreen')!;
    this.charSelectScreen = document.getElementById('charSelectScreen')!;

    this.initStorySelect();
  }

  onStartGame(cb: () => void): void {
    this._onStartGame = cb;
  }
  onBackToMenu(cb: () => void): void {
    this._onBackToMenu = cb;
  }

  showScreen(): void {
    this.storySelectScreen.classList.remove('hidden');
  }

  hideScreen(): void {
    this.storySelectScreen.classList.add('hidden');
  }

  // ---- Build faction selection cards ----

  private initStorySelect(): void {
    const container = document.getElementById('storyCampaigns');
    if (!container) return;
    container.innerHTML = '';

    Object.keys(STORY_CAMPAIGNS).forEach((faction) => {
      const campaign = STORY_CAMPAIGNS[faction];
      const fData = FACTION_DATA[faction];
      const card = document.createElement('div');
      card.className = 'story-card';
      card.style.borderColor = fData ? fData.color : '#fff';
      card.innerHTML =
        '<h3 style="color:' +
        (fData ? fData.color : '#fff') +
        '">' +
        campaign.title +
        '</h3>' +
        '<p>' +
        campaign.description +
        '</p>' +
        '<button class="mode-btn story-start-btn" data-faction="' +
        faction +
        '">開始</button>';
      container.appendChild(card);
    });

    container.querySelectorAll<HTMLElement>('.story-start-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.storyFaction = btn.dataset['faction'] ?? '';
        this.startStoryCampaign(this.storyFaction);
      });
    });
  }

  startStoryCampaign(faction: string): void {
    const campaign = STORY_CAMPAIGNS[faction];
    if (!campaign) return;

    this.storySelectScreen.classList.add('hidden');

    this.storyHeroChar = CHARACTER_ROSTER.find((c) => c.id === campaign.protagonist) ?? null;
    this.p1Char = this.storyHeroChar as SelectableCharData | null;

    this.storyChapterIndex = 0;
    this.storyBattleIndex = 0;
    this.storyPhase = 'dialog_before';

    this.startStoryChapter();
  }

  startStoryChapter(): void {
    const campaign = STORY_CAMPAIGNS[this.storyFaction];
    if (this.storyChapterIndex >= campaign.chapters.length) {
      this.storyPhase = 'victory';
      this.showStoryVictory();
      return;
    }

    const chapter = campaign.chapters[this.storyChapterIndex];
    this.storyBattleIndex = 0;

    this.showStoryMap(campaign, this.storyChapterIndex, () => {
      if (chapter.dialogsBefore && chapter.dialogsBefore.length > 0) {
        this.storyPhase = 'dialog_before';
        this.showStoryDialogs(chapter.dialogsBefore, () => {
          this.startStoryBattle();
        });
      } else {
        this.startStoryBattle();
      }
    });
  }

  private showStoryMap(
    campaign: StoryCampaign,
    currentChapterIdx: number,
    callback: () => void,
  ): void {
    this.gameScreen.classList.add('hidden');
    this.charSelectScreen.classList.add('hidden');
    this.storySelectScreen.classList.add('hidden');
    this.storyMapOverlay.classList.remove('hidden');

    this.storyMapTitle.textContent = campaign.title + ' — ' + campaign.titleEn;
    this.storyMapContent.innerHTML = '';

    const chapters = campaign.chapters;

    for (let i = 0; i < chapters.length; i++) {
      if (i > 0) {
        const connector = document.createElement('div');
        connector.className = 'story-map-connector' + (i <= currentChapterIdx ? ' completed' : '');
        this.storyMapContent.appendChild(connector);
      }

      const node = document.createElement('div');
      const state =
        i < currentChapterIdx ? 'completed' : i === currentChapterIdx ? 'current' : 'locked';
      node.className = 'story-map-node ' + state;

      const circle = document.createElement('div');
      circle.className = 'story-map-node-circle';
      if (state === 'completed') circle.textContent = '✓';
      else if (state === 'current') circle.textContent = String(i + 1);
      else circle.textContent = '🔒';
      node.appendChild(circle);

      const label = document.createElement('div');
      label.className = 'story-map-node-label';
      label.textContent = chapters[i].title;
      node.appendChild(label);

      this.storyMapContent.appendChild(node);
    }

    const continueHandler = (e: Event) => {
      e.preventDefault();
      this.btnStoryMapContinue.removeEventListener('click', continueHandler);
      this.storyMapOverlay.classList.add('hidden');
      this.showChapterTitle(chapters[currentChapterIdx], callback);
    };
    this.btnStoryMapContinue.addEventListener('click', continueHandler);
  }

  private showChapterTitle(
    chapter: { title: string; titleEn: string },
    callback: () => void,
  ): void {
    this.gameScreen.classList.remove('hidden');
    this.charSelectScreen.classList.add('hidden');
    this.storySelectScreen.classList.add('hidden');

    const ctx = this._ctx;
    if (ctx) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(chapter.title, CANVAS_W / 2, CANVAS_H / 2 - 20);
      ctx.fillStyle = '#c9a84c';
      ctx.font = '18px sans-serif';
      ctx.fillText(chapter.titleEn, CANVAS_W / 2, CANVAS_H / 2 + 20);
    }

    setTimeout(callback, 2000);
  }

  showStoryDialogs(dialogs: DialogLine[], callback: () => void): void {
    this.storyDialogQueue = dialogs;
    this.storyDialogIndex = 0;
    this.dialogOverlay.classList.remove('hidden');
    this.showNextDialog(callback);
  }

  private showNextDialog(callback: () => void): void {
    if (this.storyDialogIndex >= this.storyDialogQueue.length) {
      this.dialogOverlay.classList.add('hidden');
      callback();
      return;
    }

    const dialog = this.storyDialogQueue[this.storyDialogIndex];
    this.dialogSpeaker.textContent = dialog.speaker;
    this.dialogText.textContent = dialog.text;

    const charMatch = CHARACTER_ROSTER.find((c) => c.name === dialog.speaker);
    if (charMatch) {
      this.dialogPortrait.style.background = charMatch.color;
      this.dialogPortrait.textContent = charMatch.name.charAt(0);
    } else {
      this.dialogPortrait.style.background = '#555';
      this.dialogPortrait.textContent = dialog.speaker.charAt(0);
    }

    const nextHandler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      this.btnDialogNext.removeEventListener('click', nextHandler);
      this.btnDialogNext.removeEventListener('touchend', nextHandler);
      this.dialogOverlay.removeEventListener('click', nextHandler);
      this.dialogOverlay.removeEventListener('touchend', nextHandler);
      this.storyDialogIndex++;
      this.showNextDialog(callback);
    };
    this.btnDialogNext.addEventListener('click', nextHandler);
    this.btnDialogNext.addEventListener('touchend', nextHandler);
    if (this._isMobile) {
      this.dialogOverlay.addEventListener('click', nextHandler);
      this.dialogOverlay.addEventListener('touchend', nextHandler);
    }
  }

  startStoryBattle(): void {
    const campaign = STORY_CAMPAIGNS[this.storyFaction];
    const chapter = campaign.chapters[this.storyChapterIndex];

    if (this.storyBattleIndex >= chapter.battles.length) {
      if (chapter.dialogsAfter && chapter.dialogsAfter.length > 0) {
        this.showStoryDialogs(chapter.dialogsAfter, () => {
          this.storyChapterIndex++;
          this.startStoryChapter();
        });
      } else {
        this.storyChapterIndex++;
        this.startStoryChapter();
      }
      return;
    }

    const battle = chapter.battles[this.storyBattleIndex];

    const startFight = () => {
      if (battle.opponentType === 'soldier') {
        const soldierType = SOLDIER_TYPES.find((s) => s.id === battle.opponent);
        if (soldierType) {
          this.p2Char = {
            id: soldierType.id,
            name: soldierType.name,
            nameEn: soldierType.nameEn,
            faction: '小兵' as never,
            color: soldierType.color,
            weapon: soldierType.weapon,
            stats: soldierType.stats,
            moves: soldierType.specialMoves ?? [],
            ultimate: soldierType.ultimate ?? {
              name: '',
              nameEn: '',
              type: 'rush' as never,
              damage: 0,
              energyCost: 999,
              description: '',
            },
            isSoldier: true,
            soldierType,
          };
        }
      } else {
        const found = CHARACTER_ROSTER.find((c) => c.id === battle.opponent);
        if (found) this.p2Char = found as SelectableCharData;
      }

      this.storyPhase = 'battle';
      if (this._onStartGame) this._onStartGame();
    };

    if (battle.dialogBefore && battle.dialogBefore.length > 0) {
      this.showStoryDialogs(battle.dialogBefore, startFight);
    } else {
      startFight();
    }
  }

  storyNextStep(): void {
    const campaign = STORY_CAMPAIGNS[this.storyFaction];
    const chapter = campaign.chapters[this.storyChapterIndex];
    const battle = chapter.battles[this.storyBattleIndex];

    if (battle && battle.dialogAfter && battle.dialogAfter.length > 0) {
      this.showStoryDialogs(battle.dialogAfter, () => {
        this.storyBattleIndex++;
        this.startStoryBattle();
      });
    } else {
      this.storyBattleIndex++;
      this.startStoryBattle();
    }
  }

  private showStoryVictory(): void {
    this.gameScreen.classList.remove('hidden');
    const ctx = this._ctx;
    if (ctx) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      const campaign = STORY_CAMPAIGNS[this.storyFaction];
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('通關！', CANVAS_W / 2, CANVAS_H / 2 - 40);
      ctx.font = '28px sans-serif';
      ctx.fillText(campaign.title + ' 完結', CANVAS_W / 2, CANVAS_H / 2 + 20);
      ctx.fillStyle = '#c9a84c';
      ctx.font = '18px sans-serif';
      ctx.fillText('恭喜通關！按任意鍵返回主選單', CANVAS_W / 2, CANVAS_H / 2 + 60);
    }

    const returnHandler = () => {
      window.removeEventListener('keydown', returnHandler);
      if (this._onBackToMenu) this._onBackToMenu();
    };
    window.addEventListener('keydown', returnHandler);
  }

  hideAllOverlays(): void {
    this.storyMapOverlay.classList.add('hidden');
    this.dialogOverlay.classList.add('hidden');
    this.storySelectScreen.classList.add('hidden');
  }
}
