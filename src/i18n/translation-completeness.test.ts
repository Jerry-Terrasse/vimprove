import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';
import { LESSONS } from '@/data';
import { CATEGORIES } from '@/data/categories';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, 'locales');
const enDir = path.join(localesDir, 'en');

const OTHER_LOCALES = ['zh', 'zh-lively'] as const;

type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
type JSONObject = { [key: string]: JSONValue };
type JSONArray = JSONValue[];

const readJson = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8')) as JSONValue;

const getAllNamespaceFiles = (dir: string) =>
  fs.readdirSync(dir).filter(name => name.endsWith('.json'));

const compareStructure = (enVal: JSONValue, otherVal: JSONValue, pathLabel: string) => {
  const enType = Array.isArray(enVal) ? 'array' : typeof enVal;
  const otherType = Array.isArray(otherVal) ? 'array' : typeof otherVal;
  expect(otherType, `${pathLabel} type mismatch`).toBe(enType);

  if (enVal && typeof enVal === 'object' && !Array.isArray(enVal)) {
    const enObj = enVal as JSONObject;
    const otherObj = otherVal as JSONObject;
    Object.keys(enObj).forEach(key => {
      expect(
        Object.prototype.hasOwnProperty.call(otherObj, key),
        `${pathLabel}.${key} missing`
      ).toBe(true);
      compareStructure(enObj[key], otherObj[key], `${pathLabel}.${key}`);
    });
  }

  if (Array.isArray(enVal) && Array.isArray(otherVal)) {
    expect(
      otherVal.length,
      `${pathLabel} array length mismatch (en=${enVal.length}, other=${otherVal.length})`
    ).toBe(enVal.length);
    enVal.forEach((item, idx) => {
      compareStructure(item, otherVal[idx], `${pathLabel}[${idx}]`);
    });
  }
};

describe('i18n completeness vs baselines', () => {
  const namespaces = getAllNamespaceFiles(enDir);
  const nonLessonNamespaces = namespaces.filter(ns => ns !== 'lessons.json');

  nonLessonNamespaces.forEach(nsFile => {
    it(`en/${nsFile} should not be empty`, () => {
      const enJson = readJson(path.join(enDir, nsFile));
      expect(typeof enJson).toBe('object');
      expect(enJson).not.toBeNull();
      expect(Object.keys(enJson as JSONObject).length).toBeGreaterThan(0);
    });
  });

  OTHER_LOCALES.forEach(locale => {
    nonLessonNamespaces.forEach(nsFile => {
      it(`${locale} should match keys/types of en/${nsFile}`, () => {
        const enPath = path.join(enDir, nsFile);
        const otherPath = path.join(localesDir, locale, nsFile);
        expect(fs.existsSync(otherPath), `${locale}/${nsFile} is missing`).toBe(true);

        const enJson = readJson(enPath);
        const otherJson = readJson(otherPath);
        compareStructure(enJson, otherJson, `${locale}/${nsFile}`);
      });
    });
  });

  const buildLessonsBaseline = () => {
    const categories: Record<string, string> = {};
    CATEGORIES.forEach(cat => {
      categories[cat.id] = cat.title;
    });

    const lessons: Record<string, JSONObject> = {};
    LESSONS.forEach(lesson => {
      const content: Record<string, JSONValue> = {};
      lesson.contentBlocks.forEach((block, idx) => {
        const key = String(idx);
        if (block.type === 'markdown') {
          content[key] = '';
        } else if (block.type === 'key-list') {
          content[key] = {
            keys: Object.fromEntries(block.keys.map((k, i) => [String(i), '']))
          };
        } else if (block.type === 'run-example') {
          content[key] = {
            tracks: Object.fromEntries(
              (block.config.tracks || []).map((track, i) => [String(i), ''])
            ),
            steps: Object.fromEntries(
              (block.config.steps || []).map((step, i) => [String(i), ''])
            )
          };
        } else if (block.type === 'challenge') {
          content[key] = {
            goals: Object.fromEntries(
              (block.config.goals || []).map(goal => [goal.id, ''])
            )
          };
        }
      });

      lessons[lesson.slug] = {
        title: '',
        shortDescription: '',
        content
      };
    });

    return { categories, lessons };
  };

  OTHER_LOCALES.forEach(locale => {
    it(`${locale}/lessons.json should match lessons baseline from source`, () => {
      const localePath = path.join(localesDir, locale, 'lessons.json');
      expect(fs.existsSync(localePath), `${locale}/lessons.json is missing`).toBe(true);
      const localeJson = readJson(localePath);
      const baseline = buildLessonsBaseline();
      compareStructure(baseline, localeJson, `${locale}/lessons.json`);
    });
  });
});
