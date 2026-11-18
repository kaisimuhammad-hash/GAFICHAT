import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, MessageSquare, Ticket } from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
  cn,
} from './ui.jsx';
import { PRIORITY } from '../lib/format.js';
import { api } from '../lib/api.js';

const PRIORITY_ORDER = ['low', 'normal', 'high'];

export default function TicketModal({
  open,
  onClose,
  chats,
  accounts,
  presetChatId,
  onCreated,
  pushToast,
}) {
  const [chatId, setChatId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const accountById = useMemo(
    () => Object.fromEntries(accounts.map((acc) => [acc.id, acc])),
    [accounts],
  );

  useEffect(() => {
    if (!open) return;
    setChatId(presetChatId || '');
    setSubject('');
    setDescription('');
    setPriority('normal');
    setError('');
    setSaving(false);
  }, [open, presetChatId]);

  const selectedChat = chats.find((chat) => chat.id === chatId);
  const sortedChats = useMemo(
    () =>
      [...chats].sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0)),
    [chats],
  );

  const submit = async () => {
    if (!chatId) {
      setError('Pilih percakapan yang terkait dengan tiket.');
      return;
    }
    if (!subject.trim()) {
      setError('Subjek tiket wajib diisi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await api.createTicket({
        chatId,
        subject: subject.trim(),
        description: description.trim(),
        priority,
      });
      pushToast({
        type: 'success',
        title: 'Tiket berhasil dibuat',
        text: `${result.ticket.code} · ${result.ticket.subject}`,
      });
      onCreated?.(result.ticket);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat tiket baru"
      description="Hubungkan tiket ke percakapan agar konteks pelanggan tetap tersimpan."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button icon={Ticket} onClick={submit} loading={saving} disabled={!chats.length}>
            Buat tiket
          </Button>
        </>
      }
    >
      {!chats.length ? (
        <EmptyState
          icon={MessageSquare}
          title="Belum ada percakapan"
          description="Tiket harus terhubung ke percakapan. Tunggu pesan masuk dari pelanggan terlebih dahulu."
        />
      ) : (
        <div className="space-y-4">
          <Field label="Percakapan" hint="Tiket akan menautkan kontak dan riwayat chat ini.">
            {presetChatId && selectedChat ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <Avatar name={selectedChat.name} size="sm" isGroup={selectedChat.isGroup} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{selectedChat.name}</p>
                  <p className="truncate text-[11px] text-slate-500">
                    {accountById[selectedChat.accountId]?.label || 'WhatsApp'} ·
                    {' '}
                    {selectedChat.waJid.split('@')[0]}
                  </p>
                </div>
                <Badge tone="emerald">Terpilih</Badge>
              </div>
            ) : (
              <Select value={chatId} onChange={(event) => setChatId(event.target.value)}>
                <option value="">Pilih percakapan…</option>
                {sortedChats.map((chat) => (
                  <option key={chat.id} value={chat.id}>
                    {accountById[chat.accountId]?.label || 'WhatsApp'} · {chat.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Subjek">
            <Input
              value={subject}
              maxLength={160}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Contoh: Pesanan NX-88213 belum dikirim"
            />
          </Field>

          <Field label="Prioritas">
            <div className="grid grid-cols-3 gap-2">
              {PRIORITY_ORDER.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPriority(value)}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-xs font-medium transition',
                    priority === value
                      ? value === 'high'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : value === 'normal'
                          ? 'border-sky-200 bg-sky-50 text-sky-700'
                          : 'border-slate-300 bg-slate-100 text-slate-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300',
                  )}
                >
                  {PRIORITY[value].label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Deskripsi" hint="Opsional — catat kebutuhan atau langkah yang sudah dilakukan.">
            <Textarea
              rows={4}
              value={description}
              maxLength={4000}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Jelaskan detail permintaan pelanggan, langkah yang sudah dicoba, atau hal yang perlu ditindaklanjuti…"
            />
          </Field>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] leading-relaxed text-red-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
