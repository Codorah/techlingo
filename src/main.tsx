import { useLiveQuery } from 'dexie-react-hooks';
import { type ComponentType, lazy, StrictMode, Suspense, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Route, Switch } from 'wouter';
import '@/i18n';
import '@/styles/index.css';
import { InstallSheet } from '@/app/InstallSheet';
import { UpdatePrompt } from '@/app/UpdatePrompt';
import { db, getDeviceId, requestPersistence } from '@/db/db';
import { domainOf } from '@/lib/domains';
import '@/lib/install';
import { useManifest } from '@/lib/useContent';
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
  useEffect(() => { document.documentElement.dataset.domain = domain; }, [domain]);
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
      <Route path="/path/:category/:nodeId"><NodeScreen /></Route>
      <Route path="/path/:category"><ThemeScreen /></Route>
      <Route path="/situations/:nodeId"><SituationScreen /></Route>
      <Route path="/situations"><SituationsScreen /></Route>
      <Route path="/parcours/:role/:nodeId"><CourseNodeScreen /></Route>
      <Route path="/parcours/:role"><CourseScreen /></Route>
      <Route path="/knowledge"><KnowledgeScreen /></Route>
      <Route path="/settings/data"><DataScreen /></Route>
      <Route><HomeScreen /></Route>
    </Switch>
    {/* Offered once the learner is in the app, never on top of the onboarding. */}
    <InstallSheet />
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}><App /></Suspense>
    <UpdatePrompt />
  </StrictMode>
);
