import { describe, it, expect, beforeEach } from 'vitest';
import { useToastStore, toast } from '@/lib/toast';

describe('toast store', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it('pushes a toast and returns its id', () => {
    const id = toast.error('boom');
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ id, variant: 'error', message: 'boom' });
  });

  it('keeps insertion order across variants', () => {
    toast.success('a');
    toast.info('b');
    expect(useToastStore.getState().toasts.map((t) => t.message)).toEqual(['a', 'b']);
  });

  it('dismiss removes only the matching toast', () => {
    const keep = toast.success('keep');
    const drop = toast.error('drop');
    useToastStore.getState().dismiss(drop);
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].id).toBe(keep);
  });

  it('dismissing an unknown id is a no-op', () => {
    toast.info('x');
    useToastStore.getState().dismiss('nope');
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });
});
