import { env } from '../config/env';

// In-memory store for local development (no Supabase needed)
// Mimics the Supabase JS client API surface enough for our services

type Row = Record<string, any>;

class InMemoryTable {
  private rows: Map<string, Row> = new Map();

  insert(records: Row | Row[]) {
    const items = Array.isArray(records) ? records : [records];
    const inserted: Row[] = [];
    for (const item of items) {
      const id = item.id || crypto.randomUUID();
      const record = { id, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...item };
      this.rows.set(id, record);
      inserted.push(record);
    }
    return createChainable({
      data: inserted,
      select: () => createChainable({
        data: inserted,
        single: () => createChainable({ data: inserted[0], error: null }),
      }),
      single: () => createChainable({ data: inserted[0], error: null }),
    });
  }

  select(_columns?: string) {
    const allRows = Array.from(this.rows.values());
    return createChainable({
      data: allRows,
      eq: (col: string, val: any) =>
        createChainable({
          data: allRows.filter((r) => r[col] === val),
          single: () => {
            const found = allRows.find((r) => r[col] === val) || null;
            return createChainable({ data: found, error: found ? null : new Error('Not found') });
          },
          eq: (col2: string, val2: any) => {
            // For chained .eq() like .eq('cv_id', x).eq('job_id', y)
            const filtered = allRows.filter((r) => r[col] === val && r[col2] === val2);
            return createChainable({
              data: filtered,
              single: () => createChainable({ data: filtered[0] || null, error: null }),
            });
          },
        }),
    });
  }

  update(updates: Row) {
    return createChainable({
      eq: (col: string, val: any) => {
        let found: Row | null = null;
        for (const [id, row] of this.rows) {
          if (row[col] === val) {
            Object.assign(row, { ...updates, updated_at: new Date().toISOString() });
            found = row;
          }
        }
        return createChainable({
          data: found,
          select: () => createChainable({
            data: found ? [found] : [],
            single: () => createChainable({ data: found, error: found ? null : new Error('Not found') }),
          }),
          single: () => createChainable({ data: found, error: found ? null : new Error('Not found') }),
        });
      },
    });
  }
}

class InMemoryStore {
  private tables: Record<string, InMemoryTable> = {};
  private storageFiles: Record<string, Buffer> = {};  // Persistent across from() calls

  from(table: string): InMemoryTable {
    if (!this.tables[table]) {
      this.tables[table] = new InMemoryTable();
    }
    return this.tables[table];
  }

  storage = {
    from: (bucket: string) => {
      const store = this;  // Capture InMemoryStore instance
      return {
        upload: async (path: string, file: Buffer, _opts?: any) => {
          const key = `${bucket}/${path}`;
          store.storageFiles[key] = file;
          console.log(`[MemoryStore] Stored ${file.length} bytes at ${key}`);
          return { data: { path }, error: null };
        },
        download: async (path: string) => {
          const key = `${bucket}/${path}`;
          const file = store.storageFiles[key];
          if (file) {
            console.log(`[MemoryStore] Retrieved ${file.length} bytes from ${key}`);
            return { 
              data: {
                arrayBuffer: async () => file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)
              }, 
              error: null 
            };
          }
          console.log(`[MemoryStore] NOT FOUND: ${key}`);
          return { data: null, error: new Error('File not found') };
        },
        getPublicUrl: (path: string) => {
          return { data: { publicUrl: `http://localhost:3000/mock-storage/${bucket}/${path}` } };
        },
        remove: async (_paths: string[]) => {
          return { data: null, error: null };
        },
      };
    }
  };
}

// Helper: makes any object "thenable" so `await store.from(...)` works
function createChainable<T extends Record<string, any>>(obj: T): T & PromiseLike<{ data: any; error: any }> {
  const proxy = new Proxy(obj, {
    get(target, prop) {
      if (prop === 'then') {
        return (resolve: any, _reject: any) => resolve(target);
      }
      if (prop in target) {
        return (target as any)[prop];
      }
      // Unknown property - return self to allow chaining
      return undefined;
    },
  });
  return proxy as any;
}

let _store: InMemoryStore | null = null;

export function getStore(): InMemoryStore {
  if (!_store) _store = new InMemoryStore();
  return _store;
}

export const isDevMode = () =>
  env.NODE_ENV === 'development' || env.SUPABASE_URL === 'http://localhost:54321';
