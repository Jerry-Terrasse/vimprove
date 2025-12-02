export const REL_VERSION = '1.5.0';
export const DEV_VERSION = '1.9.0';
export const VERSION = REL_VERSION;

const branch =
  import.meta.env.VITE_BRANCH ||
  import.meta.env.VITE_GIT_BRANCH ||
  import.meta.env.BRANCH ||
  (import.meta.env.MODE === 'development' ? 'dev' : 'master');

export type BranchKey = 'release' | 'alpha';

const releaseUrl = import.meta.env.VITE_RELEASE_URL;
const alphaUrl = import.meta.env.VITE_ALPHA_URL;

export const BRANCH_LINKS: Record<BranchKey, { version: string; url?: string }> = {
  release: {
    version: REL_VERSION,
    url: releaseUrl
  },
  alpha: {
    version: DEV_VERSION,
    url: alphaUrl
  }
};

const branchKey: BranchKey = branch === 'master' ? 'release' : 'alpha';

export const CURRENT_BRANCH: BranchKey = branchKey;

export const VERSION_LABEL = branchKey === 'alpha' ? 'Alpha' : 'Release';
