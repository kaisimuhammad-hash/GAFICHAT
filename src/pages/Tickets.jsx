import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  MessagesSquare,
  Plus,
  Search,
  Ticket,
  Trash2,
  X,
} from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Drawer,
  EmptyState,
  Field,
  IconButton,
  Input,
  Select,
  Textarea,
  cn,
} from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { PRIORITY, TICKET_STATUS, timeAgo } from '../lib/format.js';

const STATUS_TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'open', label: 'Baru' },
  { id: 'pending', label: 'Diproses' },
  { id: 'resolved', label: 'Selesai' },
];

export default function Tickets({
  state,
  refresh,
  pushToast,
  onOpenChat,
  onNewTicket,
  focusTicketId,
  onFocusHandled,
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const accountById = useMemo(
    () => Object.fromEntries(state.accounts.map((account) => [account.id, account])),
    [state.accounts],
  );

  const tickets = state.tickets;
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedId) || null;

  useEffect(() => {
    if (!focusTicketId) return;
    setSelectedId(focusTicketId);
    onFocusHandled?.();
  }, [focusTicketId, onFocusHandled]);

  useEffect(() => {
    if (!selectedTicket) return;
    setForm({
      subject: selectedTicket.subject,
      description: selectedTicket.description || '',
      status: selectedTicket.status,
      priority: selectedTicket.priority,
      assignee: selectedTicket.assignee || '',
    });
  }, [selectedTicket?.id]);

  const counts = useMemo(() => {
    return tickets.reduce(
      (acc, ticket) => {
        acc.all += 1;
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
      },
      { all: 0, open: 0, pending: 0, resolved: 0 },
    );
  }, [tickets]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
      if (!query) return true;
      return (
        ticket.subject.toLowerCase().includes(query) ||
        ticket.code.toLowerCase().includes(query) ||
        ticket.contactName.toLowerCase().includes(query) ||
        (ticket.assignee || '').toLowerCase().includes(query)
      );
    });
  }, [tickets, statusFilter, priorityFilter, search]);

  const save = async () => {
    if (!selectedTicket || !form) return;
    if (!form.subject.trim()) {
      pushToast({ type: 'warning', title: 'Subjek tiket wajib diisi' });
      return;
    }
    setSaving(true);
    try {
      await api.updateTicket(selectedTicket.id, {
        subject: form.subject.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        assignee: form.assignee.trim(),
      });
      await refresh();
      pushToast({ type: 'success', title: 'Tiket diperbarui', text: selectedTicket.code });
    } catch (err) {
      pushToast({ type: 'error', title: 'Gagal menyimpan tiket', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!selectedTicket) return;
    setDeleting(true);
    try {
      await api.deleteTicket(selectedTicket.id);
      setConfirmDelete(false);
      setSelectedId(null);
      await refresh();
      pushToast({ type: 'success', title: 'Tiket dihapus' });
    } catch (err) {
      pushToast({ type: 'error', title: 'Gagal menghapus tiket', text: err.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-600/70">
            Customer support
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px]">
            Tiket & tindak lanjut
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Catat permintaan pelanggan, atur prioritas, dan tautkan ke percakapan aslinya.
          </p>
        </div>
        <Button icon={Plus} onClick={() => onNewTicket(null)}>
          Buat tiket
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-slate-50 p-1 ring-1 ring-inset ring-slate-200">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition',
                  statusFilter === tab.id
                    ? 'bg-white text-red-700 shadow-[inset_0_0_0_1px_rgba(220,38,38,0.16)]'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                    statusFilter === tab.id
                      ? 'bg-red-50 text-red-600'
                      : 'bg-white text-slate-500',
                  )}
                >
                  {counts[tab.id] || 0}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari tiket, kontak, kode…"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-red-300"
              />
            </div>
            <Select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="h-9 w-auto min-w-[128px] py-0 text-xs"
            >
              <option value="all">Semua prioritas</option>
              <option value="high">Tinggi</option>
              <option value="normal">Normal</option>
              <option value="low">Rendah</option>
            </Select>
          </div>
        </div>

        {filtered.length ? (
          <div className="divide-y divide-slate-200">
            {filtered.map((ticket) => {
              const status = TICKET_STATUS[ticket.status];
              const priority = PRIORITY[ticket.priority] || PRIORITY.normal;
              const account = accountById[ticket.accountId];
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedId(ticket.id)}
                  className="group flex w-full flex-col gap-2.5 px-4 py-3.5 text-left transition hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="hidden w-[74px] shrink-0 lg:block">
                    <p className="font-mono text-[10px] text-slate-500">{ticket.code}</p>
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={ticket.contactName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-semibold text-slate-800">
                          {ticket.subject}
                        </p>
                        <ArrowUpRight className="h-3 w-3 shrink-0 text-slate-400 opacity-0 transition group-hover:opacity-100" />
                      </div>
                      <p className="mt-0.5 truncate text-[10.5px] text-slate-500">
                        {ticket.code} · {ticket.contactName} · {account?.label || 'WhatsApp'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-[48px] sm:pl-0">
                    <Badge tone={priority.tone}>{priority.label}</Badge>
                    <Badge tone={status.tone} dot>
                      {status.label}
                    </Badge>
                    <Badge tone="slate" className="hidden xl:inline-flex">
                      {ticket.assignee || 'Belum ditugaskan'}
                    </Badge>
                    <span className="text-[10px] text-slate-500 sm:w-[62px] sm:text-right">
                      {timeAgo(ticket.updatedAt)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Ticket}
            title={tickets.length ? 'Tidak ada tiket yang cocok' : 'Belum ada tiket'}
            description={
              tickets.length
                ? 'Coba ubah filter status, prioritas, atau kata kunci pencarian.'
                : 'Buat tiket dari percakapan pelanggan agar tidak ada permintaan yang terlewat.'
            }
            action={
              tickets.length ? null : (
                <Button size="sm" icon={Plus} onClick={() => onNewTicket(null)}>
                  Buat tiket pertama
                </Button>
              )
            }
          />
        )}
      </Card>

      <Drawer open={!!selectedTicket} onClose={() => setSelectedId(null)}>
        {selectedTicket && form ? (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4">
              <div>
                <p className="font-mono text-[10px] text-slate-500">{selectedTicket.code}</p>
                <h2 className="mt-1 text-base font-semibold text-slate-900">Detail tiket</h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Dibuat {timeAgo(selectedTicket.createdAt)} · diperbarui{' '}
                  {timeAgo(selectedTicket.updatedAt)}
                </p>
              </div>
              <IconButton label="Tutup detail" onClick={() => setSelectedId(null)}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>

            <div className="scroll-slim flex-1 space-y-5 overflow-y-auto p-4">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <Avatar name={selectedTicket.contactName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {selectedTicket.contactName}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {accountById[selectedTicket.accountId]?.label || 'WhatsApp'}
                  </p>
                </div>
                {selectedTicket.status === 'resolved' && (
                  <Badge tone="emerald">
                    <CheckCircle2 className="h-3 w-3" /> Selesai
                  </Badge>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-slate-600">Status tiket</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(TICKET_STATUS).map(([value, meta]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, status: value }))}
                      className={cn(
                        'rounded-xl border px-2 py-2 text-[11px] font-medium transition',
                        form.status === value
                          ? value === 'resolved'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : value === 'pending'
                              ? 'border-amber-200 bg-amber-100 text-amber-700'
                              : 'border-sky-200 bg-sky-50 text-sky-700'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300',
                      )}
                    >
                      {meta.label}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Subjek">
                <Input
                  value={form.subject}
                  maxLength={160}
                  onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Prioritas">
                  <Select
                    value={form.priority}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, priority: event.target.value }))
                    }
                  >
                    {Object.entries(PRIORITY).map(([value, meta]) => (
                      <option key={value} value={value}>
                        {meta.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Ditugaskan ke">
                  <Input
                    value={form.assignee}
                    maxLength={60}
                    placeholder="Nama agen"
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, assignee: event.target.value }))
                    }
                  />
                </Field>
              </div>

              <Field label="Deskripsi" hint="Catatan internal, bukan pesan yang dikirim ke pelanggan.">
                <Textarea
                  rows={6}
                  value={form.description}
                  maxLength={4000}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Tambahkan detail permintaan, langkah penanganan, atau hasil kesepakatan…"
                />
              </Field>
            </div>

            <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
              <Button
                variant="secondary"
                icon={MessagesSquare}
                disabled={!selectedTicket.chatId}
                onClick={() => onOpenChat(selectedTicket.chatId)}
                title={selectedTicket.chatId ? 'Buka percakapan terkait' : 'Chat terkait sudah dihapus'}
              >
                Buka chat
              </Button>
              <div className="flex-1" />
              <Button
                variant="danger"
                size="icon"
                onClick={() => setConfirmDelete(true)}
                aria-label="Hapus tiket"
                title="Hapus tiket"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button onClick={save} loading={saving}>
                Simpan perubahan
              </Button>
            </div>
          </>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        loading={deleting}
        title="Hapus tiket ini?"
        description="Tiket akan dihapus permanen. Percakapan pelanggan tetap tersimpan."
        confirmLabel="Hapus tiket"
      />
    </div>
  );
}
