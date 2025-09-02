import { Users, BarChart3, Zap } from 'lucide-react'

type Audience = {
  icon: React.ReactNode
  title: string
  description: string
  benefits: string[]
  gradient: string
  delay?: string
}

export default function TargetAudiences() {
  const audiences: Audience[] = [
    {
      icon: <Users className="text-white w-6 h-6" />,
      title: 'For Marketing Agencies',
      description: 'Scale cross-platform competitive research across all clients with multi-platform white-label ready reports and 10x faster client deliverables across all ad channels.',
      benefits: ['Multi-client dashboard management', 'White-label ready insights', 'Cross-platform campaign analysis'],
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <BarChart3 className="text-white w-6 h-6" />,
      title: 'For E-commerce Brands',
      description: 'Decode competitor strategies across Facebook, Google, TikTok, and more. Find positioning opportunities across all advertising platforms and optimize multi-channel ad performance.',
      benefits: ['Cross-platform competitor tracking', 'Market positioning insights', 'Multi-channel optimization'],
      gradient: 'from-purple-500 to-pink-500',
      delay: 'fade-1',
    },
    {
      icon: <Zap className="text-white w-6 h-6" />,
      title: 'For SaaS Companies',
      description: 'Crack competitor messaging strategies across all major ad platforms. Identify target audience patterns from Facebook to LinkedIn and differentiate positioning across the entire advertising ecosystem.',
      benefits: ['Cross-platform messaging analysis', 'Audience pattern identification', 'Ecosystem-wide positioning'],
      gradient: 'from-green-500 to-emerald-500',
      delay: 'fade-2',
    },
  ]

  return (
    <section className="relative z-10 py-24 px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center fade-in mb-16">
          Built for Multi-Platform Competitive Intelligence
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {audiences.map((audience, index) => (
            <div 
              key={index} 
              className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all fade-in ${audience.delay || ''}`}
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${audience.gradient} rounded-xl flex items-center justify-center mb-6`}>
                {audience.icon}
              </div>
              <h3 className="text-xl font-semibold mb-4">{audience.title}</h3>
              <p className="text-gray-400 mb-6">{audience.description}</p>
              <div className="space-y-2">
                {audience.benefits.map((benefit, benefitIndex) => (
                  <div key={benefitIndex} className="flex items-center gap-2 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0"></div>
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 