import i18n, { type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 基于 Vite 的按需加载：收集 src/i18n/locales/{lang}/{ns}.json
const localeModules = import.meta.glob('./locales/*/*.json', { eager: true });

const resources: Resource = {};

Object.entries(localeModules).forEach(([path, mod]) => {
  // 路径格式: ./locales/{lang}/{namespace}.json
  const match = path.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/);
  if (!match) return;
  const [, lng, ns] = match;
  resources[lng] = resources[lng] || {};
  resources[lng][ns] = (mod as { default: Record<string, unknown> }).default;
});

export const supportedLocales = [
  { code: 'en', label: 'English', nativeLabel: 'English', shortLabel: 'Eng' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文', shortLabel: '中' },
  { code: 'zh-lively', label: 'Chinese (Lively)', nativeLabel: '中文（活泼）', shortLabel: '活' }
] as const;

export const defaultNS = 'common';

export const initI18n = async () => {
  if (i18n.isInitialized) return i18n;

  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      supportedLngs: supportedLocales.map(l => l.code),
      defaultNS,
      interpolation: {
        escapeValue: false
      },
      detection: {
        order: ['querystring', 'localStorage', 'navigator'],
        caches: ['localStorage']
      }
    });

  return i18n;
};

export type LocaleCode = (typeof supportedLocales)[number]['code'];
