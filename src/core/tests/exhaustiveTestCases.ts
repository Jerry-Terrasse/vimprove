import type { VimState } from '@/core/types';

type FeatureId =
  | 'motion_hjkl'
  | 'motion_word'
  | 'motion_WORD'
  | 'motion_line'
  | 'motion_find'
  | 'operator_d'
  | 'operator_c'
  | 'operator_y'
  | 'operator_y_line'
  | 'text_objects'
  | 'edit_xsr'
  | 'edit_dd'
  | 'insert_ia'
  | 'insert_IA'
  | 'insert_oO'
  | 'paste'
  | 'search'
  | 'count_prefix'
  | 'undo_redo'
  | 'dot';

type FeatureConfig = { enabled: Set<FeatureId> };

type CommandKind =
  | { kind: 'motion'; key: string; count?: number }
  | { kind: 'delete'; key: string; count?: number }
  | { kind: 'change'; motion: string; text: string; count?: number }
  | { kind: 'yank'; motion: string; count?: number }
  | { kind: 'edit'; key: string; count?: number }
  | { kind: 'insert'; key: string; text: string; count?: number }
  | { kind: 'paste'; key: 'p' | 'P'; count?: number }
  | { kind: 'search'; pattern: string; direction: '/' | '?'; count?: number }
  | { kind: 'searchNext'; key: 'n' | 'N' | '*' | '#'; count?: number }
  | { kind: 'undo' }
  | { kind: 'redo' }
  | { kind: 'dot'; count?: number };

type Scenario = {
  name: string;
  lines: string[];
  cursor: { line: number; col: number };
};

type GeneratedCase = Scenario & { keySeq: string; label: string };

const ENABLED_FEATURES: FeatureConfig = {
  enabled: new Set<FeatureId>([
    'motion_hjkl',
    'motion_word',
    'motion_WORD',
    'motion_line',
    'motion_find',
    'operator_d',
    'operator_c',
    'operator_y',
    'operator_y_line',
    'text_objects',
    'edit_xsr',
    'edit_dd',
    'insert_ia',
    'insert_IA',
    'insert_oO',
    'paste',
    'search',
    'count_prefix',
    'undo_redo',
    'dot'
  ])
};

const SCENARIOS: Scenario[] = [
  { name: 'simple', lines: ['foo bar baz'], cursor: { line: 1, col: 5 } },
  { name: 'multiline', lines: ['foo bar', 'baz qux'], cursor: { line: 1, col: 5 } },
  { name: 'empty', lines: [''], cursor: { line: 1, col: 1 } },
  { name: 'punct', lines: ['a,b.c'], cursor: { line: 1, col: 2 } },
  {
    name: 'cpp-fast-inv-sqrt',
    lines: [
      '[[nodiscard]] constexpr auto fast_inv_sqrt(float x) noexcept -> float {',
      '    using std::uint32_t;',
      '',
      '    constexpr auto magic        = 0x5f3759dfu;',
      '    constexpr auto half         = 0.5f;',
      '    constexpr auto three_halfs  = 1.5f;',
      '',
      '    if (x <= 0.0f || !std::isfinite(x)) {',
      '        return std::numeric_limits<float>::quiet_NaN();',
      '    }',
      '',
      '    auto i = std::bit_cast<uint32_t>(x);        // float -> bits',
      '    i = magic - (i >> 1);                       // magic initial guess',
      '    auto y = std::bit_cast<float>(i);           // bits -> float',
      '',
      '    y = y * (three_halfs - half * x * y * y);   // Newton-Raphson step',
      '',
      '    return y;',
      '}'
    ],
    cursor: { line: 1, col: 20 }
  }
];

const toKeySeq = (cmd: CommandKind): string => {
  const prefix = cmd.count ? `${cmd.count}` : '';
  switch (cmd.kind) {
    case 'motion':
      return `${prefix}${cmd.key}`;
    case 'delete':
      return `${prefix}${cmd.key}`;
    case 'change':
      return `${prefix}c${cmd.motion}${cmd.text}<Esc>`;
    case 'yank':
      return `${prefix}y${cmd.motion}`;
    case 'edit':
      return `${prefix}${cmd.key}`;
    case 'insert':
      return `${prefix}${cmd.key}${cmd.text}<Esc>`;
    case 'paste':
      return `${prefix}${cmd.key}`;
    case 'search':
      return `${prefix}${cmd.direction}${cmd.pattern}<Enter>`;
    case 'searchNext':
      return `${prefix}${cmd.key}`;
    case 'undo':
      return 'u';
    case 'redo':
      return '<C-r>';
    case 'dot':
      return `${prefix}.`;
    default:
      return '';
  }
};

const buildCommands = (cfg: FeatureConfig): CommandKind[] => {
  const cmds: CommandKind[] = [];
  const motions: string[] = [];

  if (cfg.enabled.has('motion_hjkl')) {
    ['h', 'j', 'k', 'l'].forEach(k => cmds.push({ kind: 'motion', key: k }));
    motions.push('h', 'j', 'k', 'l');
  }

  if (cfg.enabled.has('motion_word')) {
    ['w', 'b', 'e'].forEach(k => cmds.push({ kind: 'motion', key: k }));
    motions.push('w', 'b', 'e');
  }

  if (cfg.enabled.has('motion_WORD')) {
    ['W', 'B', 'E'].forEach(k => cmds.push({ kind: 'motion', key: k }));
    motions.push('W', 'B', 'E');
  }

  if (cfg.enabled.has('motion_line')) {
    ['0', '^', '$', '_'].forEach(k => cmds.push({ kind: 'motion', key: k }));
    motions.push('0', '^', '$', '_');
  }

  if (cfg.enabled.has('motion_find')) {
    ['fa', 'ta', 'Fa', 'Ta', ';', ','].forEach(k => cmds.push({ kind: 'motion', key: k }));
    motions.push('fa', 'ta', 'Fa', 'Ta', ';', ',');
  }

  const operatorMotions = ['w', '$', 'e'];

  if (cfg.enabled.has('text_objects')) {
    operatorMotions.push('iw', 'aw', 'i(', 'a(', 'i{', 'a{', 'i[', 'a[', 'i"', 'a"', "i'", "a'", 'i`', 'a`', 'ip', 'ap');
  }

  if (cfg.enabled.has('operator_d')) {
    operatorMotions.forEach(m => cmds.push({ kind: 'delete', key: `d${m}` }));
  }

  if (cfg.enabled.has('operator_c')) {
    operatorMotions.forEach(m => cmds.push({ kind: 'change', motion: m, text: 'X' }));
  }

  if (cfg.enabled.has('operator_y')) {
    operatorMotions.forEach(m => cmds.push({ kind: 'yank', motion: m }));
  }

  if (cfg.enabled.has('operator_y_line')) {
    cmds.push({ kind: 'yank', motion: 'y' });
  }

  if (cfg.enabled.has('edit_xsr')) {
    cmds.push({ kind: 'edit', key: 'x' });
    cmds.push({ kind: 'edit', key: 's' });
    cmds.push({ kind: 'edit', key: 'ra' });
  }

  if (cfg.enabled.has('edit_dd')) {
    cmds.push({ kind: 'edit', key: 'dd' });
  }

  if (cfg.enabled.has('insert_ia')) {
    cmds.push({ kind: 'insert', key: 'i', text: 'Z' });
    cmds.push({ kind: 'insert', key: 'a', text: 'Y' });
  }

  if (cfg.enabled.has('insert_IA')) {
    cmds.push({ kind: 'insert', key: 'I', text: 'Q' });
    cmds.push({ kind: 'insert', key: 'A', text: 'P' });
  }

  if (cfg.enabled.has('insert_oO')) {
    cmds.push({ kind: 'insert', key: 'o', text: 'M' });
    cmds.push({ kind: 'insert', key: 'O', text: 'N' });
  }

  if (cfg.enabled.has('paste')) {
    cmds.push({ kind: 'paste', key: 'p' });
    cmds.push({ kind: 'paste', key: 'P' });
  }

  if (cfg.enabled.has('search')) {
    cmds.push({ kind: 'search', direction: '/', pattern: 'foo' });
    cmds.push({ kind: 'search', direction: '?', pattern: 'foo' });
    cmds.push({ kind: 'searchNext', key: 'n' });
    cmds.push({ kind: 'searchNext', key: 'N' });
    cmds.push({ kind: 'searchNext', key: '*' });
    cmds.push({ kind: 'searchNext', key: '#' });
  }

  if (cfg.enabled.has('count_prefix')) {
    const countedMotions = [
      { kind: 'motion', key: 'w', count: 3 },
      { kind: 'motion', key: 'b', count: 2 },
      { kind: 'motion', key: 'e', count: 2 },
      { kind: 'motion', key: 'l', count: 4 },
      { kind: 'motion', key: '$', count: 2 }
    ] as CommandKind[];
    countedMotions.forEach(cmd => cmds.push(cmd));

    const countedDeletes = [
      { kind: 'delete', key: 'dw', count: 2 },
      { kind: 'delete', key: 'd$', count: 2 }
    ] as CommandKind[];
    countedDeletes.forEach(cmd => cmds.push(cmd));

    cmds.push({ kind: 'dot', count: 2 });
  }

  if (cfg.enabled.has('undo_redo')) {
    cmds.push({ kind: 'undo' });
    cmds.push({ kind: 'redo' });
  }

  if (cfg.enabled.has('dot')) {
    cmds.push({ kind: 'dot' });
  }

  return cmds;
};

const sampleWithSeed = <T>(arr: T[], count: number, seed: number): T[] => {
  if (arr.length <= count) return arr;
  const result: T[] = [];
  const step = Math.floor(arr.length / count);
  for (let i = 0; i < count; i++) {
    result.push(arr[(i * step + seed) % arr.length]);
  }
  return result;
};

const generateSequences = (commands: CommandKind[]): { seq: CommandKind[]; label: string }[] => {
  const result: { seq: CommandKind[]; label: string }[] = [];
  const unique = new Set<string>();

  const addSeq = (seq: CommandKind[], label: string) => {
    const key = seq.map(toKeySeq).join('');
    if (!unique.has(key)) {
      unique.add(key);
      result.push({ seq, label });
    }
  };

  commands.forEach(cmd => addSeq([cmd], 'len1'));

  const len2Pairs: [string[], string[]][] = [
    [['motion'], ['motion']],
    [['delete', 'change', 'yank'], ['motion']],
    [['edit', 'delete'], ['undo']],
    [['insert'], ['dot']],
    [['delete'], ['paste']],
    [['undo'], ['redo']],
  ];

  len2Pairs.forEach(([kinds1, kinds2]) => {
    const pool1 = commands.filter(c => kinds1.includes(c.kind));
    const pool2 = commands.filter(c => kinds2.includes(c.kind));

    const sampled = sampleWithSeed(
      pool1.flatMap(a => pool2.map(b => [a, b])),
      Math.min(15, pool1.length * pool2.length),
      42
    );

    sampled.forEach(([a, b]) => addSeq([a, b], 'len2'));
  });

  const len3Patterns: [string[], string[], string[]][] = [
    [['delete'], ['undo'], ['redo']],
    [['insert'], ['dot'], ['dot']],
    [['delete'], ['paste'], ['dot']],
    [['yank'], ['motion'], ['paste']],
    [['edit'], ['undo'], ['dot']],
  ];

  len3Patterns.forEach(([kinds1, kinds2, kinds3]) => {
    const pool1 = commands.filter(c => kinds1.includes(c.kind));
    const pool2 = commands.filter(c => kinds2.includes(c.kind));
    const pool3 = commands.filter(c => kinds3.includes(c.kind));

    const sampled = sampleWithSeed(
      pool1.flatMap(a =>
        pool2.flatMap(b =>
          pool3.map(c => [a, b, c])
        )
      ),
      Math.min(10, pool1.length * pool2.length * pool3.length),
      123
    );

    sampled.forEach(([a, b, c]) => addSeq([a, b, c], 'len3'));
  });

  return result;
};

const buildCases = (cfg: FeatureConfig): GeneratedCase[] => {
  const commands = buildCommands(cfg);
  const sequences = generateSequences(commands);

  const cases: GeneratedCase[] = [];
  sequences.forEach(item => {
    const keySeq = item.seq.map(toKeySeq).join('');
    SCENARIOS.forEach(scenario => {
      cases.push({
        ...scenario,
        keySeq,
        label: `${scenario.name}-${item.label}-${keySeq}`
      });
    });
  });
  return cases;
};

export const DEFAULT_INIT: Pick<VimState, 'buffer' | 'cursor' | 'mode'> = {
  buffer: ['foo bar baz', 'hello world'],
  cursor: { line: 0, col: 0 },
  mode: 'normal'
};

export const GENERATED_CASES = buildCases(ENABLED_FEATURES);

const LONG_SEQUENCE_LENGTHS = [5, 10, 15, 20, 25, 30, 35, 40];
const LONG_SEQUENCE_MAX_LENGTH = 0;
const LONG_SEQUENCE_PER_LENGTH = 128;
const LONG_SEQUENCE_SCENARIO: Scenario = SCENARIOS.find(s => s.name === 'cpp-fast-inv-sqrt')!;

const makePrng = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state;
  };
};

const buildLongSequences = (commands: CommandKind[]) => {
  const tokens = Array.from(new Set(commands.map(toKeySeq))).filter(Boolean);
  const sequences: { keySeq: string; label: string }[] = [];

  LONG_SEQUENCE_LENGTHS.filter(length => length <= LONG_SEQUENCE_MAX_LENGTH).forEach(length => {
    for (let sample = 0; sample < LONG_SEQUENCE_PER_LENGTH; sample++) {
      const prng = makePrng(length * 2048 + sample + tokens.length);
      const parts: string[] = [];
      for (let i = 0; i < length; i++) {
        const idx = prng() % tokens.length;
        parts.push(tokens[idx]);
      }
      sequences.push({ keySeq: parts.join(''), label: `long-l${length}-s${sample}` });
    }
  });

  return sequences;
};

const LONG_SEQUENCE_CASES: GeneratedCase[] = buildLongSequences(buildCommands(ENABLED_FEATURES)).map(item => ({
  ...LONG_SEQUENCE_SCENARIO,
  keySeq: item.keySeq,
  label: `${LONG_SEQUENCE_SCENARIO.name}-${item.label}`
}));

const ALL_CASES: GeneratedCase[] = [...GENERATED_CASES, ...LONG_SEQUENCE_CASES];

export const getShardCases = (shardIndex: number, shardCount: number) => {
  return ALL_CASES.filter((_, i) => i % shardCount === shardIndex);
};
