import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { LocaleCode } from '@/i18n';

export const useTranslationSafe = <T extends string = string>(ns?: T) => {
  const { t, i18n } = useTranslation(ns);
  const translate = useCallback(
    (key: string, defaultValue?: string, options?: Record<string, unknown>) =>
      t(key, { defaultValue, ...options }),
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
