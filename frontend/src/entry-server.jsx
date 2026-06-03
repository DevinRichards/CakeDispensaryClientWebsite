import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { ClerkProvider } from '@clerk/react'
import { AppWithRouter } from './App.jsx'

const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

export function render(url) {
  const app = <AppWithRouter Router={StaticRouter} routerProps={{ location: url }} />

  return renderToString(
    clerkEnabled ? (
      <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
        {app}
      </ClerkProvider>
    ) : app
  )
}
