import { useState } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  MessageSquareCode,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import { Button, Field, Input, cn } from '../components/ui.jsx';
import { api } from '../lib/api.js';

const FEATURES = [
  { icon: Users, title: 'Multi-pengguna', text: 'Admin dan agen masuk dengan akun masing-masing.' },
  { icon: ShieldCheck, title: 'Akses berjenjang', text: 'Agen hanya mengelola chat dan tiket.' },
  { icon: MessageSquareCode, title: 'Realtime', text: 'Semua pengguna melihat percakapan yang sama.' },
];

export default function Auth({ mode = 'login', onAuthenticated }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isSetup = mode === 'setup';

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (isSetup) {
      if (password.length < 8) {
        setError('Password minimal 8 karakter.');
        return;
      }
      if (password !== confirm) {
        setError('Konfirmasi password tidak cocok.');
        return;
      }
    }
    setLoading(true);
    try {
      if (isSetup) {
        await api.setupAdmin({ name, username, password });
      } else {
        await api.login(username, password);
      }
      const session = await api.authStatus();
      onAuthenticated(session.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-red-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-rose-100/60 blur-3xl" />

      <div className="glass-strong relative grid w-full max-w-4xl overflow-hidden rounded-[28px] shadow-[0_40px_120px_-60px_rgba(190,18,60,0.55)] lg:grid-cols-[1.05fr_1fr]">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-red-600 via-red-600 to-rose-600 p-8 text-white lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                <MessageSquareCode className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-bold tracking-tight">NexaDesk</p>
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-white/70">
                  WhatsApp AI Suite
                </p>
              </div>
            </div>
            <h1 className="mt-10 text-[26px] font-semibold leading-snug tracking-tight">
              Satu dashboard,
              <br />
              tim yang terhubung.
            </h1>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/75">
              Kelola percakapan, tiket, dan balasan AI dengan kontrol akses yang jelas untuk admin
              dan agen.
            </p>
          </div>

          <div className="space-y-3">
            {FEATURES.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/15">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-white/70">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-9">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-[0_12px_30px_-12px_rgba(220,38,38,0.7)]">
              <MessageSquareCode className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">NexaDesk</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-red-600/70">
                WhatsApp AI Suite
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-red-600/70">
              {isSetup ? 'Penyiapan awal' : 'Selamat datang kembali'}
            </p>
            <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-slate-900">
              {isSetup ? 'Buat akun admin pertama' : 'Masuk ke dashboard'}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              {isSetup
                ? 'Akun ini akan mengelola pengguna dan seluruh pengaturan. Setelah dibuat, admin dapat menambahkan akun agen.'
                : 'Gunakan username dan password yang diberikan admin.'}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {isSetup && (
              <Field label="Nama lengkap" htmlFor="auth-name">
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="auth-name"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="pl-9"
                    required
                  />
                </div>
              </Field>
            )}

            <Field label="Username" htmlFor="auth-username">
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="auth-username"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="contoh: budi"
                  className="pl-9 lowercase"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                />
              </div>
            </Field>

            <Field
              label="Password"
              htmlFor="auth-password"
              hint={isSetup ? 'Minimal 8 karakter. Simpan di tempat yang aman.' : undefined}
            >
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSetup ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            {isSetup && (
              <Field label="Ulangi password" htmlFor="auth-confirm">
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="auth-confirm"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    placeholder="••••••••"
                    className="pl-9"
                    required
                  />
                </div>
              </Field>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] leading-relaxed text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full"
              icon={loading ? undefined : ArrowRight}
            >
              {isSetup ? 'Buat admin & masuk' : 'Masuk'}
            </Button>
          </form>

          <p
            className={cn(
              'mt-5 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[10px] leading-relaxed',
              'border-slate-200 bg-slate-50 text-slate-500',
            )}
          >
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500/70" />
            {isSetup
              ? 'Tidak ada akun bawaan. Admin pertama dibuat di perangkat ini dan hanya tersimpan lokal.'
              : 'Lupa password? Minta admin mereset password akun Anda dari halaman Pengguna.'}
          </p>
        </div>
      </div>
    </div>
  );
}
