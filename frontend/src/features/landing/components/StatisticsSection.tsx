import React from 'react';
import { motion } from 'framer-motion';
import { Counter } from './effects/Counter';
import { TrendingUp, Target, Brain, Award } from 'lucide-react';

interface Stat {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

export const StatisticsSection: React.FC = () => {
  const stats: Stat[] = [
    {
      label: 'Career Paths Indexed',
      value: 500,
      suffix: '+',
      description: 'Covering engineering, AI, product & design',
      icon: Target,
      color: 'text-indigo-400',
    },
    {
      label: 'Skills Evaluated',
      value: 12500,
      suffix: '+',
      description: 'Dissected via spaCy & custom embeddings',
      icon: Brain,
      color: 'text-cyan-400',
    },
    {
      label: 'AI Recommendation Accuracy',
      value: 98.4,
      suffix: '%',
      description: 'Validated against hiring market requirements',
      icon: Award,
      color: 'text-emerald-400',
    },
    {
      label: 'Adaptive Roadmaps Built',
      value: 18400,
      suffix: '+',
      description: 'Personalized step-by-step blueprints',
      icon: TrendingUp,
      color: 'text-purple-400',
    },
  ];

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto relative">
      <div className="rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-2xl p-8 sm:p-12 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2 p-4 rounded-2xl bg-slate-950/40 border border-white/5"
              >
                <div className={`w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center ${stat.color} border border-white/10 mb-2`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  <Counter
                    from={0}
                    to={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    duration={2.2}
                  />
                </div>
                <span className="text-sm font-bold text-slate-200">{stat.label}</span>
                <span className="text-xs text-slate-400 leading-relaxed">{stat.description}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
