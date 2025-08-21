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

    // Helper function to prevent redirect loops
    const go = (targetPath: string) => {
      if (targetPath === pathname) {
        return // Prevent redirect to same path
      }
      navigate(targetPath, { replace: true })
      if (import.meta.env.DEV) console.log(`[AuthRedirector] ${pathname} → ${targetPath}`)
    }

    // Signed-in users: redirect from public paths to dashboard
    if (isSignedIn && (pathname === '/' || pathname === '/signin' || pathname === '/signup')) {
      go('/dashboard')
      toast.success('Welcome! Redirecting to dashboard...')
      return
    }

    // Signed-out users: redirect from protected paths to signin
    if (!isSignedIn && pathname.startsWith('/dashboard')) {
      go(`/signin?redirect_url=${encodeURIComponent(pathname)}`)
      return
    }

    // No redirect needed
  }, [isLoaded, isSignedIn, pathname, navigate])

  return null
} 