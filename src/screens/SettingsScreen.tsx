import { useLiveQuery } from 'dexie-react-hooks';
import { Bell, Briefcase, ChevronRight, Database, FileText, HelpCircle, Moon, Shield, Trash2, UserRound, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { LEVELS, type Level } from '@/content/levels';
import { getRetention, saveProfile, setSetting } from '@/data/progress';
import { db } from '@/db/db';
import { domainOf } from '@/lib/domains';
import {
  type NotificationStatus,
  notificationsEnabled,
  notificationStatus,
  requestNotificationPermission,
  setNotificationsEnabled,
  showLocalNotification
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
  const [notifOn, setNotifOn] = useState(notificationsEnabled);
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

  async function toggleNotifications() {
    if (notifOn) {
      setNotificationsEnabled(false);
      setNotifOn(false);
      return;
    }
    const perm = await requestNotificationPermission();
    setNotifPerm(perm);
    if (perm === 'granted') {
      setNotificationsEnabled(true);
      setNotifOn(true);
      if (!profile?.reminderTime) await saveProfile({ reminderTime: '18:30' });
      void showLocalNotification(t('settings.notifications.testTitle'), t('settings.notifications.testBody'));
    }
  }

  return (
    <div style={accentStyle(domain)}>
      <Screen title={t('settings.title')} back="/profile">
        <Card>
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><UserRound size={20} className="text-[var(--accent)]" aria-hidden />{t('settings.identity')}</h2>
          <label className="mt-3 block">
            <span className="text-sm font-bold text-ink-2">{t('settings.displayName')}</span>
            <input type="text" value={name} maxLength={32} onChange={(e) => setName(e.target.value)}
              onBlur={() => void saveProfile({ displayName: name.trim() })}
              placeholder={t('settings.displayNamePlaceholder')}
              className="mt-1.5 min-h-12 w-full rounded-xl border-2 border-line bg-surface px-3.5 font-bold outline-none focus:border-[var(--accent)]" />
          </label>
          <p className="mt-4 text-sm font-bold text-ink-2">{t('settings.avatar')}</p>
          <div className="mt-2 flex flex-wrap gap-2.5" role="radiogroup" aria-label={t('settings.avatar')}>
            {AVATARS.map((av) => (
              <button key={av} type="button" role="radio" aria-checked={profile.avatar === av}
                onClick={() => void saveProfile({ avatar: av })}
                className={`rounded-full p-1 transition-transform ${profile.avatar === av ? 'ring-3 ring-[var(--accent)] scale-105' : 'opacity-80'}`}>
                <Avatar id={av} name={profile.displayName || 'T'} size={44} />
              </button>
            ))}
          </div>
        </Card>

        <h2 className="mt-6 text-lg font-extrabold">{t('profile.level')}</h2>
        <div role="radiogroup" aria-label={t('profile.editLevel')} className="mt-2.5 grid grid-cols-5 gap-2">
          {LEVELS.map((l: Level) => (
            <button key={l} type="button" role="radio" aria-checked={profile.level === l} onClick={() => void saveProfile({ level: l })}
              className={`min-h-12 rounded-xl border-2 font-title font-black ${profile.level === l ? 'border-[var(--accent)] bg-[var(--accent)] text-on-ocean' : 'border-line bg-surface text-ink-2'}`}>{l}</button>
          ))}
        </div>

        <h2 className="mt-6 text-lg font-extrabold">{t('profile.retention')}</h2>
        <p className="text-sm text-ink-2">{t('profile.retentionText')}</p>
        <div role="radiogroup" aria-label={t('profile.retention')} className="mt-2.5 grid grid-cols-4 gap-2">
          {RETENTIONS.map((r) => (
            <button key={r} type="button" role="radio" aria-checked={retention === r} onClick={() => { setRetention(r); void setSetting('retention', r); }}
              className={`min-h-12 rounded-xl border-2 font-bold ${retention === r ? 'border-[var(--accent)] bg-[var(--accent)] text-on-ocean' : 'border-line bg-surface text-ink-2'}`}>{Math.round(r * 100)} %</button>
          ))}
        </div>

        <Card className="mt-6">
          <div className="flex items-center gap-3">
            <Bell size={22} className="text-[var(--accent)]" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-extrabold">{t('settings.notifications.title')}</p>
              <p className="text-sm text-ink-2">{t('settings.notifications.text')}</p>
            </div>
            {notifPerm !== 'unsupported' && (
              <button type="button" role="switch" aria-checked={notifOn} aria-label={t('settings.notifications.title')}
                onClick={() => void toggleNotifications()}
                className={`relative h-8 w-14 flex-none rounded-full transition-colors ${notifOn ? 'bg-[var(--accent)]' : 'bg-line'}`}>
                <span className={`absolute left-0 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${notifOn ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            )}
          </div>
          {notifPerm === 'unsupported' && <p className="mt-2 text-sm text-ink-2">{t('settings.notifications.unsupported')}</p>}
          {notifPerm === 'denied' && <p className="mt-2 text-sm text-danger">{t('settings.notifications.denied')}</p>}
          {notifOn && (
            <div className="mt-4">
              <p className="text-sm font-bold text-ink-2">{t('settings.notifications.hour')}</p>
              <div className="mt-2 grid grid-cols-4 gap-2" role="radiogroup" aria-label={t('settings.notifications.hour')}>
                {REMINDER_TIMES.map((tm) => {
                  const active = (profile.reminderTime ?? '18:30') === tm;
                  return (
                    <button key={tm} type="button" role="radio" aria-checked={active}
                      onClick={() => void saveProfile({ reminderTime: tm })}
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
        </Card>

        <Card className="mt-5 p-1">
          <Link href="/settings/roles" className="flex min-h-14 items-center gap-3 rounded-2xl px-3">
            <Briefcase size={22} className="text-[var(--accent)]" aria-hidden />
            <span className="flex-1"><span className="block font-bold">{t('roles.title')}</span><span className="block text-sm text-ink-2">{domainName} · {roleNames.join(', ')}</span></span>
            <ChevronRight size={20} className="text-ink-2" aria-hidden />
          </Link>
          <div className="mx-3 h-0.5 bg-line" />
          <div className="flex min-h-14 items-center gap-3 px-3">
            <Volume2 size={22} className="text-[var(--accent)]" aria-hidden />
            <span className="flex-1 font-bold">{t('profile.sound')}</span>
            <button type="button" role="switch" aria-checked={sound} aria-label={t('profile.sound')}
              onClick={() => { const next = !sound; setSound(next); setSoundEnabled(next); if (next) sounds.correct(); }}
              className={`relative h-8 w-14 flex-none rounded-full transition-colors ${sound ? 'bg-[var(--accent)]' : 'bg-line'}`}>
              <span className={`absolute left-0 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${sound ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="mx-3 h-0.5 bg-line" />
          <div className="flex min-h-14 items-center gap-3 px-3">
            <Moon size={22} className="text-[var(--accent)]" aria-hidden />
            <span className="flex-1 font-bold">{t('profile.theme')}</span>
            <button type="button" role="switch" aria-checked={dark} aria-label={t('profile.theme')} onClick={toggleTheme}
              className={`relative h-8 w-14 flex-none rounded-full transition-colors ${dark ? 'bg-[var(--accent)]' : 'bg-line'}`}>
              <span className={`absolute left-0 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${dark ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </Card>

        <Card className="mt-5 p-1">
          <Link href="/settings/help" className="flex min-h-14 items-center gap-3 rounded-2xl px-3">
            <HelpCircle size={22} className="text-[var(--accent)]" aria-hidden />
            <span className="flex-1"><span className="block font-bold">{t('help.title')}</span><span className="block text-sm text-ink-2">{t('settings.helpText')}</span></span>
            <ChevronRight size={20} className="text-ink-2" aria-hidden />
          </Link>
          <div className="mx-3 h-0.5 bg-line" />
          <Link href="/settings/data" className="flex min-h-14 items-center gap-3 rounded-2xl px-3">
            <Database size={22} className="text-[var(--accent)]" aria-hidden />
            <span className="flex-1"><span className="block font-bold">{t('profile.data')}</span><span className="block text-sm text-ink-2">{t('profile.dataText')}</span></span>
            <ChevronRight size={20} className="text-ink-2" aria-hidden />
          </Link>
          <div className="mx-3 h-0.5 bg-line" />
          <a href="/legal/confidentialite.html" className="flex min-h-14 items-center gap-3 rounded-2xl px-3">
            <Shield size={22} className="text-[var(--accent)]" aria-hidden />
            <span className="flex-1 font-bold">{t('help.privacy')}</span>
            <ChevronRight size={20} className="text-ink-2" aria-hidden />
          </a>
          <div className="mx-3 h-0.5 bg-line" />
          <a href="/legal/conditions.html" className="flex min-h-14 items-center gap-3 rounded-2xl px-3">
            <FileText size={22} className="text-[var(--accent)]" aria-hidden />
            <span className="flex-1 font-bold">{t('settings.terms')}</span>
            <ChevronRight size={20} className="text-ink-2" aria-hidden />
          </a>
        </Card>

        <Card className="mt-5 border-danger/40">
          <div className="flex items-start gap-3">
            <Trash2 size={22} className="mt-0.5 flex-none text-danger" aria-hidden />
            <div className="flex-1">
              <p className="font-extrabold text-danger">{t('settings.deleteAccount.title')}</p>
              <p className="mt-0.5 text-sm text-ink-2">{t('settings.deleteAccount.text')}</p>
              <Link href="/settings/data" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-danger-soft px-4 text-sm font-extrabold text-danger">
                {t('settings.deleteAccount.cta')}
              </Link>
            </div>
          </div>
        </Card>

        <p className="mt-6 text-center text-xs font-bold text-ink-2">TechLingo v1.0 · {t('settings.ageRating')}</p>
      </Screen>
    </div>
  );
}

