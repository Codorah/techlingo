import { useLiveQuery } from 'dexie-react-hooks';
import { type ComponentType, lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Route, Switch } from 'wouter';
import '@/i18n';
import '@/styles/index.css';
import { UpdatePrompt } from '@/app/UpdatePrompt';
import { db, getDeviceId, requestPersistence } from '@/db/db';
import '@/lib/install';
import { HomeScreen } from '@/screens/HomeScreen';

void getDeviceId();
if (matchMedia('(display-mode: standalone)').matches) void requestPersistence();

// Screens not needed on the first paint are split into their own chunks.
const named = <K extends string>(load: () => Promise<Record<K, ComponentType>>, key: K) => lazy(() => load().then((m) => ({ default: m[key] })));
const OnboardingScreen = named(() => import('@/screens/OnboardingScreen'), 'OnboardingScreen');
const SpinScreen = named(() => import('@/screens/SpinScreen'), 'SpinScreen');
const LessonScreen = named(() => import('@/screens/lesson/LessonScreen'), 'LessonScreen');
const DictionaryScreen = named(() => import('@/screens/DictionaryScreen'), 'DictionaryScreen');
const WordScreen = named(() => import('@/screens/WordScreen'), 'WordScreen');
const ProfileScreen = named(() => import('@/screens/ProfileScreen'), 'ProfileScreen');
const DataScreen = named(() => import('@/screens/DataScreen'), 'DataScreen');

function App() {
  const profile = useLiveQuery(async () => (await db.profile.get('me')) ?? null);
  if (profile === undefined) return null; // first IndexedDB read

  if (!profile?.onboardedAt) {
    return (
      <Switch>
        <Route path="/settings/data"><DataScreen /></Route>
        <Route><OnboardingScreen /></Route>
      </Switch>
    );
  }
  return (
    <Switch>
      <Route path="/spin"><SpinScreen /></Route>
      <Route path="/lesson/:termId"><LessonScreen /></Route>
      <Route path="/dictionary"><DictionaryScreen /></Route>
      <Route path="/word/:id"><WordScreen /></Route>
      <Route path="/profile"><ProfileScreen /></Route>
      <Route path="/settings/data"><DataScreen /></Route>
      <Route><HomeScreen /></Route>
    </Switch>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}><App /></Suspense>
    <UpdatePrompt />
  </StrictMode>
);
