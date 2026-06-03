import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import './index.css'
import App from './App.jsx'
import ClerkTokenBridge from './components/ClerkTokenBridge.jsx'

// ClerkProvider reads VITE_CLERK_PUBLISHABLE_KEY from the environment automatically.
// When the key is not set (local dev without Clerk), fall back to legacy password auth.
const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

const app = clerkEnabled ? (
  <ClerkProvider afterSignOutUrl="/">
    <ClerkTokenBridge>
      <App />
    </ClerkTokenBridge>
  </ClerkProvider>
) : (
  <App />
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {app}
  </StrictMode>,
)
