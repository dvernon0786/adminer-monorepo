import { Button } from '../ui/button'
import { useNavigate } from 'react-router-dom'
import { SignedIn, SignedOut, SignInButton, SignUpButton, useAuth } from '@clerk/clerk-react'

export default function PlatformShowcase() {
  const navigate = useNavigate()
  
  const comingSoonPlatforms = [
    { name: 'Google Ads', emoji: '📺', color: 'red' },
    { name: 'TikTok Ads', emoji: '🎵', color: 'pink' },
    { name: 'Reddit Ads', emoji: '🔶', color: 'orange' },
    { name: 'LinkedIn Ads', emoji: '💼', color: 'blue' },
    { name: 'Bing Ads', emoji: '🔍', color: 'blue' },
  ]

  return (
    <section id="platforms" className="relative z-10 py-24 px-6 lg:px-10 bg-white/5 backdrop-blur-lg border-y border-white/10">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight fade-in">
          All Major Ad Platforms in One Dashboard
        </h2>
        <p className="mt-4 text-gray-400 max-w-xl mx-auto fade-in fade-1">
          Start with Facebook ads today. Get early access to new platforms as we launch them.
        </p>

        <div className="mt-16">
          {/* Live Now */}
          <div className="mb-12 fade-in fade-2">
            <h3 className="text-xl font-semibold mb-6 text-green-400">✅ Live Now</h3>
            <div className="bg-black/70 border border-green-500/30 rounded-2xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📘</span>
              </div>
              <h4 className="text-lg font-semibold mb-2">Facebook Ad Intelligence</h4>
              <p className="text-gray-400 text-sm mb-4">
                Full competitor analysis available with strategic insights and recommendations
              </p>
              <SignedIn>
                <Button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors" onClick={() => navigate('/dashboard')}>
                  Try Now
                </Button>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal" redirectUrl="/">
                  <Button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Try Now
                  </Button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="fade-in fade-3">
            <h3 className="text-xl font-semibold mb-6 text-yellow-400">🚀 Coming Soon</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {comingSoonPlatforms.map((platform, index) => (
                <div 
                  key={index} 
                  className="coming-soon bg-black/70 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
                >
                  <div className="w-12 h-12 bg-gray-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">{platform.emoji}</span>
                  </div>
                  <h4 className="font-semibold text-sm text-center">{platform.name}</h4>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 fade-in fade-4">
            <SignedOut>
              <SignUpButton mode="modal" redirectUrl="/">
                <Button className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 transition-all hover:scale-105">
                  Join Early Access for New Platforms
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Button 
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 transition-all hover:scale-105"
                onClick={() => navigate('/dashboard')}
              >
                Access New Platforms
              </Button>
            </SignedIn>
          </div>
        </div>
      </div>
    </section>
  )
} 