import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  LogOut,
  MessageCircle,
  MessagesSquare,
  PlugZap,
  Settings,
  Smartphone,
  Sparkles,
  Ticket,
  TriangleAlert,
  UserPlus,
} from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ModeToggle,
  StatusDot,
  cn,
} from '../components/ui.jsx';
import {
  ACCOUNT_STATUS,
  PRIORITY,
  TICKET_STATUS,
  dayDivider,
  formatFullDate,
  formatNumber,
  formatPhone,
  shortDate,
  shortDay,
  timeAgo,
} from '../lib/format.js';

const STAT_TONES = {
  emerald: 'border-red-200 bg-red-50 text-red-600',
  sky: 'border-sky-200 bg-sky-50 text-sky-600',
  amber: 'border-amber-200 bg-amber-50 text-amber-600',
  violet: 'border-violet-200 bg-violet-50 text-violet-600',
};

function StatCard({ icon: Icon, label, value, hint, tone }) {
  return (
    <Card className="p-4 lg:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-[26px] font-semibold leading-none tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1.5 truncate text-[11px] text-slate-500">{hint}</p>
        </div>
        <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl border', STAT_TONES[tone])}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
    </Card>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const ACTIVITY_STYLES = {
  bot: { icon: Sparkles, className: 'bg-red-50 text-red-600' },
  ticket: { icon: Ticket, className: 'bg-amber-100 text-amber-600' },
  connect: { icon: PlugZap, className: 'bg-sky-50 text-sky-600' },
  logout: { icon: LogOut, className: 'bg-slate-100 text-slate-600' },
  error: { icon: TriangleAlert, className: 'bg-red-50 text-red-600' },
  settings: { icon: Settings, className: 'bg-violet-50 text-violet-600' },
  message: { icon: MessageCircle, className: 'bg-sky-50 text-sky-600' },
  user: { icon: UserPlus, className: 'bg-emerald-50 text-emerald-600' },
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 19) return 'Selamat sore';
  return 'Selamat malam';
}

export default function Overview({
  state,
  onOpenChat,
  onConnect,
  onNavigate,
  onSetAccountMode,
  onOpenTicket,
  onNewTicket,
}) {
  const { accounts, chats, tickets, activity, stats, settings } = state;
  const accountById = Object.fromEntries(accounts.map((acc) => [acc.id, acc]));
  const firstDisconnected = accounts.find((acc) => acc.status !== 'connected');
  const activeTickets = tickets.filter((ticket) => ticket.status !== 'resolved');
  const pendingTickets = tickets.filter((ticket) => ticket.status === 'pending').length;
  const chartMax = Math.max(1, ...stats.daily.map((day) => day.count));
  const chartTotal = stats.daily.reduce((sum, day) => sum + day.count, 0);
  const todayCount = stats.daily[stats.daily.length - 1]?.count || 0;

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-600/70">
            Ringkasan hari ini
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px]">
            {greeting()}, Admin
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {formatFullDate()} · Tiga nomor WhatsApp, satu pusat kendali.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={Ticket} onClick={() => onNewTicket(null)}>
            Buat tiket
          </Button>
          {firstDisconnected ? (
            <Button icon={Smartphone} onClick={() => onConnect(firstDisconnected.id)}>
              Hubungkan WhatsApp
            </Button>
          ) : (
            <Button icon={Smartphone} onClick={() => onNavigate('accounts')}>
              Kelola akun
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Smartphone}
          label="Akun terhubung"
          value={`${stats.connected}/${stats.accounts}`}
          hint={stats.connected ? 'Sesi WhatsApp aktif' : 'Belum ada nomor tertaut'}
          tone="emerald"
        />
        <StatCard
          icon={MessagesSquare}
          label="Percakapan"
          value={formatNumber(stats.chats)}
          hint={`${stats.unread} pesan belum dibaca`}
          tone="sky"
        />
        <StatCard
          icon={Ticket}
          label="Tiket aktif"
          value={formatNumber(stats.openTickets)}
          hint={`${pendingTickets} sedang diproses`}
          tone="amber"
        />
        <StatCard
          icon={Sparkles}
          label="Balasan AI hari ini"
          value={formatNumber(stats.aiToday)}
          hint={`${stats.messagesToday} pesan masuk & keluar`}
          tone="violet"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <SectionHeader
            title="Volume pesan"
            subtitle="14 hari terakhir"
            action={
              <Badge tone="red" dot>
                {formatNumber(todayCount)} hari ini
              </Badge>
            }
          />
          <div className="mt-5 flex h-36 items-end gap-1 sm:gap-1.5">
            {stats.daily.map((day, index) => (
              <div key={day.date} className="group flex h-full flex-1 flex-col justify-end">
                <div className="flex flex-1 items-end">
                  <div
                    className="w-full rounded-t-[4px] bg-gradient-to-t from-red-500/20 via-red-400/55 to-red-300/90 transition-all duration-300 group-hover:from-red-400/35 group-hover:to-red-200"
                    style={{ height: `${Math.max(3, (day.count / chartMax) * 100)}%` }}
                    title={`${day.count} pesan · ${day.date}`}
                  />
                </div>
                <span className="mt-2 hidden text-center text-[9px] text-slate-400 sm:block">
                  {(stats.daily.length - 1 - index) % 2 === 0 ? shortDay(day.date) : ''}
                </span>
                <span className="mt-1.5 text-center text-[9px] text-slate-400 sm:hidden">
                  {(stats.daily.length - 1 - index) % 4 === 0 ? shortDate(day.date) : ''}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-[11px]">
            <span className="text-slate-500">
              Total <span className="font-semibold text-slate-600">{formatNumber(chartTotal)}</span> pesan
              dalam 14 hari
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="h-2 w-2 rounded-full bg-red-600" /> Semua pesan
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader
            title="Akun WhatsApp"
            subtitle="Mode balasan per nomor"
            action={
              <button
                type="button"
                onClick={() => onNavigate('accounts')}
                className="flex items-center gap-1 text-[11px] font-medium text-red-600 transition hover:text-red-700"
              >
                Kelola <ChevronRight className="h-3 w-3" />
              </button>
            }
          />
          <div className="mt-4 space-y-2.5">
            {accounts.map((account) => {
              const status = ACCOUNT_STATUS[account.status] || ACCOUNT_STATUS.disconnected;
              return (
                <div
                  key={account.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                      <Smartphone className="h-4 w-4" />
                      <StatusDot
                        status={account.status}
                        className="absolute -bottom-0.5 -right-0.5 h-2 w-2 ring-2 ring-white"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-800">{account.label}</p>
                      <p className="truncate text-[10px] text-slate-500">
                        {account.status === 'connected'
                          ? formatPhone(account.phone)
                          : status.label}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        account.status === 'connected'
                          ? onNavigate('inbox')
                          : onConnect(account.id)
                      }
                      className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 transition hover:border-red-300 hover:text-red-700"
                    >
                      {account.status === 'connected' ? 'Chat' : 'Tautkan'}
                    </button>
                  </div>
                  <div className="mt-2.5">
                    <ModeToggle
                      mode={account.mode}
                      size="sm"
                      onChange={(mode) => onSetAccountMode(account.id, mode)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {!settings.hasKey && (
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="mt-3 flex w-full items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left text-[10px] leading-relaxed text-amber-700 transition hover:bg-amber-100"
            >
              <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
              API key Gemini belum diisi — bot belum bisa membalas.
              <ArrowRight className="ml-auto h-3 w-3 shrink-0" />
            </button>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionHeader
            title="Percakapan terbaru"
            subtitle="Klik untuk membalas"
            action={
              <button
                type="button"
                onClick={() => onNavigate('inbox')}
                className="flex items-center gap-1 text-[11px] font-medium text-red-600 transition hover:text-red-700"
              >
                Semua chat <ChevronRight className="h-3 w-3" />
              </button>
            }
          />
          {chats.length ? (
            <div className="mt-3 divide-y divide-slate-200">
              {chats.slice(0, 5).map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => onOpenChat(chat.id)}
                  className="group flex w-full items-center gap-3 py-3 text-left"
                >
                  <Avatar name={chat.name} isGroup={chat.isGroup} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-slate-800">{chat.name}</p>
                      <span className="shrink-0 text-[10px] text-slate-500">
                        {timeAgo(chat.lastMessageAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {chat.lastPreview || 'Belum ada pesan'}
                    </p>
                  </div>
                  {chat.unread > 0 ? (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                      {chat.unread > 9 ? '9+' : chat.unread}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-slate-400">
                      {chat.effectiveMode === 'bot' ? (
                        <>
                          <Sparkles className="h-3 w-3" /> AI
                        </>
                      ) : (
                        'Manual'
                      )}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={MessagesSquare}
              title="Belum ada percakapan"
              description="Percakapan akan muncul otomatis setelah nomor terhubung dan pelanggan mengirim pesan."
              className="py-10"
            />
          )}
        </Card>

        <Card className="p-5">
          <SectionHeader
            title="Tiket terbuka"
            subtitle={`${activeTickets.length} tiket perlu ditindaklanjuti`}
            action={
              <button
                type="button"
                onClick={() => onNavigate('tickets')}
                className="flex items-center gap-1 text-[11px] font-medium text-red-600 transition hover:text-red-700"
              >
                Semua tiket <ChevronRight className="h-3 w-3" />
              </button>
            }
          />
          {activeTickets.length ? (
            <div className="mt-3 space-y-2">
              {activeTickets.slice(0, 4).map((ticket) => {
                const status = TICKET_STATUS[ticket.status];
                const priority = PRIORITY[ticket.priority] || PRIORITY.normal;
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => onOpenTicket(ticket.id)}
                    className="group w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-slate-300 hover:bg-slate-100"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500">{ticket.code}</span>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </div>
                      <Badge tone={priority.tone}>{priority.label}</Badge>
                    </div>
                    <p className="mt-2 truncate text-xs font-semibold text-slate-800">
                      {ticket.subject}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                      <span className="truncate">
                        {ticket.contactName} · {accountById[ticket.accountId]?.label || 'WhatsApp'}
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        {timeAgo(ticket.updatedAt)}
                        <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Ticket}
              title="Tidak ada tiket aktif"
              description="Semua permintaan pelanggan sudah tertangani."
              className="py-10"
            />
          )}
        </Card>
      </div>

      <Card className="p-5">
        <SectionHeader
          title="Aktivitas terbaru"
          subtitle="Bot AI, koneksi, dan perubahan tiket"
          action={
            <button
              type="button"
              onClick={() => onNavigate('accounts')}
              className="text-[11px] text-slate-500 transition hover:text-slate-600"
            >
              {dayDivider(Date.now())}
            </button>
          }
        />
        {activity.length ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {activity.slice(0, 8).map((item) => {
              const style = ACTIVITY_STYLES[item.kind] || ACTIVITY_STYLES.message;
              const Icon = style.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                >
                  <div className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-lg', style.className)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-600">
                      {item.text}
                    </p>
                    <p className="mt-0.5 text-[9px] uppercase tracking-wide text-slate-400">
                      {timeAgo(item.at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-xs text-slate-500">Belum ada aktivitas.</p>
        )}
      </Card>
    </div>
  );
}
