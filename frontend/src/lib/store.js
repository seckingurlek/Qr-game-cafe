import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set, get) => ({
      // Masa bilgisi
      table: null,
      setTable: (table) => set({ table }),

      // Session (nick + masa)
      session: null,
      setSession: (session) => set({ session }),

      // Aktif lobi
      activeLobby: null,
      setActiveLobby: (lobby) => set({ activeLobby: lobby }),

      // Temizle
      reset: () => set({ session: null, activeLobby: null }),
    }),
    {
      name: 'cafe-games-store',
      // Sadece session ve table kalıcı
      partialize: (state) => ({ session: state.session, table: state.table })
    }
  )
)
