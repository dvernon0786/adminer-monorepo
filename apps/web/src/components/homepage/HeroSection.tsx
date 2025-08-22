import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { SignedIn, SignedOut, SignInButton, useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { CountrySelector } from '../ui/country-selector'
import { Loader2, Search, TrendingUp, Globe } from 'lucide-react'

const analyzeFormSchema = z.object({
  keyword: z.string()
    .min(1, 'Please enter a keyword to analyze')
    .max(50, 'Keyword must be 50 characters or less')
    .refine((kw) => /^[a-zA-Z0-9,\s]+$/.test(kw), 'Only letters, numbers, commas, and spaces'),
  country: z.string().min(1, 'Please select a country'),
  adCount: z.number().min(10).max(300)
})

type AnalyzeFormData = z.infer<typeof analyzeFormSchema>

export default function HeroSection() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState('United States')
  const { isSignedIn, isLoaded } = useAuth()
  const navigate = useNavigate()
  
  // Debug logging
  if (import.meta.env.DEV) {
    console.log('HeroSection - isLoaded:', isLoaded, 'isSignedIn:', isSignedIn)
  }
  
  // Programmatic redirect after authentication
  useEffect(() => {
    if (!isLoaded) return; // Wait for auth to load
    if (isSignedIn) {
      navigate('/dashboard', { replace: true }); // Replace to avoid back-button loops
    }
  }, [isLoaded, isSignedIn, navigate]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<AnalyzeFormData>({
    resolver: zodResolver(analyzeFormSchema),
    defaultValues: {
      keyword: '',
      country: 'United States',
      adCount: 100
    }
  })

  const watchedKeyword = watch('keyword') ?? ''

  // Update form when country changes
  useEffect(() => {
    setValue('country', selectedCountry)
  }, [selectedCountry, setValue])

  const onSubmit = async (data: AnalyzeFormData) => {
    if (!isSignedIn) {
      toast.error('Please sign in to analyze Facebook ads!')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Store the analysis data in sessionStorage for dashboard pre-fill
      const PENDING_KEY = 'pendingAnalysisData'
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({
        keyword: data.keyword,
        country: data.country,
        requestedAds: data.adCount,
        startDate: undefined,
        endDate: undefined
      }))
      
      // Redirect to dashboard for analysis
      navigate('/dashboard')
      toast.success('Redirecting to dashboard for analysis...')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative z-10 pt-32 pb-20 px-6 lg:px-10">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-jakarta fade-in">
          One Dashboard to{' '}
          <span className="text-gradient">Decode All</span>
          <br />
          Competitor Ad Strategies
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mt-8 max-w-4xl mx-auto font-inter fade-in fade-1">
          Analyze hundreds of competitor ads by keywords across Facebook, Google, TikTok, Reddit, LinkedIn, and Bing in minutes. 
          Get AI-powered strategic insights that help you outperform the competition.
        </p>

        {/* Enhanced Keyword Analysis Form */}
        <div className="mt-12 max-w-3xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Keyword Input */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="keyword" className="sr-only">
                  Keywords to Analyze
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="keyword"
                    type="text"
                    placeholder="Enter keywords (e.g., coffee, fitness, skincare)..."
                    className="h-14 pl-10 text-base bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                    {...register('keyword')}
                  />
                </div>
                {errors.keyword && (
                  <p className="text-red-400 text-sm mt-2 text-left" aria-live="polite">
                    {errors.keyword.message}
                  </p>
                )}
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Enter 1-50 characters</span>
                  <span>{watchedKeyword.length}/50</span>
                </div>
              </div>
              
              <SignedOut>
                <SignInButton 
                  mode="modal" 
                  afterSignInUrl="/dashboard"
                  afterSignUpUrl="/dashboard"
                >
                  <Button
                    type="button"
                    className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Sign In to Analyze
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Button
                  type="submit"
                  disabled={isSubmitting || !isLoaded}
                  className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Start Keyword Analysis
                    </>
                  )}
                </Button>
              </SignedIn>
            </div>

            {/* Country and Ad Count Selection */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex-1 max-w-xs">
                <Label htmlFor="country" className="text-sm text-gray-300 mb-2 block">
                  <Globe className="inline w-4 h-4 mr-2" />
                  Target Country
                </Label>
                <CountrySelector
                  selectedCountry={selectedCountry}
                  onCountryChange={setSelectedCountry}
                />
              </div>

              <div className="flex-1 max-w-xs">
                <Label htmlFor="adCount" className="text-sm text-gray-300 mb-2 block">
                  <TrendingUp className="inline w-4 h-4 mr-2" />
                  Number of Ads
                </Label>
                <select
                  id="adCount"
                  className="w-full h-12 px-4 bg-white/10 border border-white/20 text-white rounded-lg focus:border-blue-400 focus:outline-none"
                  {...register('adCount', { valueAsNumber: true })}
                >
                  <option value={10}>10 ads (Free)</option>
                  <option value={50}>50 ads</option>
                  <option value={100}>100 ads (Recommended)</option>
                  <option value={200}>200 ads</option>
                  <option value={300}>300 ads (Pro)</option>
                </select>
              </div>
            </div>

            {/* Form Info */}
            <div className="text-center text-sm text-gray-400">
              <p>Analysis typically takes 2–5 minutes • Free users limited to 10 ads per month</p>
              <p className="text-xs mt-1">Upgrade to Pro for 500 ads per month • Enterprise for unlimited</p>
            </div>
          </form>
          
          {/* Authentication Prompt */}
          <SignedOut>
            <p className="text-sm text-gray-400 mt-4">
              Already have an account?{' '}
              <SignInButton 
                mode="modal" 
                afterSignInUrl="/dashboard"
                afterSignUpUrl="/dashboard"
              >
                <button className="text-blue-400 hover:text-blue-300 underline">
                  Sign in here
                </button>
              </SignInButton>
            </p>
          </SignedOut>
          <SignedIn>
            <p className="text-sm text-gray-400 mt-4">
              Ready to analyze?{' '}
              <button 
                className="text-blue-400 hover:text-blue-300 underline"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </button>
            </p>
          </SignedIn>
        </div>
      </div>
    </section>
  )
} 