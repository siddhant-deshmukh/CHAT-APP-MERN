import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppContextProvider } from './context/AppContext.tsx'
import { SocketProvider } from './context/SocketContext.tsx'
import { Toaster } from 'sonner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppContextProvider>
      <SocketProvider>
        <App />
        <Toaster position='top-right' richColors />
      </SocketProvider>
    </AppContextProvider>
  </StrictMode>,
)
