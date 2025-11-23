export const VERSION = '1.4.2';

const branch =
  import.meta.env.VITE_BRANCH ||
  import.meta.env.VITE_GIT_BRANCH ||
  import.meta.env.BRANCH ||
  (import.meta.env.MODE === 'development' ? 'dev' : 'master');

export const VERSION_LABEL = branch === 'dev'
  ? 'Alpha'
  : branch === 'master'
    ? 'Release'
    : 'Other';
