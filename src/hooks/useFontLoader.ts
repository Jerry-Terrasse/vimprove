import { useEffect, useState } from 'react';

type FontConfig = {
  name: string;
  googleFont?: string; // Google Fonts family name
  fallback?: string;   // System fallback
};

export const FONT_CONFIGS: FontConfig[] = [
  { name: 'Consolas', fallback: 'Consolas, monospace' },
  { name: 'Fira Code', googleFont: 'Fira+Code:wght@400;500;700' },
  { name: 'JetBrains Mono', googleFont: 'JetBrains+Mono:wght@400;500;700' },
  { name: 'Cascadia Code', googleFont: 'Cascadia+Code:wght@400;500;700' },
  { name: 'Menlo', fallback: 'Menlo, monospace' },
  { name: 'Source Code Pro', googleFont: 'Source+Code+Pro:wght@400;500;700' },
  { name: 'Roboto Mono', googleFont: 'Roboto+Mono:wght@400;500;700' },
  { name: 'IBM Plex Mono', googleFont: 'IBM+Plex+Mono:wght@400;500;700' },
  { name: 'Inconsolata', googleFont: 'Inconsolata:wght@400;500;700' },
  { name: 'Monaco', fallback: 'Monaco, monospace' }
];

const loadedFonts = new Set<string>();

export function useFontLoader(fontName: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const config = FONT_CONFIGS.find(f => f.name === fontName);
    if (!config) {
      setError(true);
      return;
    }

    // System fonts don't need loading
    if (config.fallback && !config.googleFont) {
      setIsLoaded(true);
      return;
    }

    // Already loaded
    if (loadedFonts.has(fontName)) {
      setIsLoaded(true);
      return;
    }

    // Load Google Font
    if (config.googleFont) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${config.googleFont}&display=swap`;

      link.onload = () => {
        loadedFonts.add(fontName);
        setIsLoaded(true);
      };

      link.onerror = () => {
        setError(true);
      };

      document.head.appendChild(link);

      return () => {
        // Keep fonts loaded (don't remove)
      };
    }
  }, [fontName]);

  return { isLoaded, error };
}

export function getFontFamily(fontName: string): string {
  const config = FONT_CONFIGS.find(f => f.name === fontName);
  if (!config) return 'monospace';

  if (config.fallback) {
    return config.fallback;
  }

  return `"${fontName}", monospace`;
}
