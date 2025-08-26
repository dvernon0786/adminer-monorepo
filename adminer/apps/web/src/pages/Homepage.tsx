import {
  HeroSection,
  SocialProof,
  Features,
  PlatformShowcase,
  TargetAudiences,
  Pricing,
  Testimonials,
  FinalCTA,
  ScrollToTop
} from '../components/homepage'
import ShaderBackground from '../components/shader-background'
import Navigation from '../components/navigation'
import AuthRedirector from '../components/AuthRedirector'

export default function Homepage() {
  return (
    <div className="relative bg-black text-white min-h-screen overflow-x-hidden">
      <AuthRedirector />
      <ShaderBackground />
      <Navigation />
      
      <HeroSection />
      <SocialProof />
      <Features />
      <PlatformShowcase />
      <TargetAudiences />
      <Pricing />
      <Testimonials />
      <FinalCTA />
      
      <ScrollToTop />
    </div>
  )
} 