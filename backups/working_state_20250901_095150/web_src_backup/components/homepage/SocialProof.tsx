export default function SocialProof() {
  return (
    <section className="relative z-10 py-12 px-6 border-y border-white/10 bg-white/5 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto text-center fade-in">
        <p className="text-gray-400 text-sm mb-6">
          Trusted by 500+ marketing teams for cross-platform competitive intelligence
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-12">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <div className="text-2xl md:text-3xl font-bold text-white">95%</div>
            <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-left whitespace-pre-line">
              time reduction in competitive research
            </div>
          </div>
          <div className="hidden sm:block h-8 w-px bg-white/20 ml-6"></div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <div className="text-2xl md:text-3xl font-bold text-white">10x</div>
            <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-left whitespace-pre-line">
              faster than manual analysis
            </div>
          </div>
          <div className="hidden sm:block h-8 w-px bg-white/20 ml-6"></div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <div className="text-2xl md:text-3xl font-bold text-white">1000+</div>
            <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-left whitespace-pre-line">
              competitor ads tracked simultaneously
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 