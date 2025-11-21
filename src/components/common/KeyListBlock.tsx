import type { KeyItem } from '@/core/types';
import { useTranslationSafe } from '@/hooks/useI18n';

type KeyListBlockProps = {
  keys: KeyItem[];
  i18nBaseKey?: string;
};

export const KeyListBlock = ({ keys, i18nBaseKey }: KeyListBlockProps) => {
  const { t } = useTranslationSafe('lessons');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
      {keys.map((k, i) => (
        <div
          key={i}
          className="flex items-center justify-between bg-stone-800 p-3 rounded border border-stone-700"
        >
          <div className="flex gap-1">
            {k.chars.map(char => (
              <kbd
                key={char}
                className="bg-stone-900 px-2 py-1 rounded text-green-400 font-mono font-bold border border-stone-700 shadow-sm min-w-[24px] text-center"
              >
                {char}
              </kbd>
            ))}
          </div>
          <span className="text-sm text-stone-400 font-medium">
            {t(
              i18nBaseKey ? `${i18nBaseKey}.keys.${i}` : k.i18nKey || `key.${i}`,
              k.desc
            )}
          </span>
        </div>
      ))}
    </div>
  );
};
