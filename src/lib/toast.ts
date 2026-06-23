import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (variant: ToastVariant, message: string) => string;
  dismiss: (id: string) => void;
}

/**
 * Tiny global toast store. Each entrypoint (side panel, popup, options) mounts
 * its own <ToastViewport> against this store, so non-blocking feedback replaces
 * the old native alert()s without coupling callers to any UI.
 */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (variant, message) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, variant, message }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().push('success', message),
  error: (message: string) => useToastStore.getState().push('error', message),
  info: (message: string) => useToastStore.getState().push('info', message),
};
