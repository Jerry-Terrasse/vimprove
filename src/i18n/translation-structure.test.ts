import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';
import { LESSONS } from '@/data';

const LOCALES = ['zh', 'zh-lively'] as const;

type Locale = (typeof LOCALES)[number];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readLocaleLessons = (locale: Locale) => {
  const filePath = path.join(__dirname, 'locales', locale, 'lessons.json');
  const json = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(json) as {
    lessons: Record<
      string,
      {
        title?: unknown;
        shortDescription?: unknown;
        content?: Record<string, unknown>;
        [key: string]: unknown;
      }
    >;
  };
};

const expectedTypeForBlock = (blockType: string): 'string' | 'object' => {
  if (blockType === 'markdown') return 'string';
  // key-list, run-example, challenge 都是对象
  return 'object';
};

describe('i18n lesson translations structure', () => {
  LOCALES.forEach(locale => {
    const localeData = readLocaleLessons(locale);

    it(`locale ${locale} should include translations for every lesson`, () => {
      LESSONS.forEach(lesson => {
        const entry = localeData.lessons[lesson.slug];
        expect(entry, `Missing lesson translation for ${lesson.slug}`).toBeDefined();
        expect(typeof entry.title, `title of ${lesson.slug} should be string`).toBe('string');
        expect(
          typeof entry.shortDescription,
          `shortDescription of ${lesson.slug} should be string`
        ).toBe('string');

        // 防止顶层出现 content.x 残留
        const badKeys = Object.keys(entry).filter(key => key.startsWith('content.'));
        expect(badKeys, `Do not use top-level content.n keys in ${lesson.slug}`).toHaveLength(0);

        expect(entry.content, `content of ${lesson.slug} should exist`).toBeDefined();
        expect(typeof entry.content, `content of ${lesson.slug} should be object`).toBe('object');

        const content = entry.content as Record<string, unknown>;
        lesson.contentBlocks.forEach((block, idx) => {
          const key = String(idx);
          const val = content[key];
          expect(val, `content[${key}] missing for ${lesson.slug}`).toBeDefined();

          const expected = expectedTypeForBlock(block.type);
          expect(
            typeof val,
            `content[${key}] in ${lesson.slug} should be ${expected}, got ${typeof val}`
          ).toBe(expected);
        });
      });
    });
  });
});
