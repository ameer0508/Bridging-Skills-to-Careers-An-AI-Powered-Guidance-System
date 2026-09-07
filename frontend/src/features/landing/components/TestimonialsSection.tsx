import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { TiltCard } from './effects/TiltCard';

interface Testimonial {
  name: string;
  role: string;
  company: string;
  avatar: string;
  text: string;
  metric: string;
  stars: number;
}

export const TestimonialsSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials: Testimonial[] = [
    {
      name: 'Alex Rivera',
      role: 'AI Systems Engineer',
      company: 'NextGen Scale AI',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      text: 'SkillBridge identified my exact missing skills in vector databases and CUDA optimization. The adaptive roadmap helped me land an AI Engineer role in under 6 weeks.',
      metric: 'Transitioned to $165k AI Role',
      stars: 5,
    },
    {
      name: 'Sophia Chen',
      role: 'Senior Full-Stack Architect',
      company: 'Vanguard SaaS',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      text: 'The resume parsing and ATS index scoring are remarkably accurate. It turned my generic resume into a highly targeted application asset.',
      metric: '98/100 ATS Score Achieved',
      stars: 5,
    },
    {
      name: 'Marcus Vance',
      role: 'Cloud Operations Lead',
      company: 'Apex Cloud Solutions',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      text: 'SkillBridge eliminated the guesswork from my career advancement. The explainable AI breakdowns showed me exactly why certain skills mattered for promotion.',
      metric: 'Promoted in 2 Months',
      stars: 5,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section className="py-24 px-4 max-w-7xl mx-auto relative">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-xs font-semibold text-indigo-300 tracking-wide uppercase">
            User Impact & Success
          </span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Trusted by Engineers & <br />
          <span className="bg-linear-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
            Ambitious Tech Leaders
          </span>
        </h2>
        <p className="text-slate-300 text-base sm:text-lg">
          Read how professionals leveraged SkillBridge to bridge skill gaps and accelerate their careers.
        </p>
      </div>

      <TiltCard glowColor="rgba(168, 85, 247, 0.2)" className="p-8 sm:p-12 max-w-4xl mx-auto relative">
        <Quote className="w-12 h-12 text-indigo-500/20 absolute top-6 right-6" />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-6 relative z-10"
          >
            {/* Stars */}
            <div className="flex items-center gap-1">
              {[...Array(testimonials[currentIndex].stars)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>

            {/* Testimonial Quote */}
            <p className="text-lg sm:text-xl font-medium text-slate-100 italic leading-relaxed">
              "{testimonials[currentIndex].text}"
            </p>

            {/* Author Profile */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={testimonials[currentIndex].avatar}
                  alt={testimonials[currentIndex].name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/40"
                />
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    {testimonials[currentIndex].name}
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  </h4>
                  <p className="text-xs text-slate-400">
                    {testimonials[currentIndex].role} @ {testimonials[currentIndex].company}
                  </p>
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                {testimonials[currentIndex].metric}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center gap-3 mt-8 pt-4">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIndex === idx ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </TiltCard>
    </section>
  );
};
