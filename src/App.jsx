import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { AlertTriangle, MessageSquareCode } from 'lucide-react';
import Layout from './components/Layout.jsx';
import NewChatModal from './components/NewChatModal.jsx';
import QrModal from './components/QrModal.jsx';
import QuickShortcuts from './components/QuickShortcuts.jsx';
import TicketModal from './components/TicketModal.jsx';
import Overview from './pages/Overview.jsx';
import Inbox from './pages/Inbox.jsx';
import Tickets from './pages/Tickets.jsx';
import Accounts from './pages/Accounts.jsx';
import Settings from './pages/Settings.jsx';
import Users from './pages/Users.jsx';
import ChangePasswordModal from './components/ChangePasswordModal.jsx';
import Auth from './pages/Auth.jsx';
import { Button, Spinner, ToastStack } from './components/ui.jsx';
import { api } from './lib/api.js';

const PAGE_TITLES = {
  overview: 'Ringkasan',
  inbox: 'Percakapan',
  tickets: 'Tiket',
  accounts: 'Akun WhatsApp',
  settings: 'Pengaturan AI',
  users: 'Pengguna',
};

const ADMIN_PAGES = ['overview', 'inbox', 'tickets', 'accounts', 'settings', 'users'];
const AGENT_PAGES = ['inbox', 'tickets'];

function Splash({ error, onRetry }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-5 px-6">
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-red-500 via-red-600 to-rose-600 shadow-[0_24px_60px_-20px_rgba(220,38,38,0.65)]">
        <MessageSquareCode className="h-7 w-7 text-white" />
      </div>
      <div className="text-center">
        <h1 className="text-lg font-bold tracking-tight text-slate-900">NexaDesk</h1>
        <p className="mt-1 text-xs text-slate-500">WhatsApp AI Suite</p>
      </div>
      {error ? (
        <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
          <AlertTriangle className="mx-auto h-5 w-5 text-red-600" />
          <p className="mt-2 text-xs text-red-700">
            Gagal memuat dashboard. Pastikan server API berjalan di port 8787.
          </p>
          <p className="mt-1 break-words text-[10px] text-red-600/80">{error}</p>
          <Button size="sm" variant="secondary" className="mt-3" onClick={onRetry}>
            Coba lagi
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Spinner className="h-3.5 w-3.5" /> Menyiapkan dashboard…
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [state, setState] = useState(null);
  const [bootError, setBootError] = useState('');
  const [online, setOnline] = useState([]);
  const [page, setPage] = useState('inbox');
  const [activeChatId, setActiveChatId] = useState(null);
  const [inboxAccountId, setInboxAccountId] = useState('all');
  const [ticketDraft, setTicketDraft] = useState(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [focusTicketId, setFocusTicketId] = useState(null);
  const [qrAccountId, setQrAccountId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [syncTick, setSyncTick] = useState(0);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const refreshTimer = useRef(null);

  const pushToast = useCallback((toast) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((list) => [...list.slice(-3), { id, type: 'info', ...toast }]);
    setTimeout(() => {
      setToasts((list) => list.filter((item) => item.id !== id));
    }, 5200);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((item) => item.id !== id));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await api.state();
      setState(data);
      setOnline(data.online || []);
      setBootError('');
      return data;
    } catch (err) {
      setBootError(err.message);
      return null;
    }
  }, []);

  const boot = useCallback(async () => {
    setBootError('');
    try {
      const status = await api.authStatus();
      setNeedsSetup(!!status.needsSetup);
      if (status.user) {
        setSession(status.user);
        setPage(status.user.role === 'admin' ? 'overview' : 'inbox');
        await refresh();
      } else {
        setSession(null);
        setState(null);
      }
    } catch (err) {
      setBootError(err.message);
      setSession(undefined);
    }
  }, [refresh]);

  useEffect(() => {
    boot();
  }, [boot]);

  useEffect(() => {
    const onUnauthorized = () => {
      setSession(null);
      setState(null);
      setOnline([]);
      setActiveChatId(null);
      setNewChatOpen(false);
      setBootError('');
    };
    window.addEventListener('nexadesk:unauthorized', onUnauthorized);
    return () => window.removeEventListener('nexadesk:unauthorized', onUnauthorized);
  }, []);

  useEffect(() => {
    if (!session) return undefined;
    let connectedOnce = false;
    const socket = io({ path: '/socket.io', withCredentials: true });
    socket.on('connect', () => {
      if (!connectedOnce) {
        connectedOnce = true;
        return;
      }
      setSyncTick((value) => value + 1);
      refresh();
    });
    socket.on('sync', () => {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => {
        setSyncTick((value) => value + 1);
        refresh();
      }, 140);
    });
    socket.on('presence', (list) => {
      setOnline(Array.isArray(list) ? list : []);
    });
    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        window.dispatchEvent(new Event('nexadesk:unauthorized'));
      }
    });
    socket.on('connect_error', (err) => {
      if (String(err?.message || '').toLowerCase().includes('unauthorized')) {
        window.dispatchEvent(new Event('nexadesk:unauthorized'));
      }
    });
    socket.on('qr', ({ accountId, qr }) => {
      setState((prev) =>
        prev
          ? {
              ...prev,
              accounts: prev.accounts.map((account) =>
                account.id === accountId ? { ...account, qr, status: 'qr' } : account,
              ),
            }
          : prev,
      );
    });
    socket.on('notify', (payload) => {
      pushToast({
        type: payload?.type || 'info',
        title: payload?.title,
        text: payload?.text,
      });
    });
    return () => {
      socket.disconnect();
      clearTimeout(refreshTimer.current);
    };
  }, [session, refresh, pushToast]);

  const qrAccount = state?.accounts.find((account) => account.id === qrAccountId) || null;

  useEffect(() => {
    if (!qrAccountId || !qrAccount) return;
    if (qrAccount.status === 'connected') {
      setQrAccountId(null);
      pushToast({
        type: 'success',
        title: 'WhatsApp terhubung',
        text: `${qrAccount.label} siap menerima pesan.`,
      });
    }
  }, [qrAccount, qrAccountId, pushToast]);

  const connectAccount = async (accountId) => {
    if (!accountId) return;
    setQrAccountId(accountId);
    try {
      await api.connect(accountId);
      await refresh();
    } catch (err) {
      setQrAccountId(null);
      pushToast({ type: 'error', title: 'Gagal menghubungkan', text: err.message });
    }
  };

  const restartQr = async (accountId) => {
    if (!accountId) return;
    setQrAccountId(accountId);
    try {
      await api.logout(accountId);
      await api.connect(accountId);
      await refresh();
    } catch (err) {
      pushToast({ type: 'error', title: 'Gagal membuat sesi baru', text: err.message });
    }
  };

  const logoutAccount = async (accountId) => {
    try {
      await api.logout(accountId);
      await refresh();
    } catch (err) {
      pushToast({ type: 'error', title: 'Gagal memutuskan sesi', text: err.message });
    }
  };

  const changeAccountMode = async (accountId, mode) => {
    try {
      await api.updateAccount(accountId, { mode });
      await refresh();
    } catch (err) {
      pushToast({ type: 'error', title: 'Gagal mengubah mode', text: err.message });
    }
  };

  const openChat = (chatId, targetAccountId) => {
    if (targetAccountId) setInboxAccountId(targetAccountId);
    setActiveChatId(chatId);
    setPage('inbox');
  };

  const openTicketDetail = (ticketId) => {
    setFocusTicketId(ticketId);
    setPage('tickets');
  };

  const handleTicketCreated = async (ticket) => {
    setTicketDraft(null);
    await refresh();
    if (page === 'tickets') setFocusTicketId(ticket.id);
  };

  const handleFocusHandled = useCallback(() => setFocusTicketId(null), []);

  const isAdmin = session?.role === 'admin';
  const allowedPages = isAdmin ? ADMIN_PAGES : AGENT_PAGES;
  const activePage = allowedPages.includes(page) ? page : 'inbox';

  useEffect(() => {
    if (session === null) document.title = 'Masuk · NexaDesk';
    else if (session) document.title = `${PAGE_TITLES[activePage]} · NexaDesk`;
  }, [activePage, session]);

  const handleAuthenticated = async (user) => {
    setSession(user);
    setNeedsSetup(false);
    setNewChatOpen(false);
    setPage(user.role === 'admin' ? 'overview' : 'inbox');
    await refresh();
  };

  const signOut = async () => {
    try {
      await api.signOut();
    } catch {
      // Session may already be gone; clear the client anyway.
    }
    setSession(null);
    setState(null);
    setOnline([]);
    setActiveChatId(null);
    setTicketDraft(null);
    setNewChatOpen(false);
    setQrAccountId(null);
    setPage('inbox');
  };

  if (session === undefined) {
    return (
      <>
        <Splash error={bootError} onRetry={boot} />
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  if (session === null) {
    return (
      <>
        <Auth mode={needsSetup ? 'setup' : 'login'} onAuthenticated={handleAuthenticated} />
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  if (!state) {
    return (
      <>
        <Splash error={bootError} onRetry={refresh} />
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  const pages = {
    overview: (
      <Overview
        state={state}
        onOpenChat={openChat}
        onConnect={connectAccount}
        onNavigate={setPage}
        onSetAccountMode={changeAccountMode}
        onOpenTicket={openTicketDetail}
        onNewTicket={(chatId) => setTicketDraft({ chatId })}
      />
    ),
    inbox: (
      <Inbox
        state={state}
        isAdmin={isAdmin}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        inboxAccountId={inboxAccountId}
        setInboxAccountId={setInboxAccountId}
        syncTick={syncTick}
        refresh={refresh}
        pushToast={pushToast}
        onNewTicket={(chatId) => setTicketDraft({ chatId })}
        onOpenTicket={openTicketDetail}
        onConnectAccount={connectAccount}
        onOpenSettings={() => setPage('settings')}
        onNewChat={() => setNewChatOpen(true)}
      />
    ),
    tickets: (
      <Tickets
        state={state}
        refresh={refresh}
        pushToast={pushToast}
        onOpenChat={openChat}
        onNewTicket={(chatId) => setTicketDraft({ chatId })}
        focusTicketId={focusTicketId}
        onFocusHandled={handleFocusHandled}
      />
    ),
    accounts: (
      <Accounts
        state={state}
        onConnect={connectAccount}
        onShowQr={setQrAccountId}
        onOpenInbox={(accountId) => openChat(null, accountId)}
        refresh={refresh}
        pushToast={pushToast}
      />
    ),
    settings: <Settings state={state} refresh={refresh} pushToast={pushToast} />,
    users: isAdmin ? (
      <Users me={session} online={online} pushToast={pushToast} onChanged={refresh} />
    ) : null,
  };

  return (
    <>
      <Layout
        state={state}
        me={session}
        isAdmin={isAdmin}
        online={online}
        page={activePage}
        onNavigate={setPage}
        onLogout={signOut}
        onChangePassword={() => setPasswordOpen(true)}
        toasts={toasts}
        onDismissToast={dismissToast}
      >
        {pages[activePage]}
      </Layout>

      <QrModal
        open={!!qrAccountId}
        account={qrAccount}
        onClose={() => setQrAccountId(null)}
        onRestart={() => restartQr(qrAccountId)}
      />

      <TicketModal
        open={!!ticketDraft}
        onClose={() => setTicketDraft(null)}
        chats={state.chats}
        accounts={state.accounts}
        presetChatId={ticketDraft?.chatId || ''}
        onCreated={handleTicketCreated}
        pushToast={pushToast}
      />

      <NewChatModal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        accounts={state.accounts}
        defaultAccountId={inboxAccountId !== 'all' ? inboxAccountId : ''}
        pushToast={pushToast}
        onConnectAccount={connectAccount}
        onCreated={(chatId) => {
          setActiveChatId(chatId);
          setPage('inbox');
          refresh();
        }}
      />

      <QuickShortcuts
        unread={state.stats.unread || 0}
        openTickets={state.stats.openTickets || 0}
        onNavigate={setPage}
        onNewChat={() => setNewChatOpen(true)}
      />

      <ChangePasswordModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onSaved={() => pushToast({ type: 'success', title: 'Password diperbarui' })}
      />
    </>
  );
}
