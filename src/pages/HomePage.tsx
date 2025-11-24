import { useState } from 'react';
import { Terminal, Play, Keyboard, Trophy, Code2, Languages, ChevronDown } from 'lucide-react';
import { VERSION, VERSION_LABEL } from '@/version';
import { useTranslationSafe, useLocale } from '@/hooks/useI18n';
import { supportedLocales } from '@/i18n';

type HomePageProps = {
  onStart: () => void;
};

export const HomePage = ({ onStart }: HomePageProps) => {
  const { t } = useTranslationSafe('home');
  const { locale, setLocale } = useLocale();
  const [isLangOpen, setIsLangOpen] = useState(false);

  const features = [
    {
      icon: Keyboard,
      title: t('features.realEngine.title', 'Real Engine'),
      desc: t(
        'features.realEngine.desc',
        'A custom built Vim engine running directly in your browser.'
      )
    },
    {
      icon: Trophy,
      title: t('features.gamified.title', 'Gamified'),
      desc: t('features.gamified.desc', 'Complete challenges to unlock new levels and track stats.')
    },
    {
      icon: Code2,
      title: t('features.interactive.title', 'Interactive'),
      desc: t(
        'features.interactive.desc',
        "Don't just read. Type. Edit. Delete. Practice makes perfect."
      )
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-2xl mx-auto px-6 animate-in fade-in duration-500 relative">
      <div className="w-full flex justify-end mb-6">
        <div className="relative">
          <button
            onClick={() => setIsLangOpen(open => !open)}
            className="flex items-center gap-2 bg-stone-900/80 border border-stone-800 text-stone-200 rounded-full px-3 py-1.5 text-sm hover:border-green-600 transition-colors"
          >
            <Languages size={16} />
            <span className="font-medium">
              {supportedLocales.find(l => l.code === locale)?.shortLabel || locale}
            </span>
            <ChevronDown size={14} className={isLangOpen ? 'transform rotate-180' : ''} />
          </button>
          {isLangOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-stone-900 border border-stone-800 rounded-xl shadow-2xl overflow-hidden z-10">
              <div className="px-3 py-2 text-xs text-stone-500 border-b border-stone-800 text-left">
                {t('language.menuTitle', 'Choose language')}
              </div>
              {supportedLocales.map(lng => (
                <button
                  key={lng.code}
                  onClick={() => {
                    setLocale(lng.code);
                    setIsLangOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    locale === lng.code
                      ? 'bg-green-700/30 text-white'
                      : 'text-stone-200 hover:bg-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{lng.nativeLabel}</span>
                    <span className="text-xs text-stone-500">{lng.shortLabel}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="bg-stone-800 p-4 rounded-2xl mb-8 shadow-2xl rotate-3 transform hover:rotate-0 transition-transform duration-500">
        <Terminal size={64} className="text-green-400" />
      </div>
      <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tighter mb-6">
        {t('hero.titlePrefix', 'Master')}{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
          Vim
        </span>{' '}
        {t('hero.titleSuffix', 'Motion.')}
      </h1>
      <p className="text-xl text-stone-400 mb-10 leading-relaxed">
        {t(
          'hero.subtitle',
          'Stop memorizing cheatsheets. Build muscle memory directly in the browser with our interactive challenges.'
        )}
      </p>
      <button
        onClick={onStart}
        className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2 shadow-xl shadow-white/10"
      >
        <Play size={20} fill="currentColor" />
        {t('hero.cta', 'Start Learning')}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 w-full text-left">
        {features.map((feat, i) => (
          <div key={i} className="bg-stone-900/50 p-6 rounded-xl border border-stone-800">
            <feat.icon className="text-stone-500 mb-3" />
            <h3 className="font-bold text-stone-200 mb-1">{feat.title}</h3>
            <p className="text-sm text-stone-500">{feat.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 text-xs text-stone-700 font-mono">
        v{VERSION} {VERSION_LABEL}
      </div>
    </div>
  );
};
