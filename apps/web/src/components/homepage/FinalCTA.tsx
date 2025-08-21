import { Search } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton, SignUpButton, useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'

export default function FinalCTA() {
  const { isSignedIn, isLoaded } = useAuth()
  const navigate = useNavigate()

  const handleAnalyzeClick = () => {
    if (isSignedIn) {
      navigate('/dashboard')
    }
    // If not signed in, the SignInButton will handle the auth flow
  }

  return (
    <section className="relative z-10 py-24 px-6 lg:px-10 text-center">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight font-jakarta fade-in">
          Ready to Decode Your{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400">
            Competitors?
          </span>
        </h2>
        <p className="mt-6 text-lg md:text-2xl text-gray-300 fade-in fade-1">
          Start analyzing Facebook ads by keywords today. Get early access to new platforms as we launch them.
        </p>
        
        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center fade-in fade-2">
          <SignedOut>
            <SignUpButton mode="modal" redirectUrl="/">
              <Button 
                className="bg-white text-black px-8 py-4 rounded-md font-medium hover:bg-gray-100 active:scale-95 transition-all text-lg"
              >
                <Search className="w-5 h-5 mr-2" />
                Get Started - Sign Up Free
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Button 
              className="bg-white text-black px-8 py-4 rounded-md font-medium hover:bg-gray-100 active:scale-95 transition-all text-lg"
              onClick={handleAnalyzeClick}
            >
              <Search className="w-5 h-5 mr-2" />
              Start Keyword Analysis
            </Button>
          </SignedIn>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 fade-in fade-3">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>2–5 minute analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>500+ teams trust us</span>
            </div>
          </div>
        </div>

        {/* Additional Auth Options */}
        <SignedOut>
          <div className="mt-8 fade-in fade-3">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <SignInButton mode="modal" redirectUrl="/">
                <button className="text-blue-400 hover:text-blue-300 underline font-medium">
                  Sign in here
                </button>
              </SignInButton>
            </p>
          </div>
        </SignedOut>
        <SignedIn>
          <div className="mt-8 fade-in fade-3">
            <p className="text-sm text-gray-400">
              Ready to analyze?{' '}
              <button 
                className="text-blue-400 hover:text-blue-300 underline font-medium"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </button>
            </p>
          </div>
        </SignedIn>
      </div>
    </section>
  )
} 