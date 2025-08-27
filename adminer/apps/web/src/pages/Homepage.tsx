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

export default function Homepage() {
  return (
    <div className="relative bg-black text-white min-h-screen overflow-x-hidden">
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