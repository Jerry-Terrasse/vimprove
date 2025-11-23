import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { LocaleCode } from '@/i18n';

const MISSING_FALLBACK = 'TRANSLATION MISSING';

export const useTranslationSafe = (ns?: string | string[]) => {
  const { t, i18n } = useTranslation(ns);
  const translate = useCallback(
    (key: string, _defaultValue?: string, options?: Record<string, unknown>) =>
      t(key, { defaultValue: MISSING_FALLBACK, ...options }),
    [t]
  );
  return { t: translate, i18n };
};

export const useLocale = () => {
  const { i18n } = useTranslation();

  const setLocale = useCallback(
    async (lng: LocaleCode) => {
      if (i18n.resolvedLanguage === lng) return;
      await i18n.changeLanguage(lng);
      localStorage.setItem('i18nextLng', lng);
    },
    [i18n]
  );

  return {
    locale: (i18n.resolvedLanguage || i18n.language || 'en') as LocaleCode,
    setLocale,
    supported: i18n.options.supportedLngs as LocaleCode[]
  };
};
