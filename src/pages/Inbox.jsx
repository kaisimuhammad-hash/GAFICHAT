import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronUp,
  Eraser,
  MessageSquare,
  MessageSquarePlus,
  MessagesSquare,
  MoreHorizontal,
  Paperclip,
  PencilLine,
  Reply,
  RotateCcw,
  Save,
  Search,
  Send,
  Sparkles,
  Ticket,
  Trash2,
  UserRound,
  WifiOff,
  X,
} from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  Spinner,
  StatusDot,
  cn,
} from '../components/ui.jsx';
import { api } from '../lib/api.js';
import {
  dayDivider,
  formatPhone,
  formatTime,
  sameDay,
  timeAgo,
} from '../lib/format.js';

function AckIcon({ ack }) {
  if (ack >= 4) return <CheckCheck className="h-3 w-3 text-sky-600" />;
  if (ack >= 3) return <CheckCheck className="h-3 w-3" />;
  if (ack >= 2) return <Check className="h-3 w-3" />;
  return <Check className="h-3 w-3 opacity-50" />;
}

const EDIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function editState(message) {
  if (!message?.fromMe) return { allowed: false, reason: 'Hanya pesan keluar yang bisa diedit' };
  if (message.deleted || message.revoked) return { allowed: false, reason: 'Pesan sudah dihapus' };
  if (!message.hasWaId) return { allowed: false, reason: 'Pesan ini tidak tersinkron dengan WhatsApp' };
  if (Date.now() - message.createdAt > EDIT_WINDOW_MS) {
    return { allowed: false, reason: 'Batas edit WhatsApp 15 menit sudah lewat' };
  }
  return { allowed: true, reason: 'Edit pesan di WhatsApp' };
}

export default function Inbox({
  state,
  isAdmin,
  activeChatId,
  onSelectChat,
  inboxAccountId,
  setInboxAccountId,
  syncTick,
  refresh,
  pushToast,
  onNewTicket,
  onOpenTicket,
  onConnectAccount,
  onOpenSettings,
  onNewChat,
}) {
  const [search, setSearch] = useState('');
  const [thread, setThread] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [menu, setMenu] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [chatMenu, setChatMenu] = useState(null);
  const [renameChat, setRenameChat] = useState(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [savingRename, setSavingRename] = useState(false);
  const [chatDelete, setChatDelete] = useState(null);
  const [deletingChat, setDeletingChat] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);

  const accountById = useMemo(
    () => Object.fromEntries(state.accounts.map((account) => [account.id, account])),
    [state.accounts],
  );

  const activeChat = state.chats.find((chat) => chat.id === activeChatId) || null;
  const threadChat = thread?.chat?.id === activeChatId ? thread.chat : null;
  const lastThreadMessageId =
    thread?.chat?.id === activeChatId && thread.messages?.length
      ? thread.messages[thread.messages.length - 1].id
      : null;
  const chat = threadChat || activeChat;
  const account = chat ? accountById[chat.accountId] : null;
  const connected = account?.status === 'connected';
  const effectiveMode = chat?.effectiveMode || 'manual';
  const ticketForChat = state.tickets.find(
    (ticket) => ticket.chatId === activeChatId && ticket.status !== 'resolved',
  );

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase();
    return state.chats.filter((item) => {
      if (inboxAccountId !== 'all' && item.accountId !== inboxAccountId) return false;
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        (item.lastPreview || '').toLowerCase().includes(query)
      );
    });
  }, [state.chats, inboxAccountId, search]);

  useEffect(() => {
    setLoadingThread(!!activeChatId);
    setLoadingOlder(false);
    setThread(null);
    setText('');
    setMenu(null);
    setChatMenu(null);
    setEditTarget(null);
  }, [activeChatId]);

  useEffect(() => {
    if (!activeChatId) return undefined;
    let cancelled = false;
    api
      .messages(activeChatId)
      .then((data) => {
        if (!cancelled) setThread(data);
      })
      .catch((err) => {
        if (!cancelled) {
          pushToast({ type: 'error', title: 'Gagal memuat percakapan', text: err.message });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingThread(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeChatId, syncTick, pushToast]);

  useEffect(() => {
    if (!activeChatId) return;
    const current = state.chats.find((item) => item.id === activeChatId);
    if (current?.unread > 0) {
      api
        .read(current.id)
        .then(() => refresh())
        .catch(() => {});
    }
  }, [activeChatId, state.chats, refresh]);

  useEffect(() => {
    if (!lastThreadMessageId) return;
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [lastThreadMessageId, thread?.chat?.id]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [text]);

  useEffect(() => {
    if (!attachment) return undefined;
    const url = attachment.previewUrl;
    return () => URL.revokeObjectURL(url);
  }, [attachment]);

  useEffect(() => {
    setAttachment(null);
    setReplyTo(null);
  }, [activeChatId]);

  const reloadThread = useCallback(async () => {
    if (!activeChatId) return;
    try {
      const data = await api.messages(activeChatId);
      setThread(data);
    } catch {
      /* ignore */
    }
  }, [activeChatId]);

  const loadOlder = async () => {
    if (!activeChatId || loadingOlder || !thread?.hasMore || !thread.messages?.length) return;
    const el = scrollRef.current;
    const previousHeight = el?.scrollHeight || 0;
    const previousTop = el?.scrollTop || 0;
    setLoadingOlder(true);
    try {
      const data = await api.messages(activeChatId, { before: thread.messages[0].id });
      setThread((current) => {
        if (!current || current.chat?.id !== activeChatId) return current;
        return {
          ...current,
          messages: [...data.messages, ...(current.messages || [])],
          hasMore: !!data.hasMore,
        };
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!el) return;
          el.scrollTop = previousTop + (el.scrollHeight - previousHeight);
        });
      });
    } catch (err) {
      pushToast({ type: 'error', title: 'Gagal memuat pesan lama', text: err.message });
    } finally {
      setLoadingOlder(false);
    }
  };

  const changeMode = async (mode) => {
    if (!activeChatId) return;
    try {
      await api.chatMode(activeChatId, mode);
      await refresh();
      await reloadThread();
      if (mode === 'bot') {
        pushToast({ type: 'info', title: 'Mode AI aktif', text: 'Pesan masuk akan dibalas otomatis.' });
      } else if (mode === 'manual') {
        pushToast({ type: 'info', title: 'Mode manual aktif', text: 'Kamu akan membalas sendiri di chat ini.' });
      }
    } catch (err) {
      pushToast({ type: 'error', title: 'Gagal mengubah mode', text: err.message });
    }
  };

  const onPickFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      pushToast({
        type: 'warning',
        title: 'Format tidak didukung',
        text: 'Pilih gambar JPEG, PNG, WebP, atau GIF.',
      });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      pushToast({
        type: 'warning',
        title: 'Gambar terlalu besar',
        text: 'Maksimal 8 MB untuk sekali kirim.',
      });
      return;
    }
    setAttachment({ file, previewUrl: URL.createObjectURL(file) });
    textareaRef.current?.focus();
  };

  const send = async () => {
    const body = text.trim();
    if (sending || !activeChatId) return;
    if (!body && !attachment) return;
    if (!connected) {
      pushToast({ type: 'warning', title: 'Nomor belum terhubung', text: 'Sambungkan WhatsApp untuk membalas.' });
      return;
    }
    setSending(true);
    try {
      if (attachment) {
        await api.sendImage(activeChatId, attachment.file, {
          caption: body,
          replyTo: replyTo?.id,
        });
      } else {
        await api.send(activeChatId, body, replyTo?.id);
      }
      setText('');
      setAttachment(null);
      setReplyTo(null);
      await reloadThread();
      await refresh();
    } catch (err) {
      pushToast({
        type: 'error',
        title: attachment ? 'Gambar gagal dikirim' : 'Pesan gagal dikirim',
        text: err.message,
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const runDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      if (confirm.mode === 'revoke') {
        await api.revokeMessage(confirm.message.id);
        pushToast({ type: 'success', title: 'Pesan dihapus untuk semua', text: 'Pesan telah ditarik dari WhatsApp.' });
      } else {
        await api.hideMessage(confirm.message.id);
        pushToast({ type: 'success', title: 'Pesan dihapus', text: 'Pesan disembunyikan dari dashboard.' });
      }
      setConfirm(null);
      await reloadThread();
      await refresh();
    } catch (err) {
      pushToast({ type: 'error', title: 'Gagal menghapus pesan', text: err.message });
    } finally {
      setDeleting(false);
    }
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    const body = editDraft.trim();
    if (!body || body === editTarget.text) return;
    setSavingEdit(true);
    try {
      await api.editMessage(editTarget.id, body);
      setEditTarget(null);
      await reloadThread();
      await refresh();
      pushToast({
        type: 'success',
        title: 'Pesan diperbarui',
        text: 'Perubahan sudah diterapkan ke pesan WhatsApp.',
      });
    } catch (err) {
      pushToast({ type: 'error', title: 'Gagal mengedit pesan', text: err.message });
    } finally {
      setSavingEdit(false);
    }
  };

  const openRowMenu = (event, item) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const width = 224;
    const height = 96;
    setChatMenu({
      chat: item,
      left: Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8),
      top:
        rect.bottom + height + 12 > window.innerHeight
          ? Math.max(8, rect.top - height - 6)
          : rect.bottom + 6,
    });
  };

  const startRename = (target) => {
    setChatMenu(null);
    setRenameChat(target);
    setRenameDraft(target.name || '');
  };

  const saveRename = async () => {
    const name = renameDraft.trim();
    if (!renameChat) return;
    if (!name || name === renameChat.name) {
      setRenameChat(null);
      return;
    }
    setSavingRename(true);
    try {
      const data = await api.updateChat(renameChat.id, { name });
      setThread((prev) => (prev?.chat?.id === data.chat.id ? { ...prev, chat: data.chat } : prev));
      await refresh();
      pushToast({ type: 'success', title: 'Nama kontak diperbarui', text: data.chat.name });
      setRenameChat(null);
    } catch (err) {
      pushToast({ type: 'error', title: 'Gagal mengganti nama', text: err.message });
    } finally {
      setSavingRename(false);
    }
  };

  const runDeleteChat = async () => {
    if (!chatDelete) return;
    const target = chatDelete;
    setDeletingChat(true);
    try {
      await api.deleteChat(target.chat.id, target.mode === 'remote');
      setChatDelete(null);
      if (activeChatId === target.chat.id) onSelectChat(null);
      await refresh();
      pushToast({
        type: 'success',
        title: 'Chat dihapus',
        text:
          target.mode === 'remote'
            ? `Chat ${target.chat.name} dihapus dari WhatsApp.`
            : `Chat ${target.chat.name} dihapus dari dashboard.`,
      });
    } catch (err) {
      pushToast({ type: 'error', title: 'Gagal menghapus chat', text: err.message });
    } finally {
      setDeletingChat(false);
    }
  };

  const messages = thread?.chat?.id === activeChatId ? thread.messages || [] : [];

  return (
    <div className="flex h-full overflow-hidden rounded-3xl border border-slate-200 bg-white backdrop-blur-xl">
      <div
        className={cn(
          'w-full shrink-0 flex-col border-r border-slate-200 lg:flex lg:w-[336px]',
          activeChatId ? 'hidden' : 'flex',
        )}
      >
        <div className="border-b border-slate-200 px-4 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Kotak masuk</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {state.stats.unread > 0
                  ? `${state.stats.unread} pesan belum dibaca`
                  : 'Semua pesan sudah dibaca'}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge tone="red" dot>
                {filteredChats.length} chat
              </Badge>
              <IconButton
                label="Chat baru"
                onClick={onNewChat}
                className="h-8 w-8 rounded-lg border border-slate-200 bg-white hover:border-red-200 hover:text-red-600"
              >
                <MessageSquarePlus className="h-4 w-4" />
              </IconButton>
            </div>
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama atau pesan…"
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-red-300"
            />
          </div>

          <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setInboxAccountId('all')}
              className={cn(
                'shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium transition',
                inboxAccountId === 'all'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700',
              )}
            >
              Semua akun
            </button>
            {state.accounts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setInboxAccountId(item.id)}
                title={item.label}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition',
                  inboxAccountId === item.id
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700',
                )}
              >
                <StatusDot status={item.status} className="h-1.5 w-1.5" />
                <span className="max-w-[74px] truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="scroll-slim flex-1 overflow-y-auto p-2">
          {filteredChats.length ? (
            filteredChats.map((item) => {
              const itemAccount = accountById[item.accountId];
              return (
                <div key={item.id} className="group relative mb-0.5">
                  <button
                    type="button"
                    onClick={() => onSelectChat(item.id)}
                    className={cn(
                      'flex w-full items-start gap-2.5 rounded-2xl px-2.5 py-2.5 pr-10 text-left transition',
                      activeChatId === item.id
                        ? 'bg-red-50 ring-1 ring-inset ring-red-200'
                        : 'hover:bg-slate-50',
                    )}
                  >
                    <Avatar name={item.name} isGroup={item.isGroup} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[13px] font-semibold text-slate-800">{item.name}</p>
                        <span className="shrink-0 text-[9px] text-slate-400">
                          {timeAgo(item.lastMessageAt)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-[11px] text-slate-500">
                          {item.lastPreview || 'Belum ada pesan'}
                        </p>
                        {item.unread > 0 && (
                          <span className="grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
                            {item.unread > 9 ? '9+' : item.unread}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="truncate text-[9px] font-medium uppercase tracking-[0.08em] text-slate-500">
                          {itemAccount?.label}
                        </span>
                        <span className="text-slate-300">·</span>
                        {item.effectiveMode === 'bot' ? (
                          <span className="flex items-center gap-0.5 text-[9px] font-medium text-red-600">
                            <Sparkles className="h-2.5 w-2.5" /> AI
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-[9px] font-medium text-slate-500">
                            <UserRound className="h-2.5 w-2.5" /> Manual
                          </span>
                        )}
                        {item.isGroup && <span className="text-[9px] text-slate-500">· Grup</span>}
                      </div>
                    </div>
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(event) => openRowMenu(event, item)}
                      title="Hapus chat"
                      aria-label={`Hapus chat ${item.name}`}
                      className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg border border-transparent text-slate-500 opacity-100 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <EmptyState
              icon={MessagesSquare}
              title="Tidak ada percakapan"
              description={
                search
                  ? 'Coba kata kunci lain atau ubah filter akun.'
                  : 'Pesan baru akan tampil di sini setelah nomor terhubung.'
              }
              className="py-12"
            />
          )}
        </div>
      </div>

      <div className={cn('min-w-0 flex-1 flex-col', activeChatId ? 'flex' : 'hidden lg:flex')}>
        {!chat ? (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 lg:hidden">
              <button
                type="button"
                onClick={() => onSelectChat(null)}
                className="flex items-center gap-1.5 text-xs text-slate-500"
              >
                <ArrowLeft className="h-4 w-4" /> Daftar chat
              </button>
            </div>
            <EmptyState
              icon={MessagesSquare}
              title="Pilih percakapan"
              description="Buka salah satu chat untuk membaca riwayat, membalas dengan AI, atau membuat tiket."
              className="m-auto py-16"
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 border-b border-slate-200 px-3 py-2.5 sm:px-4">
              <IconButton
                label="Kembali ke daftar chat"
                className="lg:hidden"
                onClick={() => onSelectChat(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </IconButton>
              <Avatar name={chat.name} isGroup={chat.isGroup} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="truncate text-sm font-semibold text-slate-900">{chat.name}</h2>
                  {chat.isGroup && <Badge tone="violet">Grup</Badge>}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                  <StatusDot status={account?.status} className="h-1.5 w-1.5" />
                  <span className="truncate">
                    {account?.label || 'WhatsApp'}
                    {!chat.isGroup && ` · ${formatPhone(chat.waJid.split('@')[0])}`}
                  </span>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={Ticket}
                onClick={() =>
                  ticketForChat ? onOpenTicket(ticketForChat.id) : onNewTicket(activeChatId)
                }
                title={ticketForChat ? 'Buka tiket terkait' : 'Buat tiket dari percakapan ini'}
              >
                <span className="hidden sm:inline">{ticketForChat ? ticketForChat.code : 'Tiket'}</span>
              </Button>
              {isAdmin && (
                <IconButton
                  label="Opsi chat"
                  onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    const width = 224;
                    const height = 140;
                    setChatMenu({
                      chat,
                      left: Math.min(
                        Math.max(8, rect.right - width),
                        window.innerWidth - width - 8,
                      ),
                      top:
                        rect.bottom + height + 12 > window.innerHeight
                          ? Math.max(8, rect.top - height - 6)
                          : rect.bottom + 6,
                    });
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </IconButton>
              )}
            </div>

            {!chat.isGroup && (
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 py-1.5 sm:px-4">
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg bg-slate-100 p-0.5">
                    <button
                      type="button"
                      onClick={() => changeMode('bot')}
                      className={cn(
                        'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition',
                        effectiveMode === 'bot'
                          ? 'bg-red-100 text-red-700 shadow-[inset_0_0_0_1px_rgba(220,38,38,0.22)]'
                          : 'text-slate-500 hover:text-slate-700',
                      )}
                    >
                      <Sparkles className="h-3 w-3" /> AI
                    </button>
                    <button
                      type="button"
                      onClick={() => changeMode('manual')}
                      className={cn(
                        'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition',
                        effectiveMode === 'manual'
                          ? 'bg-white text-slate-900 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]'
                          : 'text-slate-500 hover:text-slate-700',
                      )}
                    >
                      <UserRound className="h-3 w-3" /> Manual
                    </button>
                  </div>
                  {(chat.modeOverride || 'inherit') !== 'inherit' && (
                    <button
                      type="button"
                      onClick={() => changeMode('inherit')}
                      className="flex items-center gap-1 text-[10px] text-slate-500 transition hover:text-slate-600"
                      title={`Ikuti pengaturan akun (${account?.mode === 'manual' ? 'Manual' : 'AI'})`}
                    >
                      <RotateCcw className="h-2.5 w-2.5" /> ikut akun
                    </button>
                  )}
                </div>
                <span className="truncate text-[10px] text-slate-500">
                  {effectiveMode === 'bot'
                    ? state.settings.hasKey
                      ? 'Balasan otomatis aktif'
                      : 'AI belum siap'
                    : 'Balasan manual'}
                </span>
              </div>
            )}

            {!connected && (
              <div className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700 sm:px-4">
                <WifiOff className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1">
                  Nomor ini belum terhubung. Riwayat tetap bisa dibaca, tetapi pesan tidak dapat dikirim.
                </span>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onConnectAccount(chat.accountId)}
                  >
                    Hubungkan
                  </Button>
                )}
              </div>
            )}

            {connected && !chat.isGroup && effectiveMode === 'bot' && !state.settings.hasKey && (
              <div className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700 sm:px-4">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1">Bot AI aktif di chat ini, tapi API key Gemini belum diisi.</span>
                {isAdmin && (
                  <Button size="sm" variant="secondary" onClick={onOpenSettings}>
                    Isi API key
                  </Button>
                )}
              </div>
            )}

            {connected && !chat.isGroup && effectiveMode === 'bot' && state.settings.hasKey && (
              <div className="flex flex-wrap items-center gap-2 border-b border-red-200 bg-red-50 px-3 py-1.5 text-[11px] text-red-700/90 sm:px-4">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1">
                  AI membalas otomatis. Ambil alih jika ingin membalas sendiri.
                </span>
                <button
                  type="button"
                  onClick={() => changeMode('manual')}
                  className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 transition hover:bg-slate-200"
                >
                  Ambil alih
                </button>
              </div>
            )}

            <div ref={scrollRef} className="chat-pattern scroll-slim flex-1 overflow-y-auto px-3 py-4 sm:px-5">
              {loadingThread ? (
                <div className="flex h-full items-center justify-center">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : messages.length ? (
                <div className="space-y-1.5">
                  {thread?.hasMore && (
                    <div className="flex justify-center pb-1">
                      <button
                        type="button"
                        onClick={loadOlder}
                        disabled={loadingOlder}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-medium text-slate-600 shadow-sm transition hover:border-red-200 hover:text-red-600 disabled:cursor-wait disabled:opacity-60"
                      >
                        {loadingOlder ? (
                          <Spinner className="h-3 w-3" />
                        ) : (
                          <ChevronUp className="h-3 w-3" />
                        )}
                        Muat pesan sebelumnya
                      </button>
                    </div>
                  )}
                  {messages.map((message, index) => {
                    const previous = messages[index - 1];
                    const showDivider = !previous || !sameDay(previous.createdAt, message.createdAt);
                    const showSender = chat.isGroup && !message.fromMe;
                    return (
                      <div key={message.id}>
                        {showDivider && (
                          <div className="my-3 flex items-center gap-3">
                            <span className="h-px flex-1 bg-slate-100" />
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-500">
                              {dayDivider(message.createdAt)}
                            </span>
                            <span className="h-px flex-1 bg-slate-100" />
                          </div>
                        )}
                        <div className={cn('group flex', message.fromMe ? 'justify-end' : 'justify-start')}>
                          <div
                            className={cn(
                              'relative max-w-[86%] rounded-2xl px-3.5 py-2 text-[12.5px] leading-relaxed shadow-sm sm:max-w-[70%]',
                              message.deleted
                                ? 'border border-dashed border-slate-200 bg-slate-50 text-slate-500'
                                : message.fromMe
                                  ? 'rounded-br-md border border-red-200 bg-red-50 text-slate-800'
                                  : 'rounded-bl-md border border-slate-200 bg-white text-slate-800',
                            )}
                          >
                            {showSender && !message.deleted && (
                              <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-red-600/70">
                                {message.senderName}
                              </p>
                            )}
                            {message.aiGenerated && !message.deleted && (
                              <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-red-600">
                                <Sparkles className="h-2.5 w-2.5" /> Nexa AI
                              </span>
                            )}
                            {message.deleted ? (
                              <span className="flex items-center gap-1.5 text-[11px] italic">
                                <Eraser className="h-3 w-3" />
                                Pesan telah dihapus
                              </span>
                            ) : (
                              <>
                                {message.quotedText && (
                                  <div className="mb-1.5 rounded-lg border-l-2 border-red-400/80 bg-slate-900/[0.04] px-2 py-1">
                                    {message.quotedFrom && (
                                      <p className="text-[9px] font-semibold uppercase tracking-wide text-red-600/70">
                                        {message.quotedFrom}
                                      </p>
                                    )}
                                    <p className="line-clamp-3 break-words text-[11px] leading-snug text-slate-600">
                                      {message.quotedText}
                                    </p>
                                  </div>
                                )}
                                {message.mediaUrl &&
                                  (message.mediaType === 'image' || message.mediaType === 'sticker') && (
                                    <button
                                      type="button"
                                      onClick={() => setLightbox(message.mediaUrl)}
                                      className="mb-1.5 block max-w-full cursor-zoom-in overflow-hidden rounded-xl"
                                      aria-label="Buka gambar"
                                    >
                                      <img
                                        src={message.mediaUrl}
                                        alt="Media WhatsApp"
                                        loading="lazy"
                                        className={cn(
                                          'block h-auto w-auto max-w-full rounded-xl object-contain',
                                          message.mediaType === 'sticker' ? 'max-h-32' : 'max-h-72',
                                        )}
                                      />
                                    </button>
                                  )}
                                {(message.hasUserText || !message.mediaUrl) && (
                                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                                )}
                              </>
                            )}
                            {!message.deleted && (
                              <div
                                className={cn(
                                  'mt-1 flex items-center justify-end gap-1 text-[9px]',
                                  message.fromMe ? 'text-red-700/50' : 'text-slate-500',
                                )}
                              >
                                <span>
                                  {formatTime(message.createdAt)}
                                  {message.editedAt ? ' · diedit' : ''}
                                </span>
                                {message.fromMe && <AckIcon ack={message.ack} />}
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    const rect = event.currentTarget.getBoundingClientRect();
                                    const width = 208;
                                    const height = 154;
                                    const left = Math.min(
                                      Math.max(8, message.fromMe ? rect.right - width : rect.left),
                                      window.innerWidth - width - 8,
                                    );
                                    const top =
                                      rect.bottom + height + 12 > window.innerHeight
                                        ? Math.max(8, rect.top - height - 6)
                                        : rect.bottom + 6;
                                    setMenu(
                                      menu?.message?.id === message.id
                                        ? null
                                        : { message, left, top },
                                    );
                                  }}
                                  className="ml-0.5 rounded p-0.5 text-current opacity-50 transition hover:bg-slate-100 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                  aria-label="Aksi pesan"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={MessageSquare}
                  title="Belum ada pesan"
                  description="Kirim pesan pertama untuk memulai percakapan dengan kontak ini."
                  className="h-full py-16"
                />
              )}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-2.5 sm:p-3">
              {replyTo && (
                <div className="mb-1.5 flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5">
                  <Reply className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-red-600/70">
                      Membalas {replyTo.fromMe ? 'pesan sendiri' : replyTo.senderName || chat.name}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">{replyTo.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Batalkan balasan"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {attachment && (
                <div className="mb-1.5 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-1.5">
                  <img
                    src={attachment.previewUrl}
                    alt="Pratinjau gambar"
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                  <p className="min-w-0 flex-1 truncate text-[11px] text-slate-600">
                    {attachment.file.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Buang gambar"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept={IMAGE_TYPES.join(',')}
                onChange={onPickFile}
                className="hidden"
              />
              <div
                className={cn(
                  'flex items-end gap-2 rounded-2xl border bg-white p-1.5 pl-1.5 transition',
                  connected
                    ? 'border-slate-200 focus-within:border-red-300 focus-within:ring-2 focus-within:ring-red-100'
                    : 'border-slate-200 opacity-60',
                )}
              >
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={!connected || sending}
                  title="Kirim gambar (JPEG, PNG, WebP, GIF)"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Lampirkan gambar"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={text}
                  disabled={!connected}
                  onChange={(event) => setText(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    connected
                      ? attachment
                        ? 'Tulis keterangan (opsional)…'
                        : 'Tulis balasan…'
                      : 'Hubungkan nomor untuk membalas pesan'
                  }
                  className="scroll-slim max-h-36 flex-1 resize-none bg-transparent py-2 pr-1.5 text-[12.5px] leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={!connected || (!text.trim() && !attachment) || sending}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-600 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={attachment ? 'Kirim gambar' : 'Kirim pesan'}
                >
                  {sending ? <Spinner className="h-4 w-4 text-white" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-1.5 flex items-center justify-between px-1 text-[9px] text-slate-400">
                <span>Enter kirim · Shift + Enter baris baru</span>
                <span className="flex items-center gap-1">
                  {!chat.isGroup && effectiveMode === 'bot' ? (
                    <>
                      <Sparkles className="h-2.5 w-2.5 text-red-500/70" /> AI aktif
                    </>
                  ) : (
                    <>
                      <UserRound className="h-2.5 w-2.5" /> Balasan manual
                    </>
                  )}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {menu &&
        createPortal(
          <div className="fixed inset-0 z-[60]" onClick={() => setMenu(null)}>
            <div
              className="fixed w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-2xl"
              style={{ left: menu.left, top: menu.top }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                disabled={menu.message.deleted}
                title={
                  menu.message.deleted
                    ? 'Pesan sudah dihapus'
                    : 'Balas pesan ini dengan kutipan'
                }
                onClick={() => {
                  setReplyTo(menu.message);
                  setMenu(null);
                  requestAnimationFrame(() => textareaRef.current?.focus());
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
              >
                <Reply className="h-3.5 w-3.5" />
                Balas pesan
              </button>
              <button
                type="button"
                disabled={!editState(menu.message).allowed}
                title={editState(menu.message).reason}
                onClick={() => {
                  setMenu(null);
                  setEditTarget(menu.message);
                  setEditDraft(menu.message.text);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
              >
                <PencilLine className="h-3.5 w-3.5" />
                Edit pesan
              </button>
              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMenu(null);
                      setConfirm({ message: menu.message, mode: 'hide' });
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] text-slate-600 transition hover:bg-slate-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus dari dashboard
                  </button>
                  <button
                    type="button"
                    disabled={!menu.message.fromMe}
                    title={
                      menu.message.fromMe
                        ? 'Hapus pesan untuk semua peserta WhatsApp'
                        : 'Hanya pesan keluar yang bisa dihapus untuk semua'
                    }
                    onClick={() => {
                      setMenu(null);
                      setConfirm({ message: menu.message, mode: 'revoke' });
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
                  >
                    <Eraser className="h-3.5 w-3.5" />
                    Hapus untuk semua
                  </button>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}

      {chatMenu &&
        createPortal(
          <div className="fixed inset-0 z-[60]" onClick={() => setChatMenu(null)}>
            <div
              className="fixed w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-2xl"
              style={{ left: chatMenu.left, top: chatMenu.top }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => startRename(chatMenu.chat)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] text-slate-600 transition hover:bg-slate-100"
              >
                <PencilLine className="h-3.5 w-3.5" />
                Ubah nama kontak
              </button>
              <div className="my-1 h-px bg-slate-100" />
              <button
                type="button"
                onClick={() => {
                  const target = chatMenu.chat;
                  setChatMenu(null);
                  setChatDelete({ chat: target, mode: 'hide' });
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] text-slate-600 transition hover:bg-slate-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus dari dashboard
              </button>
              <button
                type="button"
                disabled={!connected}
                title={
                  connected
                    ? 'Hapus chat beserta riwayatnya dari WhatsApp'
                    : 'Hubungkan nomor untuk menghapus dari WhatsApp'
                }
                onClick={() => {
                  const target = chatMenu.chat;
                  setChatMenu(null);
                  setChatDelete({ chat: target, mode: 'remote' });
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
              >
                <Eraser className="h-3.5 w-3.5" />
                Hapus dari WhatsApp
              </button>
            </div>
          </div>,
          document.body,
        )}

      <Modal
        open={!!renameChat}
        onClose={() => (savingRename ? null : setRenameChat(null))}
        title="Ubah nama kontak"
        description="Nama ini hanya tampil di dashboard. Kontak di WhatsApp pelanggan tidak berubah."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameChat(null)} disabled={savingRename}>
              Batal
            </Button>
            <Button
              onClick={saveRename}
              loading={savingRename}
              disabled={!renameDraft.trim() || renameDraft.trim() === renameChat?.name}
            >
              Simpan
            </Button>
          </>
        }
      >
        <Field label="Nama kontak" hint="Maksimal 60 karakter. Berlaku untuk semua agen.">
          <Input
            value={renameDraft}
            maxLength={60}
            autoFocus
            onChange={(event) => setRenameDraft(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && saveRename()}
            placeholder="Contoh: Kaisi Muhammad"
          />
        </Field>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={runDelete}
        loading={deleting}
        title={confirm?.mode === 'revoke' ? 'Hapus pesan untuk semua orang?' : 'Hapus pesan dari dashboard?'}
        description={
          confirm?.mode === 'revoke'
            ? 'Pesan akan ditarik dari WhatsApp semua peserta. Tindakan ini tidak dapat dibatalkan.'
            : 'Pesan akan disembunyikan dari dashboard ini. Riwayat di WhatsApp tidak berubah.'
        }
        confirmLabel={confirm?.mode === 'revoke' ? 'Hapus untuk semua' : 'Hapus pesan'}
      />

      <ConfirmDialog
        open={!!chatDelete}
        onClose={() => setChatDelete(null)}
        onConfirm={runDeleteChat}
        loading={deletingChat}
        title={
          chatDelete?.mode === 'remote'
            ? 'Hapus chat dari WhatsApp?'
            : 'Hapus chat dari dashboard?'
        }
        description={
          chatDelete?.mode === 'remote'
            ? `Chat dengan ${chatDelete?.chat?.name} beserta seluruh riwayatnya akan dihapus dari WhatsApp di semua perangkat. Tindakan ini tidak dapat dibatalkan.`
            : `Chat dengan ${chatDelete?.chat?.name} beserta riwayatnya akan dihapus dari dashboard ini. Riwayat di WhatsApp tidak berubah.`
        }
        confirmLabel={chatDelete?.mode === 'remote' ? 'Hapus dari WhatsApp' : 'Hapus chat'}
      />

      {editTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={() => {
              if (!savingEdit) setEditTarget(null);
            }}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start gap-2.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-red-200 bg-red-50 text-red-600">
                  <PencilLine className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Edit pesan terkirim</h3>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                    Pesan asli di WhatsApp akan diperbarui, bukan dikirim ulang. Berlaku maksimal 15 menit
                    setelah dikirim.
                  </p>
                </div>
              </div>
              <textarea
                autoFocus
                rows={4}
                maxLength={4096}
                value={editDraft}
                onChange={(event) => setEditDraft(event.target.value)}
                className="scroll-slim mt-4 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-[12.5px] leading-relaxed text-slate-800 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                <span>Perubahan langsung dikirim ke WhatsApp.</span>
                <span>{editDraft.length}/4096</span>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  disabled={savingEdit}
                  onClick={() => setEditTarget(null)}
                >
                  Batal
                </Button>
                <Button
                  icon={Save}
                  loading={savingEdit}
                  disabled={!editDraft.trim() || editDraft.trim() === editTarget.text}
                  onClick={saveEdit}
                >
                  Simpan edit
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {lightbox &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
              aria-label="Tutup gambar"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={lightbox}
              alt="Media WhatsApp"
              onClick={(event) => event.stopPropagation()}
              className="max-h-[88vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>,
          document.body,
        )}

    </div>
  );
}
