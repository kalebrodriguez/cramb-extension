import { useEffect } from 'react';
import { useToastStore, type Toast, type ToastVariant } from '@/lib/toast';

const AUTO_DISMISS_MS: Record<ToastVariant, number> = {
  success: 3500,
  info: 4000,
  error: 6000,
};

const ACCENT: Record<ToastVariant, string> = {
  success: 'border-l-success',
  info: 'border-l-info',
  error: 'border-l-danger',
};

const GLYPH: Record<ToastVariant, string> = {
  success: '✓',
  info: 'ℹ',
  error: '!',
};

/**
 * Stack of dismissible toasts pinned to the bottom of whichever surface mounts
 * it. Errors stay longer and announce assertively; everything respects
 * prefers-reduced-motion via the motion-safe: enter animation.
 */
export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-toast flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS[toast.variant]);
    return () => clearTimeout(timer);
  }, [toast.variant, onDismiss]);

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      className={
        'pointer-events-auto flex items-start gap-3 rounded-md border border-border border-l-4 ' +
        ACCENT[toast.variant] +
        ' bg-elevated shadow-md px-3 py-2.5 text-sm toast-enter'
      }
    >
      <span aria-hidden="true" className="mt-px font-semibold text-muted">
        {GLYPH[toast.variant]}
      </span>
      <p className="flex-1 text-text">{toast.message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="text-faint hover:text-text transition-colors duration-fast"
      >
        ✕
      </button>
    </div>
  );
}
