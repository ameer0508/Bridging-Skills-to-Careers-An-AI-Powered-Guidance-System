import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Code2, Database, Shield, Zap, Layers, Sparkles, Server } from 'lucide-react';

interface TechStackItem {
  name: string;
  category: string;
  description: string;
  icon: React.ElementType;
  color: string;
  glow: string;
}

export const TechShowcase: React.FC = () => {
  const stack: TechStackItem[] = [
    {
      name: 'React 19 & Vite',
      category: 'Frontend Core',
      description: 'Ultra-fast SPA runtime with strict mode & component isolation.',
      icon: Code2,
      color: 'text-cyan-400',
      glow: 'shadow-cyan-500/20 border-cyan-500/30',
    },
    {
      name: 'TypeScript',
      category: 'Type Safety',
      description: '100% strict type system across frontend & Node.js backend.',
      icon: Shield,
      color: 'text-blue-400',
      glow: 'shadow-blue-500/20 border-blue-500/30',
    },
    {
      name: 'FastAPI & Python',
      category: 'AI Service',
      description: 'High-performance Python ML engine with Pydantic v2 schemas.',
      icon: Cpu,
      color: 'text-emerald-400',
      glow: 'shadow-emerald-500/20 border-emerald-500/30',
    },
    {
      name: 'Node.js & Express',
      category: 'REST API',
      description: 'Enterprise Express server with Winston logging & JWT auth.',
      icon: Server,
      color: 'text-purple-400',
      glow: 'shadow-purple-500/20 border-purple-500/30',
    },
    {
      name: 'MongoDB & Mongoose',
      category: 'Database',
      description: 'Document database for user profiles, taxonomies & career graphs.',
      icon: Database,
      color: 'text-emerald-500',
      glow: 'shadow-emerald-500/20 border-emerald-500/30',
    },
    {
      name: 'Tailwind CSS v4',
      category: 'Styling',
      description: 'Custom glassmorphism design system & CSS design tokens.',
      icon: Zap,
      color: 'text-sky-400',
      glow: 'shadow-sky-500/20 border-sky-500/30',
    },
    {
      name: 'Framer Motion',
      category: 'Animations',
      description: '60 FPS spring physics, gesture tracking & scroll animations.',
      icon: Layers,
      color: 'text-pink-400',
      glow: 'shadow-pink-500/20 border-pink-500/30',
    },
    {
      name: 'TanStack Query v5',
      category: 'State & Caching',
      description: 'Zero-latency server state management & optimistic updates.',
      icon: Sparkles,
      color: 'text-amber-400',
      glow: 'shadow-amber-500/20 border-amber-500/30',
    },
  ];

  return (
    <section id="technology" className="py-24 px-4 max-w-7xl mx-auto relative">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-md">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-cyan-300 tracking-wide uppercase">
            Architectural Foundation
          </span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Powered by Enterprise-Grade <br />
          <span className="bg-linear-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Modern SaaS Technologies
          </span>
        </h2>
        <p className="text-slate-300 text-base sm:text-lg">
          SkillBridge is engineered on a resilient monorepo architecture designed for speed, scale, and intelligence.
        </p>
      </div>

      {/* Floating Tech Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stack.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className={`p-6 rounded-2xl bg-slate-900/60 border backdrop-blur-xl transition-all duration-300 ${item.glow} group hover:bg-slate-900/90`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center ${item.color} border border-white/10 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white/5 text-slate-400 uppercase tracking-wider">
                  {item.category}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">
                {item.name}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
