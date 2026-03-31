import { describe, it, expect } from 'vitest';
import { STORY_CAMPAIGNS } from '../data/stories';

const CAMPAIGN_KEYS = ['蜀漢', '曹魏', '孫吳'];

describe('STORY_CAMPAIGNS', () => {
  it('has exactly 3 campaigns', () => {
    expect(Object.keys(STORY_CAMPAIGNS)).toHaveLength(3);
  });

  it('has all expected campaign keys', () => {
    for (const key of CAMPAIGN_KEYS) {
      expect(STORY_CAMPAIGNS).toHaveProperty(key);
    }
  });

  for (const key of CAMPAIGN_KEYS) {
    describe(`Campaign: ${key}`, () => {
      it('has title and titleEn', () => {
        const campaign = STORY_CAMPAIGNS[key];
        expect(campaign.title).toBeTruthy();
        expect(campaign.titleEn).toBeTruthy();
      });

      it('has a description', () => {
        expect(STORY_CAMPAIGNS[key].description).toBeTruthy();
      });

      it('has a protagonist', () => {
        expect(STORY_CAMPAIGNS[key].protagonist).toBeTruthy();
      });

      it('has availableHeroes array with at least one hero', () => {
        const heroes = STORY_CAMPAIGNS[key].availableHeroes;
        expect(Array.isArray(heroes)).toBe(true);
        expect(heroes.length).toBeGreaterThanOrEqual(1);
      });

      it('has exactly 5 chapters', () => {
        expect(STORY_CAMPAIGNS[key].chapters).toHaveLength(5);
      });

      it('each chapter has required fields', () => {
        for (const chapter of STORY_CAMPAIGNS[key].chapters) {
          expect(chapter.id).toBeTruthy();
          expect(chapter.title).toBeTruthy();
          expect(chapter.titleEn).toBeTruthy();
          expect(Array.isArray(chapter.dialogsBefore)).toBe(true);
          expect(Array.isArray(chapter.battles)).toBe(true);
          expect(Array.isArray(chapter.dialogsAfter)).toBe(true);
        }
      });

      it('chapters have unique IDs', () => {
        const ids = STORY_CAMPAIGNS[key].chapters.map((c) => c.id);
        expect(new Set(ids).size).toBe(ids.length);
      });

      it('each chapter has at least one battle', () => {
        for (const chapter of STORY_CAMPAIGNS[key].chapters) {
          expect(chapter.battles.length).toBeGreaterThanOrEqual(1);
        }
      });

      it('each battle has opponent and opponentType', () => {
        for (const chapter of STORY_CAMPAIGNS[key].chapters) {
          for (const battle of chapter.battles) {
            expect(battle.opponent).toBeTruthy();
            expect(['character', 'soldier']).toContain(battle.opponentType);
          }
        }
      });

      it('dialogs have speaker and text', () => {
        for (const chapter of STORY_CAMPAIGNS[key].chapters) {
          for (const dialog of chapter.dialogsBefore) {
            expect(dialog.speaker).toBeTruthy();
            expect(dialog.text).toBeTruthy();
          }
          for (const dialog of chapter.dialogsAfter) {
            expect(dialog.speaker).toBeTruthy();
            expect(dialog.text).toBeTruthy();
          }
        }
      });
    });
  }
});
