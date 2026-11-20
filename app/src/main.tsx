import { RouterProvider } from '@tanstack/react-router'
import { WyndbaseProvider } from '@wyndbase/sdk/react'
import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { router } from './router'
import { wyndbase } from './wyndbase'

// Wyndbase devtools (Queries / Realtime / Session tabs), dev builds only: loaded lazily so production never ships it.
const Devtools = import.meta.env.DEV
  ? lazy(() => import('@wyndbase/sdk/devtools').then((m) => ({ default: m.WyndbaseDevtools })))
  : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WyndbaseProvider sdk={wyndbase}>
      <RouterProvider router={router} />
      {Devtools && (
        <Suspense fallback={null}>
          <Devtools client={wyndbase.queryClient} sdk={wyndbase} />
        </Suspense>
      )}
    </WyndbaseProvider>
  </StrictMode>,
)
