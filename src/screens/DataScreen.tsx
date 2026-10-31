import { Download, HardDriveDownload, Share2, Smartphone, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { BackupError, backupFileName, createBackup, importBackup, lastBackupAt, parseBackup, wipeUserData } from '@/data/backup';
import { db } from '@/db/db';
import { loadManifest } from '@/lib/content';

type Notice = { kind: 'ok' | 'error'; text: string } | null;

export function DataScreen() {
  const { t } = useTranslation();
  const [last, setLast] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { void lastBackupAt(db).then(setLast); }, []);

  const fmt = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  async function onExport() {
    setBusy(true);
    try {
      const manifest = await loadManifest().catch(() => null);
      const env = await createBackup(db, manifest?.contentVersion);
      const blob = new Blob([JSON.stringify(env)], { type: 'application/json' });
      const f = new File([blob], backupFileName(), { type: 'application/json' });
      setFile(f);
      setLast(env.exportedAt);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = f.name; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setNotice({ kind: 'ok', text: t('data.export.done') });
    } finally { setBusy(false); }
  }

  async function onShare() {
    if (!file) return;
    try { await navigator.share({ files: [file], title: 'TechLingo' }); } catch { /* cancelled or unsupported */ }
  }

  async function onImport(f: File) {
    setBusy(true);
    try {
      const env = await parseBackup(await f.text());
      const report = await importBackup(db, env);
      setNotice({ kind: 'ok', text: t('data.import.done', { added: report.added, updated: report.updated }) });
    } catch (e) {
      const code = e instanceof BackupError ? e.code : 'unknown';
      setNotice({ kind: 'error', text: t(`data.errors.${code}`) });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  async function onWipe() {
    if (!window.confirm(t('data.wipe.confirm'))) return;
    await wipeUserData(db);
    setLast(null);
    setNotice({ kind: 'ok', text: t('data.wipe.done') });
  }

  const canShareFile = !!file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  const steps = t('data.move.steps', { returnObjects: true }) as string[];

  return (
    <Screen title={t('data.title')} back="/">
      <p className="text-ink-2">{t('data.intro')}</p>
      <p className="mt-2 text-sm font-bold text-ink-2" aria-live="polite">{last ? t('data.lastBackup', { date: fmt(last) }) : t('data.neverBacked')}</p>

      {notice && (
        <div role="status" className={`mt-4 rounded-2xl px-4 py-3 font-bold ${notice.kind === 'ok' ? 'bg-mint text-mint-ink' : 'bg-danger-soft text-danger'}`}>{notice.text}</div>
      )}

      <Card className="mt-5">
        <h2 className="flex items-center gap-2 text-lg font-extrabold"><HardDriveDownload size={22} className="text-ocean" aria-hidden />{t('data.export.title')}</h2>
        <p className="mt-1 text-ink-2">{t('data.export.text')}</p>
        <Button className="mt-4" icon={<Download size={20} aria-hidden />} onClick={onExport} disabled={busy}>{t('data.export.action')}</Button>
        {canShareFile && <Button variant="secondary" className="mt-2" icon={<Share2 size={20} aria-hidden />} onClick={onShare}>{t('data.export.share')}</Button>}
      </Card>

      <Card className="mt-4">
        <h2 className="flex items-center gap-2 text-lg font-extrabold"><Upload size={22} className="text-ocean" aria-hidden />{t('data.import.title')}</h2>
        <p className="mt-1 text-ink-2">{t('data.import.text')}</p>
        <input ref={input} type="file" accept="application/json,.json" className="sr-only" id="backup-file" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onImport(f); }} />
        <Button variant="secondary" className="mt-4" icon={<Upload size={20} aria-hidden />} onClick={() => input.current?.click()} disabled={busy}>{t('data.import.action')}</Button>
      </Card>

      <Card className="mt-4">
        <h2 className="flex items-center gap-2 text-lg font-extrabold"><Smartphone size={22} className="text-ocean" aria-hidden />{t('data.move.title')}</h2>
        <ol className="mt-3 space-y-3">
          {steps.map((s, i) => (
            <li key={s} className="flex gap-3"><span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-ocean text-sm font-bold text-white">{i + 1}</span><span className="pt-0.5">{s}</span></li>
          ))}
        </ol>
      </Card>

      <Card className="mt-4">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-danger"><Trash2 size={22} aria-hidden />{t('data.wipe.title')}</h2>
        <p className="mt-1 text-ink-2">{t('data.wipe.text')}</p>
        <Button variant="danger" className="mt-4" onClick={onWipe}>{t('data.wipe.action')}</Button>
      </Card>
    </Screen>
  );
}
