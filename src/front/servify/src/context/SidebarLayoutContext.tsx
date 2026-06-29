import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/* eslint-disable react-refresh/only-export-components */

type SidebarLayoutValue = {
  sidebarExpanded: boolean
  toggleSidebar: () => void
}

const SidebarLayoutContext = createContext<SidebarLayoutValue | null>(null)

export function SidebarLayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const toggleSidebar = useCallback(() => {
    setSidebarExpanded((v) => !v)
  }, [])

  const value = useMemo(
    () => ({ sidebarExpanded, toggleSidebar }),
    [sidebarExpanded, toggleSidebar],
  )

  return (
    <SidebarLayoutContext.Provider value={value}>
      {children}
    </SidebarLayoutContext.Provider>
  )
}

export function useSidebarLayout() {
  const ctx = useContext(SidebarLayoutContext)
  if (!ctx) {
    throw new Error(
      'useSidebarLayout deve ser usado dentro de SidebarLayoutProvider',
    )
  }
  return ctx
}
