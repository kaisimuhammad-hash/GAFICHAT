import { Badge, Button, Modal, Spinner, StatusDot } from './ui.jsx';
import { CheckCircle2, QrCode, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react';
import { ACCOUNT_STATUS } from '../lib/format.js';

export default function QrModal({ open, account, onClose, onRestart }) {
  const connected = account?.status === 'connected';
  const status = ACCOUNT_STATUS[account?.status] || ACCOUNT_STATUS.disconnected;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Tautkan ${account?.label || 'WhatsApp'}`}
      description="Pindai QR dari WhatsApp di ponsel untuk menghubungkan nomor ini."
      footer={
        <>
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
          <div className="flex-1" />
          <Button variant="ghost" onClick={onClose}>
            Tutup
          </Button>
          {!connected && (
            <Button variant="secondary" icon={RefreshCw} onClick={onRestart}>
              Mulai ulang
            </Button>
          )}
        </>
      }
    >
      {connected ? (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">Nomor berhasil terhubung</h3>
          <p className="mt-1 text-xs text-slate-500">
            {account?.phone ? `+${account.phone}` : account?.label} siap menerima dan membalas pesan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="mx-auto w-fit rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_20px_60px_-25px_rgba(220,38,38,0.55)]">
            {account?.qr ? (
              <img
                src={account.qr}
                alt="Kode QR WhatsApp"
                className="h-60 w-60 rounded-2xl sm:h-64 sm:w-64"
              />
            ) : (
              <div className="grid h-60 w-60 place-items-center rounded-2xl bg-slate-100 text-slate-500 sm:h-64 sm:w-64">
                <div className="flex flex-col items-center gap-3">
                  <Spinner className="h-6 w-6 text-red-600" />
                  <p className="text-xs font-medium">Menyiapkan QR…</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <QrCode className="h-3.5 w-3.5 text-red-600" />
              Cara menghubungkan
            </div>
            <ol className="mt-2.5 space-y-1.5 text-[11px] leading-relaxed text-slate-500">
              <li>1. Buka WhatsApp di ponsel, masuk ke menu Pengaturan.</li>
              <li>2. Ketuk Perangkat tertaut, lalu Tautkan perangkat.</li>
              <li>3. Arahkan kamera ponsel ke QR di atas.</li>
            </ol>
          </div>

          <div className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500/70" />
            QR diperbarui otomatis. Sesi disimpan lokal di folder data/ dan bisa diputuskan kapan saja.
          </div>

          {account?.status === 'disconnected' && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
              <Smartphone className="h-3.5 w-3.5" />
              Koneksi belum dimulai. Klik “Mulai ulang” untuk membuat sesi baru.
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
