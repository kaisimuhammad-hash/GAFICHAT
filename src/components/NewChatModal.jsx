import { useEffect, useMemo, useState } from 'react';
import { MessageSquarePlus, Send, WifiOff } from 'lucide-react';
import { Button, Field, Input, Modal, Select, Textarea } from './ui.jsx';
import { api } from '../lib/api.js';

export default function NewChatModal({
  open,
  onClose,
  accounts,
  defaultAccountId,
  pushToast,
  onCreated,
  onConnectAccount,
}) {
  const [accountId, setAccountId] = useState('');
  const [phone, setPhone] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === accountId) || null,
    [accounts, accountId],
  );
  const connected = selectedAccount?.status === 'connected';

  useEffect(() => {
    if (!open) return;
    const preferred = accounts.some((account) => account.id === defaultAccountId)
      ? defaultAccountId
      : accounts[0]?.id || '';
    setAccountId(preferred);
    setPhone('');
    setText('');
    setError('');
    setSending(false);
    // Reset hanya saat modal dibuka; refresh state tidak boleh menghapus ketikan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const digits = phone.replace(/\D/g, '');
  const canSubmit = !!accountId && connected && digits.length >= 7 && !sending;

  const submit = async () => {
    if (!canSubmit) return;
    setSending(true);
    setError('');
    try {
      const result = await api.startChat({
        accountId,
        phone,
        text: text.trim(),
      });
      pushToast({
        type: 'success',
        title: text.trim() ? 'Pesan terkirim' : 'Chat dibuka',
        text: result.chat.name,
      });
      onCreated?.(result.chat.id);
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chat baru"
      description="Ketik nomor WhatsApp tujuan, lalu kirim pesan pertama."
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button
            size="sm"
            icon={Send}
            loading={sending}
            disabled={!canSubmit}
            onClick={submit}
          >
            {text.trim() ? 'Kirim pesan' : 'Buka chat'}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        {accounts.length ? (
          <Field label="Kirim dari akun">
            <Select value={accountId} onChange={(event) => setAccountId(event.target.value)}>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.label}
                  {account.phone ? ` · +${account.phone}` : ''}
                  {account.status !== 'connected' ? ' · belum terhubung' : ''}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
            Belum ada akun WhatsApp. Tambahkan akun terlebih dahulu.
          </p>
        )}

        <Field
          label="Nomor WhatsApp"
          hint="Boleh diketik 0812…, 62812…, atau +62 812…. Spasi dan tanda hubung diabaikan."
        >
          <Input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            inputMode="tel"
            placeholder="0812 3456 7890"
            autoFocus
          />
        </Field>

        <Field label="Pesan pertama (opsional)">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={3}
            maxLength={4096}
            placeholder="Tulis pesan yang akan dikirim…"
          />
        </Field>

        {selectedAccount && !connected && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">Akun ini belum terhubung, pesan belum bisa dikirim.</span>
            <Button
              size="sm"
              variant="secondary"
              icon={MessageSquarePlus}
              onClick={() => onConnectAccount?.(accountId)}
            >
              Hubungkan
            </Button>
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
