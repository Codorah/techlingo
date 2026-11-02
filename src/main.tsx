import { useLiveQuery } from 'dexie-react-hooks';
import { type ComponentType, lazy, StrictMode, Suspense, useEffect, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Route, Switch, useLocation } from 'wouter';
import '@/i18n';
import '@/styles/index.css';
import { InstallSheet } from '@/app/InstallSheet';
import { UpdatePrompt } from '@/app/UpdatePrompt';
import { RewardWatcher } from '@/components/ui/RewardWatcher';
import { db, getDeviceId, requestPersistence } from '@/db/db';
import { domainOf } from '@/lib/domains';
import { isStandalone } from '@/lib/install';
import '@/lib/sound'; // unlocks Web Audio on the first tap (iOS)
import { stopSpeaking } from '@/lib/speech';
import { useManifest } from '@/lib/useContent';
import { HomeScreen } from '@/screens/HomeScreen';

// A visitor without a profile lands on the presentation page first; its buttons open the app with ?start=1.
const ENTERED_KEY = 'techlingo.entered';
const cameFromLanding = new URLSearchParams(location.search).has('start');
if (cameFromLanding) {
  try { localStorage.setItem(ENTERED_KEY, '1'); } catch { /* storage unavailable: this visit still opens the app */ }
  history.replaceState(null, '', location.pathname + location.hash);
}
const hasEntered = () => { try { return localStorage.getItem(ENTERED_KEY) === '1'; } catch { return false; } };

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
const SettingsScreen = named(() => import('@/screens/SettingsScreen'), 'SettingsScreen');
const HelpScreen = named(() => import('@/screens/HelpScreen'), 'HelpScreen');
const PracticeScreen = named(() => import('@/screens/practice/PracticeScreen'), 'PracticeScreen');
const ReviewScreen = named(() => import('@/screens/practice/ReviewScreen'), 'ReviewScreen');
const SessionScreen = named(() => import('@/screens/practice/SessionScreen'), 'SessionScreen');
const CareerScreen = named(() => import('@/screens/career/CareerScreen'), 'CareerScreen');
const QuestionScreen = named(() => import('@/screens/career/QuestionScreen'), 'QuestionScreen');
const PitchScreen = named(() => import('@/screens/career/PitchScreen'), 'PitchScreen');
const DataScreen = named(() => import('@/screens/DataScreen'), 'DataScreen');
const RolesScreen = named(() => import('@/screens/RolesScreen'), 'RolesScreen');
const ThemeScreen = named(() => import('@/screens/path/ThemeScreen'), 'ThemeScreen');
const NodeScreen = named(() => import('@/screens/path/NodeScreen'), 'NodeScreen');
const SituationsScreen = named(() => import('@/screens/situations/SituationsScreen'), 'SituationsScreen');
const SituationScreen = named(() => import('@/screens/situations/SituationScreen'), 'SituationScreen');
const CourseScreen = named(() => import('@/screens/course/CourseScreen'), 'CourseScreen');
const CourseNodeScreen = named(() => import('@/screens/course/CourseNodeScreen'), 'CourseNodeScreen');
const KnowledgeScreen = named(() => import('@/screens/KnowledgeScreen'), 'KnowledgeScreen');

function App() {
  const profile = useLiveQuery(async () => (await db.profile.get('me')) ?? null);
  const manifest = useManifest();
  const domain = domainOf(manifest, profile?.primaryRole);
  const [location] = useLocation();
  useEffect(() => { document.documentElement.dataset.domain = domain; }, [domain]);
  // Leaving a screen silences whatever it was reading aloud (layout effect: runs before the new screen's autoplay).
  useLayoutEffect(() => { stopSpeaking(); }, [location]);
  if (profile === undefined) return null; // first IndexedDB read

  if (!profile?.onboardedAt) {
    // Browser visit to the bare address, never started: show the presentation first. The installed app goes straight to onboarding.
    if (location === '/' && !cameFromLanding && !hasEntered() && !isStandalone()) { window.location.replace('/decouvrir/'); return null; }
    return (
      <>
      <Switch>
        <Route path="/settings/data"><DataScreen /></Route>
        <Route path="/settings/help"><HelpScreen /></Route>
        <Route><OnboardingScreen /></Route>
      </Switch>
      <InstallSheet />
      </>
    );
  }
  return (
    <>
    <Switch>
      <Route path="/spin"><SpinScreen /></Route>
      <Route path="/lesson/:termId"><LessonScreen /></Route>
      <Route path="/dictionary"><DictionaryScreen /></Route>
      <Route path="/word/:id"><WordScreen /></Route>
      <Route path="/practice/review"><ReviewScreen /></Route>
      <Route path="/practice/:mode"><SessionScreen /></Route>
      <Route path="/practice"><PracticeScreen /></Route>
      <Route path="/career/pitch"><PitchScreen /></Route>
      <Route path="/career/q/:id"><QuestionScreen /></Route>
      <Route path="/career"><CareerScreen /></Route>
      <Route path="/profile"><ProfileScreen /></Route>
      <Route path="/settings/roles"><RolesScreen /></Route>
      <Route path="/settings/data"><DataScreen /></Route>
      <Route path="/settings/help"><HelpScreen /></Route>
      <Route path="/settings"><SettingsScreen /></Route>
      <Route path="/path/:category/:nodeId"><NodeScreen /></Route>
      <Route path="/path/:category"><ThemeScreen /></Route>
      <Route path="/situations/:nodeId"><SituationScreen /></Route>
      <Route path="/situations"><SituationsScreen /></Route>
      <Route path="/parcours/:role/:nodeId"><CourseNodeScreen /></Route>
      <Route path="/parcours/:role"><CourseScreen /></Route>
      <Route path="/knowledge"><KnowledgeScreen /></Route>
      <Route><HomeScreen /></Route>
    </Switch>
    {/* Offered once the learner is in the app, never on top of the onboarding. */}
    <InstallSheet />
    <RewardWatcher />
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}><App /></Suspense>
    <UpdatePrompt />
  </StrictMode>
);
