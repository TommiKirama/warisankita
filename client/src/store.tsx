import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";
import type { Wasiyyah } from "./types";

interface Store {
  wasiyyah: Wasiyyah | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const Ctx = createContext<Store>({ wasiyyah: null, loading: true, error: null, reload: async () => {} });

const KEY = "warisankita.wasiyyahId";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [wasiyyah, setWasiyyah] = useState<Wasiyyah | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function bootstrap() {
    setLoading(true);
    setError(null);
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        try {
          const w = await api.getWasiyyah(saved);
          setWasiyyah(w);
          setLoading(false);
          return;
        } catch {
          localStorage.removeItem(KEY);
        }
      }
      const list = await api.listWasiyyah();
      const w = list.length ? await api.getWasiyyah(list[0].id) : await api.seedDemo();
      localStorage.setItem(KEY, w.id);
      setWasiyyah(w);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function reload() {
    if (!wasiyyah) return bootstrap();
    try {
      const w = await api.getWasiyyah(wasiyyah.id);
      setWasiyyah(w);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reload");
    }
  }

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Ctx.Provider value={{ wasiyyah, loading, error, reload }}>{children}</Ctx.Provider>;
}

export function useStore() {
  return useContext(Ctx);
}
