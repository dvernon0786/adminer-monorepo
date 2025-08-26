import { SignInButton, SignUpButton } from '@clerk/clerk-react'
import { Button } from '../ui/button'

export const SignInBtn = ({ to = '/dashboard', children = 'Sign in', variant = 'outline', size = 'sm', className = '' }) => (
  <SignInButton fallbackRedirectUrl={to}>
    <Button variant={variant} size={size} className={className} asChild={false}>
      {children}
    </Button>
  </SignInButton>
)

export const SignUpBtn = ({ to = '/dashboard', children = 'Get started', variant = 'default', size = 'sm', className = '' }) => (
  <SignUpButton fallbackRedirectUrl={to}>
    <Button variant={variant} size={size} className={className} asChild={false}>
      {children}
    </Button>
  </SignUpButton>
) 