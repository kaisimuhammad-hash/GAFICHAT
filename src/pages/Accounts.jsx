import { useState } from 'react';
import {
  BookOpen,
  Bot,
  CheckCircle2,
  Link2,
  MessageSquare,
  Pencil,
  Plus,
  QrCode,
  ShieldCheck,
  Smartphone,
  Unplug,
  UserRound,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  ModeToggle,
  StatusDot,
  Textarea,
  cn,
} from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { ACCOUNT_STATUS, formatPhone, timeAgo } from '../lib/format.js';

const STATUS_HINT = {
  connected: 'Siap menerima dan membalas pesan.',
  qr: 'Pindai QR dari WhatsApp di ponsel.',
  connecting: 'Menyiapkan sesi WhatsApp…',
  disconnected: 'Hubungkan nomor untuk mulai menerima pesan.',
};

function AccountCard({
  account,
  index,
  canEdit,
  onConnect,
  onShowQr,
  onLogout,
  onEdit,
  onKnowledge,
  onModeChange,
  onOpenInbox,
}) {
  const status = ACCOUNT_STATUS[account.status] || ACCOUNT_STATUS.disconnected;
  const connected = account.status === 'connected';
  const busy = account.status === 'connecting';
  const knowledge = String(account.knowledge || '').trim();
  const knowledgeLine = knowledge.split('\n')[0].slice(0, 46);

  return (
    <Card
      className={cn(
        'relative overflow-hidden p-5 transition',
        connected ? 'ring-1 ring-emerald-200' : 'hover:border-slate-300',
      )}
    >
      {connected && (
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-50 blur-3xl" />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'relative grid h-11 w-11 place-items-center rounded-2xl border',
              connected
                ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                : 'border-slate-200 bg-slate-100 text-slate-600',
            )}
          >
            <Smartphone className="h-5 w-5" />
            <StatusDot
              status={account.status}
              className="absolute -bottom-0.5 -right-0.5 ring-2 ring-white"
            />
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Slot {index + 1}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <h3 className="max-w-[150px] truncate text-sm font-semibold text-slate-900">
                {account.label}
              </h3>
              <button
                type="button"
                onClick={() => onEdit(account)}
                className="rounded p-0.5 text-slate-500 transition hover:text-slate-700"
                aria-label="Ubah nama akun"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
        <Badge tone={status.tone} dot>
          {status.label}
        </Badge>
      </div>

      <div className="relative mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="text-slate-500">Nomor</span>
          <span className={cn('font-medium', account.phone ? 'text-slate-700' : 'text-slate-500')}>
            {account.phone ? formatPhone(account.phone) : 'Belum tertaut'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="text-slate-500">Status sesi</span>
          <span className="text-slate-600">{STATUS_HINT[account.status]}</span>
        </div>
        {connected && account.connectedAt && (
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-500">Terhubung</span>
            <span className="text-slate-600">{timeAgo(account.connectedAt)}</span>
          </div>
        )}
        {account.hasCreds && !connected && (
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600/80">
            <ShieldCheck className="h-3 w-3" /> Sesi tersimpan di perangkat ini
          </div>
        )}
      </div>

      <div className="relative mt-3.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Mode balasan
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            {account.mode === 'bot' ? (
              <>
                <Bot className="h-3 w-3 text-red-500" /> AI membalas otomatis
              </>
            ) : (
              <>
                <UserRound className="h-3 w-3" /> Balasan manual
              </>
            )}
          </span>
        </div>
        <ModeToggle
          mode={account.mode}
          onChange={(mode) => onModeChange(account, mode)}
          size="sm"
        />
      </div>

      <div className="relative mt-3.5 flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 shrink-0 text-red-500/80" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Basis pengetahuan akun
            </p>
            <p className="truncate text-[11px] text-slate-600">
              {knowledge
                ? `${knowledgeLine}${knowledge.length > knowledgeLine.length ? '…' : ''} · ${knowledge.length}/12000`
                : 'Belum diisi — bot memakai basis pengetahuan umum'}
            </p>
          </div>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => onKnowledge(account)}
            className="shrink-0 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-red-200 hover:text-red-600"
          >
            {knowledge ? 'Ubah' : 'Isi'}
          </button>
        )}
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        {connected ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={MessageSquare}
              className="flex-1"
              onClick={() => onOpenInbox(account.id)}
            >
              Buka chat
            </Button>
            <Button variant="ghost" size="sm" icon={Unplug} onClick={() => onLogout(account)}>
              Putuskan
            </Button>
          </>
        ) : account.status === 'qr' ? (
          <>
            <Button size="sm" icon={QrCode} className="flex-1" onClick={() => onShowQr(account.id)}>
              Lihat QR
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onLogout(account)}>
              Batalkan
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              icon={busy ? undefined : account.hasCreds ? Link2 : Plus}
              className="flex-1"
              loading={busy}
              onClick={() => onConnect(account.id)}
            >
              {busy ? 'Menghubungkan…' : account.hasCreds ? 'Sambungkan ulang' : 'Hubungkan'}
            </Button>
            {account.status === 'disconnected' && account.hasCreds && (
              <Button variant="ghost" size="sm" onClick={() => onLogout(account)} title="Hapus sesi">
                Reset
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

export default function Accounts({
  state,
  onConnect,
  onShowQr,
  onOpenInbox,
  refresh,
  pushToast,
}) {
  const [editing, setEditing] = useState(null);
  const [label, setLabel] = useState('');
  const [savingLabel, setSavingLabel] = useState(false);
  const [kbTarget, setKbTarget] = useState(null);
  const [kbText, setKbText] = useState('');
  const [savingKb, setSavingKb] = useState(false);
  const [logoutTarget, setLogoutTarget] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const isAdmin = state.me?.role === 'admin';

  const startKnowledge = (account) => {
    setKbTarget(account);
    setKbText(account.knowledge || '');
  };

  const saveKnowledge = async () => {
    if (!kbTarget) return;
    setSavingKb(true);
    try {
      await api.updateAccount(kbTarget.id, { knowledge: kbText.trim() });
      await refresh();
      pushToast({
        type: 'success',
        title: 'Basis pengetahuan tersimpan',
        text: `Balasan otomatis ${kbTarget.label} memakai tambahan ini.`,
      });
      setKbTarget(null);
    } catch (err) {
      pushToast({ type: 'error', title: 'Gagal menyimpan pengetahuan', text: err.message });
    } finally {
      setSavingKb(false);
    }
  };

  const startEdit = (account) => {
    setEditing(account);
    setLabel(account.label);
  };

  const saveLabel = async () => {
    if (!editing || !label.trim()) return;
    setSavingLabel(true);
    try {
      await api.updateAccount(editing.id, { label: label.trim() });
      await refresh();
      pushToast({ type: 'success', title: 'Nama akun diperbarui' });
      setEditing(null);
    } catch (err) {
      pushToast({ type: 'error', title: 'Gagal menyimpan nama', text: err.message });
    } finally {
      setSavingLabel(false);
    }
  };

  const changeMode = async (account, mode) => {
    try {
      await api.updateAccount(account.id, { mode });
      await refresh();
      pushToast({
        type: 'info',
        title: `${account.label} → ${mode === 'bot' ? 'Mode AI' : 'Mode manual'}`,
        text:
          mode === 'bot'
            ? 'Pesan masuk di chat pribadi akan dibalas otomatis.'
            : 'Semua balasan akan dikirim manual dari dashboard.',
      });
    } catch (err) {
      pushToast({ type: 'error', title: 'Gagal mengubah mode', text: err.message });
    }
  };

  const confirmLogout = async () => {
    if (!logoutTarget) return;
    setLoggingOut(true);
    try {
      await api.logout(logoutTarget.id);
      await refresh();
      pushToast({
        type: 'success',
        title: 'Sesi diputuskan',
        text: `${logoutTarget.label} perlu ditautkan ulang dengan QR.`,
      });
      setLogoutTarget(null);
    } catch (err) {
      pushToast({ type: 'error', title: 'Gagal memutuskan sesi', text: err.message });
    } finally {
      setLoggingOut(false);
    }
  };

  const aiAccounts = state.accounts.filter((account) => account.mode === 'bot').length;

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-600/70">
            Koneksi WhatsApp
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px]">
            Tiga nomor, satu dashboard
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Tautkan nomor lewat perangkat tertaut WhatsApp. Sesi tersimpan aman secara lokal.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge tone="emerald" dot>
            {state.stats.connected} terhubung
          </Badge>
          <Badge tone="red">
            <Bot className="h-3 w-3" /> {aiAccounts} mode AI
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.accounts.map((account, index) => (
          <AccountCard
            key={account.id}
            account={account}
            index={index}
            canEdit={isAdmin}
            onConnect={onConnect}
            onShowQr={onShowQr}
            onLogout={setLogoutTarget}
            onEdit={startEdit}
            onKnowledge={startKnowledge}
            onModeChange={changeMode}
            onOpenInbox={onOpenInbox}
          />
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-red-50 text-red-600">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Cara menautkan nomor</h2>
            <p className="text-[11px] text-slate-500">Satu nomor WhatsApp untuk satu slot.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ['1', 'Hubungkan', 'Klik Hubungkan pada slot, lalu tunggu kode QR muncul.'],
            ['2', 'Pindai QR', 'Di WhatsApp ponsel: Perangkat tertaut → Tautkan perangkat.'],
            ['3', 'Atur mode', 'Pilih AI untuk balasan otomatis, atau manual untuk kendali penuh.'],
          ].map(([step, title, description]) => (
            <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">
                  {step}
                </span>
                <p className="text-xs font-semibold text-slate-700">{title}</p>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{description}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200 pt-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-red-500/80" /> Bot AI hanya membalas chat pribadi
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-red-500/80" /> Mode manual bisa diatur per percakapan
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-red-500/80" /> Riwayat 4.000 pesan terakhir disimpan
          </span>
        </div>
      </Card>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Ubah nama akun"
        description="Nama ini hanya tampil di dashboard, tidak memengaruhi WhatsApp."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={savingLabel}>
              Batal
            </Button>
            <Button onClick={saveLabel} loading={savingLabel} disabled={!label.trim()}>
              Simpan
            </Button>
          </>
        }
      >
        <Field label="Nama akun">
          <Input
            value={label}
            maxLength={40}
            autoFocus
            onChange={(event) => setLabel(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && saveLabel()}
            placeholder="Contoh: CS Utama"
          />
        </Field>
      </Modal>

      <Modal
        open={!!kbTarget}
        onClose={() => (savingKb ? null : setKbTarget(null))}
        title={`Basis pengetahuan ${kbTarget?.label || 'akun'}`}
        description="Info khusus nomor ini, dipakai bot saat membalas chat di slot tersebut."
        footer={
          <>
            <Button variant="ghost" onClick={() => setKbTarget(null)} disabled={savingKb}>
              Batal
            </Button>
            <Button onClick={saveKnowledge} loading={savingKb} icon={BookOpen}>
              Simpan
            </Button>
          </>
        }
      >
        <Field
          label="Pengetahuan khusus akun"
          hint="Dipakai hanya untuk nomor ini. Jika diisi, bot tidak memakai basis pengetahuan umum."
        >
          <Textarea
            rows={10}
            autoFocus
            value={kbText}
            maxLength={12000}
            onChange={(event) => setKbText(event.target.value)}
            placeholder={
              'Contoh:\nNomor ini khusus tim Grosir. Katalog grosir: https://…\nMinimal pembelian grosir 12 pcs.\nBalasan di luar jam 08.00–17.00 WIB dijawab besok pagi.'
            }
            className="text-[12px]"
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-500">
            <span>Perubahan langsung dipakai untuk balasan berikutnya.</span>
            <span className="shrink-0">{kbText.length}/12000</span>
          </div>
        </Field>
      </Modal>

      <ConfirmDialog
        open={!!logoutTarget}
        onClose={() => setLogoutTarget(null)}
        onConfirm={confirmLogout}
        loading={loggingOut}
        title="Putuskan sesi WhatsApp?"
        description={`${logoutTarget?.label || 'Nomor ini'} akan dikeluarkan dari dashboard dan harus ditautkan ulang dengan QR. Riwayat chat tetap tersimpan.`}
        confirmLabel="Putuskan sesi"
      />
    </div>
  );
}
