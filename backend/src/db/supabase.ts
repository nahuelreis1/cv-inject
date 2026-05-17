import { getStore } from './memory-store';

console.log('💾 Using in-memory storage (data resets on restart)');

const memStore = getStore();

// Proxy that routes everything to the in-memory store
export const supabase = new Proxy({} as any, {
  get(_target, prop: string) {
    return (memStore as any)[prop];
  },
});
