import { SignInButton, SignUpButton, SignOutButton, useAuth, useUser } from '@clerk/clerk-react'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu'
import { ChevronDown, User, Settings, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Navigation = () => {
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  const navigate = useNavigate()

  const handleSignOut = () => {
    // After sign out, user will be redirected to homepage
    // Clerk handles this automatically
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 text-xl font-semibold tracking-tight font-jakarta">
            <span className="text-lg font-light tracking-tighter bg-black/50 border-white/10 border rounded-lg pt-1 pr-2 pb-1 pl-2 backdrop-blur-md">
              ADminer
            </span>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <a 
              href="#features" 
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Features
            </a>
            <a 
              href="#platforms" 
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Platforms
            </a>
            <a 
              href="#pricing" 
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Pricing
            </a>
            <a 
              href="#testimonials" 
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Testimonials
            </a>
          </div>
          
          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isLoaded && isSignedIn ? (
              // User is authenticated - show profile dropdown
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 p-2 hover:bg-white/10">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.imageUrl} alt={user?.fullName || 'User'} />
                      <AvatarFallback className="bg-blue-600 text-white text-sm">
                        {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm text-white">
                      {user?.firstName || user?.emailAddresses?.[0]?.emailAddress}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-black/90 border-white/20 text-white">
                  <DropdownMenuLabel className="text-gray-300">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.fullName || 'User'}
                      </p>
                      <p className="text-xs leading-none text-gray-400">
                        {user?.emailAddresses?.[0]?.emailAddress}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/20" />
                  <DropdownMenuItem className="text-white hover:bg-white/10 cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-white/10 cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/20" />
                  <SignOutButton>
                    <DropdownMenuItem className="text-red-400 hover:bg-red-400/10 cursor-pointer" onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </SignOutButton>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // User is not authenticated - show sign in buttons
              <>
                <SignInButton 
                  mode="modal"
                  afterSignInUrl="/dashboard"
                  afterSignUpUrl="/dashboard"
                >
                  <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton 
                  mode="modal"
                  afterSignInUrl="/dashboard"
                  afterSignUpUrl="/dashboard"
                >
                  <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700">
                    Get Started
                  </Button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation 