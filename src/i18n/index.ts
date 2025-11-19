const TRANSLATIONS = {
  en: {
    'app.title': 'Vimprove',
    'app.subtitle': 'Interactive Vim Training',
    'mode.normal': 'NORMAL',
    'mode.insert': 'INSERT',
    'msg.click_to_focus': 'Click to resume focus',
    'msg.level_complete': 'Lesson Complete!',
    'btn.next_lesson': 'Next Lesson',
    'btn.prev_lesson': 'Previous Lesson',
    'btn.restart': 'Restart',
    'btn.start_learning': 'Start Learning',
    'stats.best_time': 'Best Time',
    'stats.attempts': 'Attempts',
    'tab.challenge': 'Challenge',
    'tab.stats': 'Stats',
  }
};

export const t = (key: string): string => {
  return TRANSLATIONS.en[key as keyof typeof TRANSLATIONS.en] || key;
};
