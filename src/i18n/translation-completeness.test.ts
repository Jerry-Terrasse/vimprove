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

describe('i18n completeness vs en baseline', () => {
  const namespaces = getAllNamespaceFiles(enDir);

  namespaces.forEach(nsFile => {
    it(`en/${nsFile} should not be empty`, () => {
      const enJson = readJson(path.join(enDir, nsFile));
      expect(typeof enJson).toBe('object');
      expect(enJson).not.toBeNull();
      expect(Object.keys(enJson as JSONObject).length).toBeGreaterThan(0);
    });
  });

  OTHER_LOCALES.forEach(locale => {
    namespaces.forEach(nsFile => {
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

  it('en lessons.json should cover all categories and lesson slugs', () => {
    const lessonsJson = readJson(path.join(enDir, 'lessons.json')) as JSONObject;
    expect(lessonsJson && typeof lessonsJson === 'object').toBe(true);
    const categories = (lessonsJson as JSONObject).categories as JSONObject;
    const lessons = (lessonsJson as JSONObject).lessons as JSONObject;

    expect(categories && typeof categories === 'object', 'categories missing').toBe(true);
    expect(lessons && typeof lessons === 'object', 'lessons missing').toBe(true);

    const categoryIds = CATEGORIES.map(cat => cat.id);
    categoryIds.forEach(catId => {
      expect(
        Object.prototype.hasOwnProperty.call(categories, catId),
        `category "${catId}" missing in en lessons.json`
      ).toBe(true);
    });

    LESSONS.forEach(lesson => {
      const entry = lessons[lesson.slug] as JSONObject | undefined;
      expect(entry, `lesson "${lesson.slug}" missing in en lessons.json`).toBeTruthy();
      expect(typeof entry?.title).toBe('string');
      expect(typeof entry?.shortDescription).toBe('string');
      expect(entry?.content && typeof entry.content === 'object').toBe(true);
    });
  });
});
