import { useEffect } from 'react'
import { useAuth } from '@clerk/react'
import { setClerkTokenGetter } from '../auth/clerkToken'

export default function ClerkTokenBridge({ children }) {
  const { getToken } = useAuth()

  useEffect(() => {
    setClerkTokenGetter(getToken)
    return () => setClerkTokenGetter(null)
  }, [getToken])

  return children
}
