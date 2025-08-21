import { useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'

export default function AuthRedirector() {
  const { isSignedIn, isLoaded } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn && pathname !== '/dashboard') {
      navigate('/dashboard', { replace: true })
      if (import.meta.env.DEV) console.log('[AuthRedirector] → /dashboard')
      toast.success('Welcome! Redirecting to dashboard...')
    }
  }, [isLoaded, isSignedIn, pathname, navigate])

  return null
} 