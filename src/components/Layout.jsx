import { useState } from 'react';
import {
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Settings as SettingsIcon,
  Smartphone,
  Sparkles,
  Ticket,
  Users as UsersIcon,
  X,
} from 'lucide-react';
import { Avatar, IconButton, StatusDot, ToastStack, cn } from './ui.jsx';
import { formatFullDate } from '../lib/format.js';

const NAV = [
  { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard, adminOnly: true },
  { id: 'inbox', label: 'Percakapan', icon: MessagesSquare, badge: 'unread' },
  { id: 'tickets', label: 'Tiket', icon: Ticket, badge: 'tickets' },
  { id: 'accounts', label: 'Akun WhatsApp', icon: Smartphone, adminOnly: true },
  { id: 'users', label: 'Pengguna', icon: UsersIcon, adminOnly: true },
  { id: 'settings', label: 'Pengaturan AI', icon: SettingsIcon, adminOnly: true },
];

const PAGE_META = {
  overview: { title: 'Ringkasan', subtitle: 'Pantau performa percakapan dan tim.' },
  inbox: { title: 'Percakapan', subtitle: 'Balas chat dengan AI atau secara manual.' },
  tickets: { title: 'Tiket', subtitle: 'Kelola keluhan dan permintaan pelanggan.' },
  accounts: { title: 'Akun WhatsApp', subtitle: 'Hubungkan hingga tiga nomor dalam satu dashboard.' },
  users: { title: 'Pengguna', subtitle: 'Kelola akun admin dan agen dashboard.' },
  settings: { title: 'Pengaturan AI', subtitle: 'Konfigurasi Gemini dan persona balasan otomatis.' },
};

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-rose-600 shadow-[0_12px_30px_-12px_rgba(220,38,38,0.7)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2h11A2.5 2.5 0 0 1 20 4.5v9a2.5 2.5 0 0 1-2.5 2.5H11l-4.6 3.7c-.66.53-1.4-.02-1.4-.85V16A2.5 2.5 0 0 1 4 13.5z" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-200" />
      </div>
      <div>
        <p className="text-[15px] font-bold tracking-tight text-slate-900">NexaDesk</p>
        <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-red-600/70">
          WhatsApp AI Suite
        </p>
      </div>
    </div>
  );
}

function SidebarContent({ state, page, onNavigate, me, isAdmin, onLogout, onChangePassword }) {
  const unread = state.stats.unread || 0;
  const openTickets = state.stats.openTickets || 0;
  const hasKey = state.settings.hasKey;
  const roleLabel = isAdmin ? 'Admin' : 'Agen';
  const navItems = NAV.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Brand />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active = page === item.id;
          const count = item.badge === 'unread' ? unread : item.badge === 'tickets' ? openTickets : 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition',
                active
                  ? 'bg-red-50 font-semibold text-red-700 shadow-[inset_0_0_0_1px_rgba(220,38,38,0.08)]'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-red-600" />
              )}
              <item.icon
                className={cn(
                  'h-[17px] w-[17px] transition',
                  active ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-600',
                )}
              />
              <span className="flex-1">{item.label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    'min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold',
                    item.badge === 'unread'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700',
                  )}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="space-y-2 p-3">
        {isAdmin && (
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="glass w-full rounded-2xl p-3 text-left transition hover:border-slate-300"
          >
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Mesin AI
                </p>
                <p className="truncate text-xs font-semibold text-slate-800">
                  {hasKey ? state.settings.geminiModel : 'Belum aktif'}
                </p>
              </div>
              <StatusDot status={hasKey ? 'connected' : 'disconnected'} />
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
              {hasKey ? 'Balasan otomatis siap digunakan.' : 'Tambahkan API key Gemini untuk mengaktifkan bot.'}
            </p>
          </button>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-2.5">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Avatar name={me?.name || 'Pengguna'} size="sm" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">{me?.name || 'Pengguna'}</p>
              <p className="truncate text-[10px] text-slate-500">
                {roleLabel} · @{me?.username}
              </p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={onChangePassword}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <KeyRound className="h-3 w-3" />
              Password
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-[10px] font-medium text-red-600 transition hover:bg-red-100"
            >
              <LogOut className="h-3 w-3" />
              Keluar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Layout({
  state,
  me,
  isAdmin,
  online = [],
  page,
  onNavigate,
  onLogout,
  onChangePassword,
  toasts,
  onDismissToast,
  children,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = PAGE_META[page] || PAGE_META.overview;
  const navigate = (next) => {
    onNavigate(next);
    setMobileOpen(false);
  };
  const sidebarProps = {
    state,
    page,
    onNavigate: navigate,
    me,
    isAdmin,
    onLogout,
    onChangePassword,
  };

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-slate-200 bg-white/90 backdrop-blur-xl lg:block">
        <SidebarContent {...sidebarProps} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="animate-pop relative h-full w-[270px] border-r border-slate-200 bg-white">
            <IconButton
              label="Tutup menu"
              className="absolute right-2 top-4 z-10"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </IconButton>
            <SidebarContent {...sidebarProps} />
          </div>
        </div>
      )}

      <div className="flex min-h-dvh flex-col lg:pl-[248px]">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-3 sm:px-4 lg:px-8">
            <IconButton label="Buka menu" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </IconButton>

            <div className="min-w-0">
              <p className="hidden text-[9px] font-semibold uppercase tracking-[0.26em] text-slate-400 sm:block">
                {formatFullDate()}
              </p>
              <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-[15px]">{meta.title}</h1>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 md:flex">
                <div className="flex -space-x-0.5">
                  {state.accounts.map((acc) => (
                    <span
                      key={acc.id}
                      className="grid h-5 w-5 place-items-center"
                      title={`${acc.label} · ${acc.status}`}
                    >
                      <StatusDot status={acc.status} className="h-1.5 w-1.5" />
                    </span>
                  ))}
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  {state.stats.connected}/{state.stats.accounts} terhubung
                </span>
              </div>

              <div
                className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-500 sm:flex"
                title="Pengguna yang sedang online"
              >
                <UsersIcon className="h-3.5 w-3.5 text-emerald-500" />
                {online.length} online
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onNavigate('settings')}
                  className="hidden items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-600 transition hover:bg-red-100 sm:flex"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="max-w-[130px] truncate">
                    {state.settings.hasKey ? state.settings.geminiModel : 'AI belum aktif'}
                  </span>
                </button>
              )}

              <div
                className="ml-1 flex items-center gap-2"
                title={`${me?.name || 'Pengguna'} · ${isAdmin ? 'Admin' : 'Agen'}`}
              >
                <Avatar
                  name={me?.name || 'Pengguna'}
                  size="sm"
                  className="h-8 w-8 rounded-xl text-[10px]"
                />
              </div>
            </div>
          </div>
        </header>

        <main
          className={cn(
            'flex-1',
            page === 'inbox'
              ? 'px-2 pb-2 pt-2 sm:px-3 sm:pb-3 lg:px-8 lg:pb-6 lg:pt-5'
              : 'mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-5 lg:px-8 lg:py-7',
          )}
        >
          {page === 'inbox' ? (
            <div className="h-[calc(100dvh-5rem)] lg:h-[calc(100dvh-6.75rem)]">{children}</div>
          ) : (
            children
          )}
        </main>
      </div>

      <ToastStack toasts={toasts} onDismiss={onDismissToast} />
    </div>
  );
}

export { NAV };
