import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    // Sidebar
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;

    // Theme
    isDarkMode: boolean;
    toggleTheme: () => void;

    // Admin menu state
    isDesignMenuOpen: boolean;
    setDesignMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            // Sidebar
            isSidebarCollapsed: false,
            toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),

            // Theme
            isDarkMode: true,
            toggleTheme: () => set((s) => ({ isDarkMode: !s.isDarkMode })),

            // Design menu
            isDesignMenuOpen: false,
            setDesignMenuOpen: (open) => set({ isDesignMenuOpen: open }),
        }),
        {
            name: 'raynold-ui-store',
            partialize: (state) => ({
                isSidebarCollapsed: state.isSidebarCollapsed,
                isDarkMode: state.isDarkMode,
                isDesignMenuOpen: state.isDesignMenuOpen,
            }),
        }
    )
);
