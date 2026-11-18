import { useEffect, useRef, useState } from 'react';
import {
  GripVertical,
  MessageSquare,
  MessageSquarePlus,
  Pencil,
  Ticket,
  X,
  Zap,
} from 'lucide-react';
import { cn } from './ui.jsx';

const STORAGE_KEY = 'nexadesk:quick-shortcuts';
const SIZE = 56;
const EDGE = 14;

const clampPosition = ({ x, y }) => {
  const maxX = Math.max(EDGE, window.innerWidth - SIZE - EDGE);
  const maxY = Math.max(EDGE, window.innerHeight - SIZE - EDGE);
  return {
    x: Math.min(Math.max(x, EDGE), maxX),
    y: Math.min(Math.max(y, EDGE), maxY),
  };
};

const initialPosition = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      return clampPosition(saved);
    }
  } catch {
    // Posisi tersimpan rusak — pakai posisi bawaan.
  }
  const bottomGap = window.innerWidth < 768 ? 92 : 24;
  return clampPosition({
    x: window.innerWidth - SIZE - 18,
    y: window.innerHeight - SIZE - bottomGap,
  });
};

export default function QuickShortcuts({ unread = 0, openTickets = 0, onNavigate, onNewChat }) {
  const [pos, setPos] = useState(initialPosition);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const latest = useRef(pos);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    latest.current = pos;
  }, [pos]);

  useEffect(() => {
    const onResize = () => setPos((current) => clampPosition(current));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const startDrag = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer sudah lepas sebelum capture — drag tetap jalan lewat event di tombol.
    }
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pos.x,
      originY: pos.y,
      moved: false,
    };
  };

  const moveDrag = (event) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    if (!current.moved && Math.hypot(dx, dy) < 5) return;
    if (!current.moved) {
      current.moved = true;
      setDragging(true);
      setOpen(false);
    }
    const next = clampPosition({ x: current.originX + dx, y: current.originY + dy });
    latest.current = next;
    setPos(next);
  };

  const endDrag = (event) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    drag.current = null;
    if (!current.moved) return;
    suppressClick.current = true;
    setDragging(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(latest.current));
    } catch {
      // Mode privat tanpa localStorage: posisi tetap berlaku di sesi ini.
    }
  };

  const toggle = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    setOpen((value) => !value);
  };

  const run = (action) => {
    setOpen(false);
    action();
  };

  const items = [
    {
      key: 'inbox',
      label: 'Pesan',
      hint: 'Buka kotak masuk',
      icon: MessageSquare,
      badge: unread,
      onClick: () => onNavigate?.('inbox'),
    },
    {
      key: 'tickets',
      label: 'Tiket',
      hint: 'Kelola tiket pelanggan',
      icon: Ticket,
      badge: openTickets,
      onClick: () => onNavigate?.('tickets'),
    },
    {
      key: 'new-chat',
      label: 'Chat baru',
      hint: 'Mulai percakapan dari nomor',
      icon: MessageSquarePlus,
      onClick: () => onNewChat?.(),
    },
    {
      key: 'names',
      label: 'Nama & seleksi chat',
      hint: 'Ganti nama & hapus chat',
      icon: Pencil,
      onClick: () => window.dispatchEvent(new CustomEvent('ndn:open-names')),
    },
  ];

  const opensLeft = pos.x + SIZE / 2 > window.innerWidth / 2;
  const opensUp = pos.y + SIZE / 2 > window.innerHeight / 2;

  return (
    <div
      ref={wrapRef}
      className="fixed z-[2147482]"
      style={{ left: pos.x, top: pos.y, width: SIZE, height: SIZE }}
    >
      <button
        ref={buttonRef}
        type="button"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Shortcut cepat"
        title="Shortcut cepat — tahan & geser untuk memindahkan"
        style={{ touchAction: 'none' }}
        className={cn(
          'grid h-14 w-14 select-none place-items-center rounded-full text-white shadow-[0_14px_32px_-8px_rgba(190,18,60,0.65)] transition',
          'bg-gradient-to-br from-red-500 via-red-600 to-rose-600 outline-none',
          dragging ? 'scale-105 cursor-grabbing' : 'cursor-grab hover:brightness-110',
          open && !dragging && 'ring-4 ring-red-200',
        )}
      >
        {open ? <X className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Shortcut cepat"
          className="animate-pop absolute w-[236px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_24px_60px_-16px_rgba(15,23,42,0.4)]"
          style={{
            ...(opensLeft ? { right: SIZE + 10 } : { left: SIZE + 10 }),
            ...(opensUp ? { bottom: 0 } : { top: 0 }),
          }}
        >
          <p className="px-2.5 pb-1 pt-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Shortcut cepat
          </p>
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              onClick={() => run(item.onClick)}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-slate-800">
                  {item.label}
                </span>
                <span className="block truncate text-[10px] text-slate-500">{item.hint}</span>
              </span>
              {item.badge > 0 && (
                <span className="min-w-[20px] shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-center text-[10px] font-semibold text-red-700">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </button>
          ))}
          <p className="mt-1 flex items-center gap-1.5 border-t border-slate-100 px-2.5 pb-0.5 pt-2 text-[10px] text-slate-400">
            <GripVertical className="h-3 w-3" /> Tahan & geser tombol untuk pindah posisi
          </p>
        </div>
      )}
    </div>
  );
}
