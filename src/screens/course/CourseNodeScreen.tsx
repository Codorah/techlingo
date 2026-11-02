import { useRef, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { NotFound } from '@/components/NotFound';
import type { PathTerm } from '@/content/schema';
import { completeNode } from '@/data/path';
import { useCourse } from '@/lib/useCourse';
import { sounds } from '@/lib/sound';
import { accentStyle } from '@/screens/path/ThemeScreen';
import { Done, Guide, Lesson } from '@/screens/situations/SituationScreen';
import { useTranslation } from 'react-i18next';
import { MapSkeleton } from './CourseScreen';
import { RecallSession } from './RecallSession';

/** One step of a job course: a unit guide, a situation lesson or a spoken recall. */
export function CourseNodeScreen() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const params = useParams<{ role: string; nodeId: string }>();
  const nodeId = decodeURIComponent(params.nodeId);
  const { course, path, domain, missing } = useCourse(params.role);
  const [recallDone, setRecallDone] = useState<{ xp: number; accuracy: number; firstTime: boolean } | null>(null);
  const recording = useRef(false);
  const back = () => navigate(`/parcours/${params.role}`, { replace: true });

  if (missing) return <NotFound />;
  if (!course || !path) return <MapSkeleton />;
  const node = course.nodes.find((n) => n.id === nodeId);
  if (!node) return <NotFound />;

  let view: React.ReactNode = <NotFound />;
  if (node.kind === 'guide' && node.unitIndex != null) {
    view = <Guide unit={path.units[node.unitIndex]!} nodeId={node.id} onClose={back} />;
  } else if (node.kind === 'lesson' && node.unitIndex != null && node.lessonIndex != null) {
    view = <Lesson path={path} lesson={path.units[node.unitIndex]!.lessons[node.lessonIndex]!} nodeId={node.id} onClose={back} />;
  } else if (node.kind === 'recall') {
    const terms = (node.termIds ?? []).map((id) => path.terms[id]).filter((x): x is PathTerm => !!x);
    view = recallDone
      ? <Done xp={recallDone.xp} title={t('recall.done')} accuracy={recallDone.accuracy} confetti={recallDone.firstTime} replay={!recallDone.firstTime} onContinue={back} />
      : <RecallSession terms={terms} onClose={back} onDone={async ({ results, correct, total }) => {
          if (recording.current) return; // recorded once, even on a double tap
          recording.current = true;
          const r = await completeNode(node.id, 'recap', results, { correct, total });
          navigator.vibrate?.([12, 40, 12]);
          sounds.celebrate();
          setRecallDone({ ...r, accuracy: Math.round((correct / Math.max(1, total)) * 100) });
        }} />;
  }
  return <div style={accentStyle(domain)} className="min-h-dvh bg-mist">{view}</div>;
}
