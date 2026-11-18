import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  Sparkles,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { initials } from '../lib/format.js';

export function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}

const BUTTON_VARIANTS = {
  primary:
    'bg-red-600 text-white hover:bg-red-700 shadow-[0_10px_26px_-12px_rgba(220,38,38,0.6)] font-semibold',
  secondary:
    'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
  ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-[0_10px_26px_-12px_rgba(220,38,38,0.5)]',
  ai: 'bg-gradient-to-r from-red-600 to-rose-500 text-white hover:brightness-105 font-semibold shadow-[0_10px_26px_-12px_rgba(225,29,72,0.6)]',
  dark: 'bg-slate-900 text-white border border-slate-900 hover:bg-slate-800',
};

const BUTTON_SIZES = {
  sm: 'h-8 gap-1.5 px-3 text-xs rounded-lg',
  md: 'h-10 gap-2 px-4 text-sm rounded-xl',
  lg: 'h-11 gap-2 px-5 text-sm rounded-xl',
  icon: 'h-9 w-9 justify-center rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  className,
  children,
  ...props
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      )}
      {children}
    </button>
  );
}

export function IconButton({ label, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('glass card-sheen rounded-3xl', className)} {...props}>
      {children}
    </div>
  );
}

const BADGE_TONES = {
  red: 'bg-red-50 text-red-700 border-red-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function Badge({ tone = 'slate', dot = false, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none',
        BADGE_TONES[tone] || BADGE_TONES.slate,
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const AVATAR_SIZES = {
  sm: 'h-9 w-9 rounded-xl text-[11px]',
  md: 'h-11 w-11 rounded-2xl text-sm',
  lg: 'h-14 w-14 rounded-2xl text-lg',
};

const AVATAR_PALETTES = [
  ['#0f766e', '#155e75'],
  ['#6d28d9', '#4338ca'],
  ['#b45309', '#be123c'],
  ['#0369a1', '#0f766e'],
  ['#7e22ce', '#be185d'],
  ['#4d7c0f', '#0f766e'],
  ['#9f1239', '#7c2d12'],
];

export function Avatar({ name = '', size = 'md', isGroup = false, className }) {
  const hash = [...String(name)].reduce((sum, char) => sum + char.codePointAt(0), 0);
  const [from, to] = AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
  return (
    <div
      className={cn(
        'grid shrink-0 place-items-center font-semibold text-white ring-1 ring-black/5',
        AVATAR_SIZES[size],
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {isGroup ? <Users className="h-1/2 w-1/2" /> : initials(name)}
    </div>
  );
}

const STATUS_COLORS = {
  connected: 'bg-emerald-500',
  qr: 'bg-amber-500',
  connecting: 'bg-sky-500',
  disconnected: 'bg-slate-400',
};

export function StatusDot({ status = 'disconnected', className }) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 shrink-0 rounded-full',
        STATUS_COLORS[status] || STATUS_COLORS.disconnected,
        status === 'connected' && 'pulse-soft',
        className,
      )}
    />
  );
}

export function Switch({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-40',
        checked ? 'bg-red-600' : 'bg-slate-200',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.3)] transition-all duration-200',
          checked ? 'left-[22px]' : 'left-0.5',
        )}
      />
    </button>
  );
}

export function ModeToggle({ mode = 'bot', onChange, size = 'md', disabled = false }) {
  const button = (value, label, Icon) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange?.(value)}
      className={cn(
        'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed',
        size === 'sm' ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-xs',
        mode === value
          ? value === 'bot'
            ? 'bg-white text-red-600 shadow-sm shadow-red-100 ring-1 ring-red-200'
            : 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
          : 'text-slate-500 hover:text-slate-800',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );

  return (
    <div className="inline-flex w-full rounded-xl bg-slate-100 p-1 ring-1 ring-inset ring-slate-200">
      {button('bot', 'AI', Sparkles)}
      {button('manual', 'Manual', UserRound)}
    </div>
  );
}

const INPUT_CLASS =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100';

export function Input({ className, ...props }) {
  return <input className={cn(INPUT_CLASS, className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(INPUT_CLASS, 'resize-none leading-relaxed', className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(INPUT_CLASS, 'appearance-none bg-white pr-9 [&>option]:bg-white', className)}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({ label, hint, children, className, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className={cn('block', className)}>
      {label && <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>}
      {children}
      {hint && <span className="mt-1.5 block text-[11px] leading-relaxed text-slate-500">{hint}</span>}
    </label>
  );
}

const MODAL_SIZES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-3xl',
};

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'animate-pop glass-strong relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl shadow-2xl sm:rounded-3xl',
          MODAL_SIZES[size],
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
              {description && (
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
              )}
            </div>
            <IconButton label="Tutup" onClick={onClose} className="-mr-1 -mt-1">
              <X className="h-4 w-4" />
            </IconButton>
          </div>
        )}
        <div className="scroll-slim flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-drawer glass-strong relative flex h-full w-full max-w-md flex-col border-l border-slate-200 shadow-2xl">
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Hapus data ini?',
  description = 'Tindakan ini tidak dapat dibatalkan.',
  confirmLabel = 'Hapus',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-600">{description}</p>
    </Modal>
  );
}

export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-red-500', className)} />;
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {Icon && (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-red-100 bg-red-50 text-red-500">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

const TOAST_STYLES = {
  success: { box: 'border-emerald-200 bg-white', icon: CheckCircle2, color: 'text-emerald-600' },
  error: { box: 'border-red-200 bg-white', icon: AlertTriangle, color: 'text-red-600' },
  warning: { box: 'border-amber-200 bg-white', icon: AlertTriangle, color: 'text-amber-600' },
  info: { box: 'border-sky-200 bg-white', icon: Info, color: 'text-sky-600' },
};

export function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed right-3 top-3 z-[70] flex w-[min(92vw,370px)] flex-col gap-2">
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
        const ToastIcon = style.icon;
        return (
          <div
            key={toast.id}
            className={cn(
              'toast-in pointer-events-auto flex items-start gap-3 rounded-2xl border p-3.5 shadow-2xl backdrop-blur-xl',
              style.box,
            )}
          >
            <ToastIcon className={cn('mt-0.5 h-4 w-4 shrink-0', style.color)} />
            <div className="min-w-0 flex-1">
              {toast.title && <p className="text-xs font-semibold text-slate-900">{toast.title}</p>}
              {toast.text && (
                <p className="mt-0.5 break-words text-[11px] leading-relaxed text-slate-500">
                  {toast.text}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded-md p-0.5 text-slate-400 transition hover:text-slate-700"
              aria-label="Tutup notifikasi"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
