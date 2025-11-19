import { Terminal, Play, Keyboard, Trophy, Code2 } from 'lucide-react';
import { VERSION, VERSION_LABEL } from '@/version';

type HomePageProps = {
  onStart: () => void;
};

export const HomePage = ({ onStart }: HomePageProps) => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-2xl mx-auto px-6 animate-in fade-in duration-500">
    <div className="bg-stone-800 p-4 rounded-2xl mb-8 shadow-2xl rotate-3 transform hover:rotate-0 transition-transform duration-500">
      <Terminal size={64} className="text-green-400" />
    </div>
    <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tighter mb-6">
      Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">Vim</span> Motion.
    </h1>
    <p className="text-xl text-stone-400 mb-10 leading-relaxed">
      Stop memorizing cheatsheets. Build muscle memory directly in the browser with our interactive challenges.
    </p>
    <button
      onClick={onStart}
      className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2 shadow-xl shadow-white/10"
    >
      <Play size={20} fill="currentColor" />
      Start Learning
    </button>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 w-full text-left">
      {[
        {
          icon: Keyboard,
          title: 'Real Engine',
          desc: 'A custom built Vim engine running directly in your browser.'
        },
        {
          icon: Trophy,
          title: 'Gamified',
          desc: 'Complete challenges to unlock new levels and track stats.'
        },
        {
          icon: Code2,
          title: 'Interactive',
          desc: "Don't just read. Type. Edit. Delete. Practice makes perfect."
        }
      ].map((feat, i) => (
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
