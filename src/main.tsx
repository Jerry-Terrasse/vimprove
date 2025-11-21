import { StrictMode, Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { I18nextProvider } from 'react-i18next';
import { initI18n } from '@/i18n';

const AppWithI18n = () => {
  const [i18nInstance, setI18nInstance] = useState<Awaited<ReturnType<typeof initI18n>> | null>(null);

  useEffect(() => {
    initI18n().then(instance => setI18nInstance(instance));
  }, []);

  if (!i18nInstance) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <I18nextProvider i18n={i18nInstance}>
        <App />
      </I18nextProvider>
    </Suspense>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithI18n />
  </StrictMode>
);
