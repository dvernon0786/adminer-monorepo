import { SignInButton, SignUpButton } from '@clerk/clerk-react'
import { Button } from '../ui/button'

type ButtonVariant = "outline" | "default" | "link" | "destructive" | "secondary" | "ghost" | null | undefined
type ButtonSize = "sm" | "default" | "lg" | "icon" | null | undefined

export const SignInBtn = ({ to = '/dashboard', children = 'Sign in', variant = 'outline' as ButtonVariant, size = 'sm' as ButtonSize, className = '' }) => (
  <SignInButton 
    mode="modal"
    fallbackRedirectUrl={to}
  >
    <Button variant={variant} size={size} className={className} asChild={false}>
      {children}
    </Button>
  </SignInButton>
)

export const SignUpBtn = ({ to = '/dashboard', children = 'Get started', variant = 'default' as ButtonVariant, size = 'sm' as ButtonSize, className = '' }) => (
  <SignUpButton 
    mode="modal"
    fallbackRedirectUrl={to}
  >
    <Button variant={variant} size={size} className={className} asChild={false}>
      {children}
    </Button>
  </SignUpButton>
) 