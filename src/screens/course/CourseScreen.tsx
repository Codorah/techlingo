import { Check, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'wouter';
import { CourseMap } from '@/components/course/CourseMap';
import { NotFound } from '@/components/NotFound';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { type CourseNode, courseStates } from '@/learning/course';
import { useCourse } from '@/lib/useCourse';
import { accentStyle } from '@/screens/path/ThemeScreen';

export const courseNodeHref = (role: string, node: CourseNode) => (node.kind === 'interview' && node.questionId
  ? `/career/q/${node.questionId}?node=${encodeURIComponent(node.id)}&back=${encodeURIComponent(`/parcours/${role}`)}`
  : `/parcours/${role}/${encodeURIComponent(node.id)}`);

/** The map of one job course: situation units, recall units and the mock interview. */
export function CourseScreen() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { role } = useParams<{ role: string }>();
  const { course, meta, domain, progress, missing, stats } = useCourse(role);

  if (missing) return <NotFound />;
  if (!course || !meta || !stats) return <MapSkeleton />;
  const states = courseStates(course, progress);

  return (
    <div style={accentStyle(domain)}>
      <CourseMap title={meta.name_fr} icon={<DynamicIcon name={meta.icon} size={22} />} back="/" done={stats.done} total={stats.total}
        units={course.units.map((u) => ({ ...u, states }))}
        onOpen={(node) => navigate(courseNodeHref(role, node))}
        aside={
          <div className="rounded-2xl border-2 border-line bg-surface p-5">
            <p className="text-sm font-bold text-ink-2">{meta.description_fr}</p>
            <p className="mt-3 text-3xl font-black text-[var(--accent)]">{Math.round(stats.ratio * 100)} %</p>
            <p className="text-sm text-ink-2">{t('course.stepsDone', { done: stats.done, total: stats.total })}</p>
            <ol className="mt-4 grid gap-1.5">
              {course.units.map((u) => {
                const done = u.nodes.every((n) => progress[n.id]);
                return (
                  <li key={u.id} className={`flex items-start gap-2 text-sm ${stats.unit === u ? 'font-black text-ink' : 'text-ink-2'}`}>
                    {done ? <Check size={18} className="mt-0.5 flex-none text-mint-strong" aria-hidden /> : <Circle size={18} className="mt-0.5 flex-none" aria-hidden />}
                    <span>{u.number}. {u.title}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        } />
    </div>
  );
}

/** Skeleton shaped like the map (banner + winding nodes) so loading never looks broken. */
export function MapSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="min-h-dvh bg-mist" aria-busy="true" aria-label={t('common.loading')}>
      <div className="h-[60px] border-b-2 border-line bg-surface" />
      <div className="mx-auto max-w-[560px] px-5 pt-5">
        <div className="skeleton h-28 w-full" />
        <div className="mt-8 flex flex-col items-center gap-7">
          {[0, 52, 78, 52, 0].map((x, i) => <div key={i} className="skeleton h-[76px] w-[76px] !rounded-full" style={{ transform: `translateX(${x}px)` }} />)}
        </div>
      </div>
    </div>
  );
}
