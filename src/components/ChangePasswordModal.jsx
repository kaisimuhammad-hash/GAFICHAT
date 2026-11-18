import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Button, Field, Input, Modal } from './ui.jsx';
import { api } from '../lib/api.js';

export default function ChangePasswordModal({ open, onClose, onSaved }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setCurrent('');
      setNext('');
      setConfirm('');
      setError('');
      setLoading(false);
    }
  }, [open]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (next.length < 8) {
      setError('Password baru minimal 8 karakter.');
      return;
    }
    if (next !== confirm) {
      setError('Konfirmasi password baru tidak cocok.');
      return;
    }
    setLoading(true);
    try {
      await api.changePassword(current, next);
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ubah password"
      description="Masukkan password saat ini, lalu tentukan password baru."
      size="sm"
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Password saat ini" htmlFor="cp-current">
          <Input
            id="cp-current"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            required
          />
        </Field>
        <Field label="Password baru" htmlFor="cp-next" hint="Minimal 8 karakter.">
          <Input
            id="cp-next"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
            required
          />
        </Field>
        <Field label="Ulangi password baru" htmlFor="cp-confirm">
          <Input
            id="cp-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
          />
        </Field>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] leading-relaxed text-red-700">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" loading={loading} icon={KeyRound}>
            Simpan password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
