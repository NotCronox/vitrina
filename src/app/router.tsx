import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router'
import { StoreLayout } from '@/components/layout/StoreLayout'
import { HomePage } from '@/pages/HomePage'
import { CatalogPage } from '@/pages/CatalogPage'
import { ProductPage } from '@/pages/ProductPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

// El panel va en su propio archivo: quien solo visita la tienda nunca lo descarga.
const AdminApp = lazy(() => import('@/admin/AdminApp'))

export const router = createBrowserRouter([
  {
    path: '/admin/*',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-[#f5f5f4]" />}>
        <AdminApp />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: <StoreLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'catalogo', element: <CatalogPage /> },
      { path: 'producto/:slug', element: <ProductPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
