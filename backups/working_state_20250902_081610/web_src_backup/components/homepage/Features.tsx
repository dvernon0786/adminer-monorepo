import { Database, Brain, TrendingUp } from 'lucide-react'

type Feature = {
  icon: React.ReactNode
  title: string
  description: string
  delay: string
}

export default function Features() {
  const features: Feature[] = [
    {
      icon: <Database className="text-blue-400 w-6 h-6" />,
      title: 'Keyword-Based Ad Discovery',
      description: 'Find competitor ads by keywords, not URLs. Bulk processing of hundreds of ads with real-time ad library integration across all platforms.',
      delay: '',
    },
    {
      icon: <Brain className="text-purple-400 w-6 h-6" />,
      title: 'AI-Powered Strategic Analysis',
      description: 'Multi-format content analysis extracting messaging patterns, target audience insights, and positioning strategies.',
      delay: 'fade-1',
    },
    {
      icon: <TrendingUp className="text-cyan-400 w-6 h-6" />,
      title: 'Unified Intelligence Reports',
      description: 'Actionable recommendations to outperform competitor strategies across Facebook, Google, TikTok, Reddit, LinkedIn, and Bing.',
      delay: 'fade-2',
    },
  ]

  return (
    <section id="features" className="relative z-10 py-24 px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight fade-in">
            Complete Cross-Platform Competitive Intelligence Suite
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-gray-400 fade-in fade-1">
            Turn competitor ads into strategic advantages across all major advertising platforms.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all fade-in ${feature.delay}`}
            >
              <div className="w-12 h-12 flex items-center justify-center bg-opacity-20 rounded-md mb-6">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-3 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 