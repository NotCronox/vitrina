import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useLiveSync, useStore } from '@/data'
import { useDemo } from '@/state/demo'
import { applyTheme } from '@/theme/applyTheme'
import { AdminLayout } from './AdminLayout'
import { ADMIN_THEME, useSession } from './core'
import { ConfirmDialog, Toaster } from './Feedback'
import { CategoriesPage } from './pages/CategoriesPage'
import { CustomizePage } from './pages/CustomizePage'
import { DashboardPage } from './pages/DashboardPage'
import { FieldsPage } from './pages/FieldsPage'
import { LoginPage } from './pages/LoginPage'
import { OrdersPage } from './pages/OrdersPage'
import { ProductEditPage } from './pages/ProductEditPage'
import { ProductsPage } from './pages/ProductsPage'
import { SettingsPage } from './pages/SettingsPage'
import { SetupPage } from './pages/SetupPage'

/** Panel de administracion. Se carga aparte (lazy) para no pesar en la tienda. */
export default function AdminApp() {
  useLiveSync()
  const client = useQueryClient()
  const { data, isPending } = useStore()
  const { email, status, init } = useSession()
  const templateId = useDemo((s) => s.templateId)

  useEffect(() => {
    applyTheme(ADMIN_THEME)
    return init()
  }, [init])

  // Lo que se puede ver depende de quien inicio sesion (productos ocultos, pedidos): se recarga todo.
  useEffect(() => {
    client.invalidateQueries()
  }, [email, client])

  useEffect(() => {
    if (data) document.title = `Panel · ${data.config.business.name}`
  }, [data])

  if (isPending || !data || status === 'loading') {
    return <div className="min-h-screen bg-bg" aria-busy="true" />
  }

  return (
    <>
      {email && data.uninitialized ? (
        <SetupPage />
      ) : email ? (
        <Routes>
          <Route element={<AdminLayout key={templateId} />}>
            <Route index element={<DashboardPage />} />
            <Route path="pedidos" element={<OrdersPage />} />
            <Route path="productos" element={<ProductsPage />} />
            <Route path="productos/:id" element={<ProductEditPage />} />
            <Route path="categorias" element={<CategoriesPage />} />
            <Route path="campos" element={<FieldsPage />} />
            <Route path="personalizar" element={<CustomizePage />} />
            <Route path="ajustes" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      ) : (
        <LoginPage />
      )}
      <Toaster />
      <ConfirmDialog />
    </>
  )
}
