import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set) => ({
      // Categoría activa global
      categoriaActiva: 'primera',
      setCategoriaActiva: (cat) => set({ categoriaActiva: cat }),

      // Torneo activo
      torneoActivo: null,
      setTorneoActivo: (torneo) => set({ torneoActivo: torneo }),

      // Config del torneo
      configTorneo: {
        amarillas_limite: 3,
        multa_amarilla: 100,
        multa_roja: 300,
        puntos_victoria: 3,
        puntos_empate: 1,
        puntos_derrota: 0,
      },
      setConfigTorneo: (config) => set({ configTorneo: config }),

      // Sidebar abierto en desktop
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    {
      name: 'interexa-store',
      partialize: (state) => ({
        categoriaActiva: state.categoriaActiva,
        torneoActivo: state.torneoActivo,
      }),
    }
  )
)

export default useStore
