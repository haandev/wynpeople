import { RouterProvider } from '@tanstack/react-router'
import { WyndbaseProvider } from '@wyndbase/sdk/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { router } from './router'
import { wyndbase } from './wyndbase'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WyndbaseProvider sdk={wyndbase}>
      <RouterProvider router={router} />
    </WyndbaseProvider>
  </StrictMode>,
)
