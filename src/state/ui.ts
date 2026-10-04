import { create } from 'zustand'

interface UiState {
  cartOpen: boolean
  menuOpen: boolean
  openCart: () => void
  closeCart: () => void
  setMenu: (open: boolean) => void
}

export const useUi = create<UiState>()((set) => ({
  cartOpen: false,
  menuOpen: false,
  openCart: () => set({ cartOpen: true, menuOpen: false }),
  closeCart: () => set({ cartOpen: false }),
  setMenu: (menuOpen) => set({ menuOpen }),
}))
