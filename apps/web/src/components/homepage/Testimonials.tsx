import { Star } from 'lucide-react'

export default function Testimonials() {
  const testimonials = [
    {
      quote: 'ADminer cut our competitive research time by 95%. The AI insights are absolutely game-changing for our agency clients.',
      name: 'Sarah Chen',
      title: 'Marketing Director',
      company: 'GrowthCo Digital',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=150&h=150&fit=crop&crop=face',
      rating: 5,
    },
    {
      quote: 'Finally, one dashboard for all competitor analysis. Can\'t wait for the Google and TikTok integration - this will be incredible.',
      name: 'Marcus Rodriguez',
      title: 'Founder',
      company: 'AdLabs Agency',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      rating: 5,
    },
    {
      quote: 'The strategic insights helped us identify gaps in our competitor\'s messaging. ROI was immediate and substantial.',
      name: 'Emma Thompson',
      title: 'CMO',
      company: 'TechScale Ventures',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      rating: 5,
    },
  ]

  return (
    <section id="testimonials" className="relative z-10 py-24 px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight fade-in">
            Loved by Marketing Teams Everywhere
          </h2>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto fade-in fade-1">
            Join 500+ marketing professionals using ADminer for competitive intelligence across multiple platforms.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all fade-in ${
                index === 0 ? '' : index === 1 ? 'fade-1' : 'fade-2'
              }`}
            >
              {/* Star Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, starIndex) => (
                  <Star key={starIndex} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-gray-300 mb-6 italic leading-relaxed">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.name}
                  crossOrigin="anonymous"
                  loading="lazy"
                  className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                />
                <div>
                  <div className="font-semibold text-white text-sm">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {testimonial.title}, {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 