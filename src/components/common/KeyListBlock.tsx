import type { KeyItem } from '@/core/types';

type KeyListBlockProps = {
  keys: KeyItem[];
};

export const KeyListBlock = ({ keys }: KeyListBlockProps) => (
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
        <span className="text-sm text-stone-400 font-medium">{k.desc}</span>
      </div>
    ))}
  </div>
);
