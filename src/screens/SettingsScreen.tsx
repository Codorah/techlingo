import { useLiveQuery } from 'dexie-react-hooks';
import { Bell, Brain, Briefcase, ChevronRight, Database, Download, FileText, HelpCircle, Moon, Shield, Trash2, UserRound, Volume2 } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { openInstallSheet } from '@/app/InstallSheet';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { LEVELS, type Level } from '@/content/levels';
import { getRetention, saveProfile, setSetting } from '@/data/progress';
import { db } from '@/db/db';
import { domainOf } from '@/lib/domains';
import { isIOS, isStandalone } from '@/lib/install';
import {
  type NotificationStatus,
  notificationStatus,
  requestNotificationPermission,
  showLocalNotification,
  subscribePush,
  unsubscribePush
} from '@/lib/notifications';
import { setSoundEnabled, soundEnabled, sounds } from '@/lib/sound';
import { useContent } from '@/lib/useContent';
import { accentStyle } from '@/screens/path/ThemeScreen';

const RETENTIONS = [0.8, 0.85, 0.9, 0.95];
const AVATARS = ['sky', 'ocean', 'mint', 'sun', 'coral', 'violet'] as const;
const REMINDER_TIMES = ['08:00', '12:30', '18:30', '20:30'] as const;

export function SettingsScreen() {
  const { t } = useTranslation();
  const profile = useLiveQuery(() => db.profile.get('me'));
  const content = useContent([]);
  const [retention, setRetention] = useState(0.9);
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark');
  const [sound, setSound] = useState(soundEnabled);
  const [notifPerm, setNotifPerm] = useState<NotificationStatus>(notificationStatus);
  const [askingNotif, setAskingNotif] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => { void getRetention().then(setRetention); }, []);
  useEffect(() => { if (profile) setName(profile.displayName); }, [profile]);

  if (!profile) return null;
  const domain = domainOf(content.manifest, profile.primaryRole);
  const domainName = content.manifest?.domains?.find((d) => d.id === domain)?.name_fr ?? '';
  const roleNames = [profile.primaryRole, ...profile.secondaryRoles].map((id) => content.manifest?.roles.find((r) => r.id === id)?.name_fr ?? id);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    try { localStorage.setItem('techlingo.theme', next ? 'dark' : 'light'); } catch { /* storage unavailable */ }
  }

  // Reminders are on when the browser allows them AND a time is saved (profile.reminderTime is the only source).
  const notifOn = notifPerm === 'granted' && !!profile.reminderTime;
  const iosNeedsInstall = isIOS() && !isStandalone();

  async function enableNotifications() {
    setAskingNotif(false);
    const perm = await requestNotificationPermission();
    setNotifPerm(perm);
    if (perm !== 'granted') return;
    const time = profile?.reminderTime ?? '18:30';
    await saveProfile({ reminderTime: time });
    // Background reminders via Web Push; if unavailable, the in-app reminder stays the silent fallback.
    void subscribePush(time);
    void showLocalNotification(t('settings.notifications.testTitle'), t('settings.notifications.testBody'));
  }

  function toggleNotifications() {
    if (notifOn) {
      void saveProfile({ reminderTime: null });
      void unsubscribePush();
      return;
    }
    // Explain first, then let the browser ask (a refused prompt is hard to undo).
    if (notifPerm === 'default') setAskingNotif(true);
    else void enableNotifications();
  }

  function changeReminderTime(time: string) {
    void saveProfile({ reminderTime: time });
    void subscribePush(time);
  }

  return (
    <div style={accentStyle(domain)}>
      <Screen title={t('settings.title')} back="/profile">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
          <Group icon={<UserRound size={20} aria-hidden />} title={t('settings.identity')} summary={profile.displayName || undefined} defaultOpen>
            <label className="block">
              <span className="text-sm font-bold text-ink-2">{t('settings.displayName')}</span>
              <input type="text" value={name} maxLength={32} onChange={(e) => setName(e.target.value)}
                onBlur={() => void saveProfile({ displayName: name.trim() })}
                placeholder={t('settings.displayNamePlaceholder')}
                className="mt-1.5 min-h-12 w-full rounded-xl border-2 border-line bg-surface px-3.5 font-bold outline-none focus:border-[var(--accent)]" />
            </label>
            <p className="mt-4 text-sm font-bold text-ink-2">{t('settings.avatar')}</p>
            <div className="mt-2 flex flex-wrap gap-1" role="radiogroup" aria-label={t('settings.avatar')}>
              {AVATARS.map((av) => (
                <button key={av} type="button" role="radio" aria-checked={profile.avatar === av}
                  onClick={() => void saveProfile({ avatar: av })}
                  className={`rounded-full p-1 transition-transform ${profile.avatar === av ? 'ring-3 ring-[var(--accent)] scale-105' : 'opacity-80'}`}>
                  <Avatar id={av} name={profile.displayName || 'T'} size={38} />
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm font-bold text-ink-2">{t('profile.level')}</p>
            <div role="radiogroup" aria-label={t('profile.editLevel')} className="mt-2 grid grid-cols-5 gap-2">
              {LEVELS.map((l: Level) => (
                <button key={l} type="button" role="radio" aria-checked={profile.level === l} onClick={() => void saveProfile({ level: l })}
                  className={`min-h-11 rounded-xl border-2 font-title font-black ${profile.level === l ? 'border-[var(--accent)] bg-[var(--accent)] text-on-ocean' : 'border-line bg-surface text-ink-2'}`}>{l}</button>
              ))}
            </div>
            <Link href="/settings/roles" className="mt-4 flex min-h-12 items-center gap-3 rounded-xl border-2 border-line px-3 active:bg-mist">
              <Briefcase size={20} className="flex-none text-[var(--accent)]" aria-hidden />
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{t('roles.title')}</span><span className="block line-clamp-2 text-sm text-ink-2">{domainName} · {roleNames.join(', ')}</span></span>
              <ChevronRight size={18} className="flex-none text-ink-2" aria-hidden />
            </Link>
          </Group>

          <Group icon={<Bell size={20} aria-hidden />} title={t('settings.notifications.title')} summary={notifOn ? (profile.reminderTime ?? undefined) : undefined}>
            <div className="flex items-center gap-3">
              <p className="min-w-0 flex-1 text-sm text-ink-2">{t('settings.notifications.text')}</p>
              {notifPerm !== 'unsupported' && <Switch on={notifOn} label={t('settings.notifications.title')} onClick={toggleNotifications} />}
            </div>
            {iosNeedsInstall
              ? <p className="mt-2 text-sm text-ink-2">{t('settings.notifications.iosHint')}</p>
              : notifPerm === 'unsupported' && <p className="mt-2 text-sm text-ink-2">{t('settings.notifications.unsupported')}</p>}
            {notifPerm === 'denied' && <p className="mt-2 text-sm text-danger">{t('settings.notifications.denied')}</p>}
            {askingNotif && !notifOn && (
              <div className="mt-4 rounded-xl border-2 border-line p-3.5">
                <p className="text-sm">{t('settings.notifications.explain')}</p>
                <Button className="mt-3" onClick={() => void enableNotifications()}>{t('settings.notifications.explainCta')}</Button>
                <Button variant="ghost" onClick={() => setAskingNotif(false)}>{t('settings.notifications.explainLater')}</Button>
              </div>
            )}
            {notifOn && (
              <div className="mt-4">
                <p className="text-sm font-bold text-ink-2">{t('settings.notifications.hour')}</p>
                <div className="mt-2 grid grid-cols-4 gap-2" role="radiogroup" aria-label={t('settings.notifications.hour')}>
                  {REMINDER_TIMES.map((tm) => {
                    const active = (profile.reminderTime ?? '18:30') === tm;
                    return (
                      <button key={tm} type="button" role="radio" aria-checked={active}
                        onClick={() => changeReminderTime(tm)}
                        className={`min-h-11 rounded-xl border-2 text-sm font-bold ${active ? 'border-[var(--accent)] bg-[var(--accent)] text-on-ocean' : 'border-line bg-surface text-ink-2'}`}>
                        {tm}
                      </button>
                    );
                  })}
                </div>
                <Button variant="secondary" className="mt-3" onClick={() => void showLocalNotification(t('settings.notifications.testTitle'), t('settings.notifications.testBody'))}>
                  {t('settings.notifications.testCta')}
                </Button>
              </div>
            )}
          </Group>

          <Group icon={<Brain size={20} aria-hidden />} title={t('profile.retention')} summary={`${Math.round(retention * 100)} %`}>
            <p className="text-sm text-ink-2">{t('profile.retentionText')}</p>
            <div role="radiogroup" aria-label={t('profile.retention')} className="mt-2.5 grid grid-cols-4 gap-2">
              {RETENTIONS.map((r) => (
                <button key={r} type="button" role="radio" aria-checked={retention === r} onClick={() => { setRetention(r); void setSetting('retention', r); }}
                  className={`min-h-11 rounded-xl border-2 font-bold ${retention === r ? 'border-[var(--accent)] bg-[var(--accent)] text-on-ocean' : 'border-line bg-surface text-ink-2'}`}>{Math.round(r * 100)} %</button>
              ))}
            </div>
          </Group>

          <Card className="p-1">
            <div className="flex min-h-14 items-center gap-3 px-3">
              <Volume2 size={20} className="text-[var(--accent)]" aria-hidden />
              <span className="flex-1 font-bold">{t('profile.sound')}</span>
              <Switch on={sound} label={t('profile.sound')} onClick={() => { const next = !sound; setSound(next); setSoundEnabled(next); if (next) sounds.correct(); }} />
            </div>
            <div className="mx-3 h-0.5 bg-line" />
            <div className="flex min-h-14 items-center gap-3 px-3">
              <Moon size={20} className="text-[var(--accent)]" aria-hidden />
              <span className="flex-1 font-bold">{t('profile.theme')}</span>
              <Switch on={dark} label={t('profile.theme')} onClick={toggleTheme} />
            </div>
          </Card>

          <Group icon={<HelpCircle size={20} aria-hidden />} title={t('settings.moreTitle')}>
            <div className="-mx-1">
              {!isStandalone() && <Row onClick={openInstallSheet} icon={<Download size={20} aria-hidden />} title={t('install.title')} text={t('install.text')} />}
              <Row href="/settings/help" icon={<HelpCircle size={20} aria-hidden />} title={t('help.title')} text={t('settings.helpText')} />
              <Row href="/settings/data" icon={<Database size={20} aria-hidden />} title={t('profile.data')} text={t('profile.dataText')} />
              <Row href="/legal/confidentialite.html" external icon={<Shield size={20} aria-hidden />} title={t('help.privacy')} />
              <Row href="/legal/conditions.html" external icon={<FileText size={20} aria-hidden />} title={t('settings.terms')} />
            </div>
          </Group>

          <Group icon={<Trash2 size={20} aria-hidden />} title={t('settings.deleteAccount.title')} danger>
            <p className="text-sm text-ink-2">{t('settings.deleteAccount.text')}</p>
            <Link href="/settings/data" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-danger-soft px-4 text-sm font-extrabold text-danger">
              {t('settings.deleteAccount.cta')}
            </Link>
          </Group>
        </div>

        <p className="mt-6 text-center text-sm font-bold text-ink-2">TechLingo v1.0 · {t('settings.ageRating')}</p>
      </Screen>
    </div>
  );
}

function Switch({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick}
      className={`relative h-8 w-14 flex-none rounded-full before:absolute before:-inset-y-2 before:inset-x-0 before:content-[''] transition-colors ${on ? 'bg-[var(--accent)]' : 'bg-line'}`}>
      <span className={`absolute left-0 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-7' : 'translate-x-1'}`} />
    </button>
  );
}

/** Collapsible settings group: one line when closed, so the screen stays short. */
function Group({ icon, title, summary, defaultOpen, danger, children }: { icon: ReactNode; title: string; summary?: string; defaultOpen?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <details open={defaultOpen} className={`group rounded-[var(--radius-card)] border-2 bg-surface px-4 ${danger ? 'border-danger/40' : 'border-line'} [&_summary::-webkit-details-marker]:hidden`}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 py-2">
        <span className={danger ? 'text-danger' : 'text-[var(--accent)]'}>{icon}</span>
        <span className={`min-w-0 flex-1 truncate font-extrabold ${danger ? 'text-danger' : ''}`}>{title}</span>
        {summary && <span className="max-w-[40%] truncate text-sm font-bold text-ink-2">{summary}</span>}
        <ChevronRight size={18} className="flex-none text-ink-2 transition-transform group-open:rotate-90" aria-hidden />
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  );
}

function Row({ href, external, onClick, icon, title, text }: { href?: string; external?: boolean; onClick?: () => void; icon: ReactNode; title: string; text?: string }) {
  const body = (
    <>
      <span className="flex-none text-[var(--accent)]">{icon}</span>
      <span className="min-w-0 flex-1"><span className="block font-bold">{title}</span>{text && <span className="block line-clamp-2 text-sm text-ink-2">{text}</span>}</span>
      <ChevronRight size={18} className="flex-none text-ink-2" aria-hidden />
    </>
  );
  const cls = 'flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left active:bg-mist';
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{body}</button>;
  return external ? <a href={href} className={cls}>{body}</a> : <Link href={href!} className={cls}>{body}</Link>;
}
