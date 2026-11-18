import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Clock,
  KeyRound,
  Search,
  ShieldCheck,
  ShieldHalf,
  UserCheck,
  UserPlus,
  Users as UsersIcon,
  Wifi,
} from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  Switch,
  cn,
} from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { formatTime, timeAgo } from '../lib/format.js';

const ROLE_META = {
  admin: { label: 'Admin', tone: 'red', icon: ShieldCheck },
  agent: { label: 'Agen', tone: 'sky', icon: UserCheck },
};

function Stat({ icon: Icon, label, value, tone = 'slate' }) {
  const tones = {
    red: 'bg-red-50 text-red-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    sky: 'bg-sky-50 text-sky-600',
    slate: 'bg-slate-100 text-slate-500',
  };
  return (
    <div className="flex items-center gap-3 bg-white px-4 py-3.5">
      <div className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', tones[tone])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">{label}</p>
        <p className="text-lg font-semibold leading-tight text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export default function Users({ me, online: liveOnline, pushToast, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [savingId, setSavingId] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'agent',
    accounts: [],
  });
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api.users());
    } catch (err) {
      pushToast({ type: 'error', title: 'Gagal memuat pengguna', text: err.message });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    load();
  }, [load]);

  const users = data?.users || [];
  const accountList = data?.accounts || [];
  const meId = me?.id || data?.meId;
  const accountIds = useMemo(() => accountList.map((account) => account.id), [accountList]);
  const onlineList = liveOnline || data?.online || [];
  const onlineIds = useMemo(() => new Set(onlineList.map((item) => item.userId)), [onlineList]);
  const onlineByUser = useMemo(
    () => new Map(onlineList.map((item) => [item.userId, item])),
    [onlineList],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term) ||
        user.role.includes(term),
    );
  }, [users, query]);

  const adminCount = users.filter((user) => user.role === 'admin' && user.active).length;
  const activeCount = users.filter((user) => user.active).length;

  const runUpdate = async (user, patch, successText) => {
    setSavingId(user.id);
    try {
      await api.updateUser(user.id, patch);
      pushToast({ type: 'success', title: successText });
      await load();
      onChanged?.();
    } catch (err) {
      pushToast({ type: 'error', title: 'Gagal memperbarui pengguna', text: err.message });
    } finally {
      setSavingId(null);
    }
  };

  const allowedFor = (user) =>
    user.role === 'admin'
      ? accountIds
      : (user.accounts || []).filter((accountId) => accountIds.includes(accountId));

  const toggleAccount = (user, account) => {
    const current = allowedFor(user);
    const chosen = current.includes(account.id)
      ? current.filter((accountId) => accountId !== account.id)
      : [...current, account.id];
    const ordered = accountIds.filter((accountId) => chosen.includes(accountId));
    runUpdate(
      user,
      { accounts: ordered },
      ordered.includes(account.id)
        ? `${user.name} kini bisa memakai ${account.label}.`
        : `Akses ${account.label} untuk ${user.name} dicabut.`,
    );
  };

  const openAdd = () => {
    setAddForm({
      name: '',
      username: '',
      password: '',
      role: 'agent',
      accounts: accountIds,
    });
    setAddError('');
    setAddOpen(true);
  };

  const submitAdd = async (event) => {
    event.preventDefault();
    setAddError('');
    if (addForm.password.length < 8) {
      setAddError('Password minimal 8 karakter.');
      return;
    }
    setAdding(true);
    try {
      const created = await api.createUser(addForm);
      setAddOpen(false);
      pushToast({
        type: 'success',
        title: 'Pengguna ditambahkan',
        text: `${created.user.name} dapat masuk sebagai ${ROLE_META[created.user.role].label}.`,
      });
      await load();
      onChanged?.();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const openReset = (user) => {
    setResetTarget(user);
    setResetPassword('');
    setResetConfirm('');
    setResetError('');
  };

  const submitReset = async (event) => {
    event.preventDefault();
    setResetError('');
    if (resetPassword.length < 8) {
      setResetError('Password minimal 8 karakter.');
      return;
    }
    if (resetPassword !== resetConfirm) {
      setResetError('Konfirmasi password tidak cocok.');
      return;
    }
    setResetting(true);
    try {
      await api.resetUserPassword(resetTarget.id, resetPassword);
      pushToast({
        type: 'success',
        title: 'Password direset',
        text:
          resetTarget.id === meId
            ? 'Password Anda diperbarui.'
            : `${resetTarget.name} harus masuk ulang dengan password baru.`,
      });
      setResetTarget(null);
      await load();
      onChanged?.();
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-red-200 bg-red-50 text-red-600">
              <UsersIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Pengguna dashboard</h2>
              <p className="mt-0.5 max-w-md text-[11px] leading-relaxed text-slate-500">
                Hanya admin yang dapat membuat akun. Agen hanya bisa membalas chat dan mengelola
                tiket pada akun WhatsApp yang diizinkan.
              </p>
            </div>
          </div>
          <Button size="sm" icon={UserPlus} onClick={openAdd}>
            Tambah pengguna
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-px border-t border-slate-100 bg-slate-100 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={UsersIcon} label="Total akun" value={users.length} />
          <Stat icon={ShieldCheck} label="Admin aktif" value={adminCount} tone="red" />
          <Stat icon={ShieldHalf} label="Akun aktif" value={activeCount} tone="sky" />
          <Stat icon={Wifi} label="Online sekarang" value={onlineList.length} tone="emerald" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama, username, atau peran…"
              className="py-2 pl-9 text-xs"
              aria-label="Cari pengguna"
            />
          </div>
          <p className="text-[10px] text-slate-400">
            Perubahan berlaku langsung · sesi lama otomatis berakhir saat dinonaktifkan
          </p>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title={query ? 'Tidak ada pengguna yang cocok' : 'Belum ada pengguna lain'}
            description={
              query
                ? 'Coba kata kunci lain atau hapus pencarian.'
                : 'Tambahkan akun agen agar tim bisa membalas chat bersama.'
            }
            action={
              !query ? (
                <Button size="sm" icon={UserPlus} onClick={openAdd}>
                  Tambah pengguna
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((user) => {
              const isOnline = onlineIds.has(user.id);
              const info = onlineByUser.get(user.id);
              const isSelf = user.id === meId;
              const role = ROLE_META[user.role] || ROLE_META.agent;
              return (
                <div
                  key={user.id}
                  className={cn(
                    'flex flex-col gap-3 px-4 py-3.5 transition sm:flex-row sm:items-center sm:gap-4',
                    !user.active && 'bg-slate-50/60',
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="relative">
                      <Avatar name={user.name} size="sm" />
                      <span
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white',
                          isOnline ? 'bg-emerald-500' : 'bg-slate-300',
                        )}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-[13px] font-semibold text-slate-800">{user.name}</p>
                        {isSelf && (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                            Anda
                          </span>
                        )}
                        {!user.active && <Badge tone="slate">Nonaktif</Badge>}
                      </div>
                      <p className="truncate text-[11px] text-slate-400">@{user.username}</p>
                      {user.role === 'agent' && accountList.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {accountList.map((account) => {
                            const allowed = allowedFor(user).includes(account.id);
                            return (
                              <button
                                key={account.id}
                                type="button"
                                disabled={savingId === user.id}
                                onClick={() => toggleAccount(user, account)}
                                title={
                                  allowed
                                    ? `Cabut akses ke ${account.label}`
                                    : `Izinkan akses ke ${account.label}`
                                }
                                className={cn(
                                  'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition',
                                  allowed
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300',
                                )}
                              >
                                <Check
                                  className={cn('h-3 w-3', allowed ? 'opacity-100' : 'opacity-25')}
                                />
                                {account.label}
                              </button>
                            );
                          })}
                          <span className="text-[10px] text-slate-400">
                            {allowedFor(user).length}/{accountIds.length} akun
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-4">
                    <div className="w-[104px] shrink-0">
                      <Select
                        value={user.role}
                        disabled={isSelf || savingId === user.id}
                        title={isSelf ? 'Anda tidak dapat mengubah peran sendiri' : 'Ubah peran'}
                        onChange={(event) => {
                          const nextRole = event.target.value;
                          if (nextRole === user.role) return;
                          runUpdate(
                            user,
                            { role: nextRole },
                            `${user.name} kini ${ROLE_META[nextRole].label}.`,
                          );
                        }}
                        className="h-8 py-1 pl-2.5 text-[11px]"
                        aria-label={`Peran ${user.name}`}
                      >
                        <option value="agent">Agen</option>
                        <option value="admin">Admin</option>
                      </Select>
                    </div>

                    <div className="w-[132px] shrink-0">
                      {isOnline ? (
                        <Badge tone="emerald" dot className="text-[10px]">
                          Online{info?.since ? ` · ${formatTime(info.since)}` : ''}
                        </Badge>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          {user.lastSeenAt
                            ? timeAgo(user.lastSeenAt)
                            : user.lastLoginAt
                              ? timeAgo(user.lastLoginAt)
                              : 'Belum pernah masuk'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={user.active}
                        disabled={isSelf || savingId === user.id}
                        label={`Aktifkan ${user.name}`}
                        onChange={(next) =>
                          runUpdate(
                            user,
                            { active: next },
                            next ? `${user.name} diaktifkan.` : `${user.name} dinonaktifkan.`,
                          )
                        }
                      />
                      <span className="hidden w-14 text-[10px] text-slate-400 sm:block">
                        {user.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      icon={KeyRound}
                      className="ml-auto sm:ml-0"
                      onClick={() => openReset(user)}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {onlineList.length > 0 && (
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <h3 className="text-xs font-semibold text-slate-800">Sedang online</h3>
            <span className="text-[10px] text-slate-400">
              {onlineList.length} pengguna · pembaruan realtime
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {onlineList.map((item) => {
              const user = users.find((entry) => entry.id === item.userId);
              return (
                <div
                  key={item.userId}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3"
                >
                  <Avatar name={user?.name || 'Pengguna'} size="sm" className="h-6 w-6 rounded-full text-[9px]" />
                  <span className="text-[11px] font-medium text-slate-700">
                    {user?.name || 'Pengguna'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {item.since ? formatTime(item.since) : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Modal
        open={addOpen}
        onClose={() => (adding ? null : setAddOpen(false))}
        title="Tambah pengguna"
        description="Akun baru langsung dapat digunakan setelah disimpan."
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)} disabled={adding}>
              Batal
            </Button>
            <Button type="submit" form="add-user-form" loading={adding} icon={UserPlus}>
              Simpan pengguna
            </Button>
          </>
        }
      >
        <form id="add-user-form" onSubmit={submitAdd} className="space-y-4">
          <Field label="Nama lengkap" htmlFor="new-name">
            <Input
              id="new-name"
              value={addForm.name}
              onChange={(event) => setAddForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Contoh: Siti Rahma"
              autoComplete="off"
              required
            />
          </Field>
          <Field
            label="Username"
            htmlFor="new-username"
            hint="3–32 karakter: huruf kecil, angka, titik, garis bawah, atau tanda hubung."
          >
            <Input
              id="new-username"
              value={addForm.username}
              onChange={(event) =>
                setAddForm((prev) => ({ ...prev, username: event.target.value.toLowerCase() }))
              }
              placeholder="contoh: siti"
              className="lowercase"
              autoCapitalize="none"
              spellCheck={false}
              autoComplete="off"
              required
            />
          </Field>
          <Field label="Password awal" htmlFor="new-password" hint="Minimal 8 karakter.">
            <Input
              id="new-password"
              type="text"
              value={addForm.password}
              onChange={(event) => setAddForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="contoh: rahasia123"
              autoComplete="new-password"
              required
            />
          </Field>
          <Field label="Peran" htmlFor="new-role">
            <Select
              id="new-role"
              value={addForm.role}
              onChange={(event) => setAddForm((prev) => ({ ...prev, role: event.target.value }))}
            >
              <option value="agent">Agen — chat &amp; tiket</option>
              <option value="admin">Admin — semua fitur</option>
            </Select>
          </Field>
          {addForm.role === 'agent' && accountList.length > 0 && (
            <Field
              label="Akun WhatsApp yang dapat diakses"
              hint="Agen hanya melihat chat, tiket, dan statistik dari akun yang dipilih."
            >
              <div className="flex flex-wrap gap-2">
                {accountList.map((account) => {
                  const on = addForm.accounts.includes(account.id);
                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() =>
                        setAddForm((prev) => ({
                          ...prev,
                          accounts: on
                            ? prev.accounts.filter((accountId) => accountId !== account.id)
                            : [...prev.accounts, account.id],
                        }))
                      }
                      className={cn(
                        'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-medium transition',
                        on
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                      )}
                    >
                      <Check className={cn('h-3.5 w-3.5', on ? 'opacity-100' : 'opacity-25')} />
                      {account.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}
          {addError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] leading-relaxed text-red-700">
              {addError}
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={!!resetTarget}
        onClose={() => (resetting ? null : setResetTarget(null))}
        title="Reset password"
        description={
          resetTarget
            ? `Buat password baru untuk ${resetTarget.name} (@${resetTarget.username}). Sesi aktif mereka akan berakhir.`
            : ''
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetTarget(null)} disabled={resetting}>
              Batal
            </Button>
            <Button
              type="submit"
              form="reset-password-form"
              loading={resetting}
              icon={KeyRound}
            >
              Simpan password
            </Button>
          </>
        }
      >
        <form id="reset-password-form" onSubmit={submitReset} className="space-y-4">
          <Field label="Password baru" htmlFor="reset-password" hint="Minimal 8 karakter.">
            <Input
              id="reset-password"
              type="text"
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
              placeholder="Password baru"
              autoComplete="new-password"
              required
            />
          </Field>
          <Field label="Ulangi password" htmlFor="reset-confirm">
            <Input
              id="reset-confirm"
              type="text"
              value={resetConfirm}
              onChange={(event) => setResetConfirm(event.target.value)}
              placeholder="Ulangi password baru"
              autoComplete="new-password"
              required
            />
          </Field>
          {resetError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] leading-relaxed text-red-700">
              {resetError}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
