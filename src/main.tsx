import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Route, Switch } from 'wouter';
import '@/i18n';
import '@/styles/index.css';
import { UpdatePrompt } from '@/app/UpdatePrompt';
import { getDeviceId, requestPersistence } from '@/db/db';
import { HomeScreen } from '@/screens/HomeScreen';

// Theme before first paint is handled in index.html; here we prepare local storage.
void getDeviceId();
if (matchMedia('(display-mode: standalone)').matches) void requestPersistence();

// Screens that are not needed at startup are split into their own chunks.
const DataScreen = lazy(() => import('@/screens/DataScreen').then((m) => ({ default: m.DataScreen })));


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Switch>
        <Route path="/settings/data"><DataScreen /></Route>
        <Route><HomeScreen /></Route>
      </Switch>
    </Suspense>
    <UpdatePrompt />
  </StrictMode>
);
