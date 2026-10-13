import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: 'all' | 'ai' | 'access' | 'roadmaps';
}

export const IntelligenceFAQ: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'ai' | 'access' | 'roadmaps'>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'How does SkillBridge analyze my skills and resume?',
      answer:
        'SkillBridge reads the text of your PDF or DOCX resume with PyMuPDF and pdfplumber, finds the skills it names from a curated list of skills and their aliases, and reads roles, dates and education. Each value is linked to the line it came from, and scanned pages are reported rather than guessed.',
      category: 'ai',
    },
    {
      question: 'Is SkillBridge free to use for students and job seekers?',
      answer:
        'Yes. Career matching, gap analysis, roadmaps, exam practice and interview practice are free to use. SkillBridge itself runs without paid AI services.',
      category: 'access',
    },
    {
      question: 'How does SkillBridge calculate my Career Match Score?',
      answer:
        'Each of the 20 careers has a list of requirements with an importance and a weight. Your score is the weighted share of those requirements your evidence covers, and skills you have applied in roles or projects count more than skills only listed. The breakdown shows every requirement.',
      category: 'ai',
    },
    {
      question: 'What happens after I get my skill gap report?',
      answer:
        'SkillBridge builds a roadmap for your gaps, paced to the hours you set each week, with free official documentation links and practice project briefs. Completing items and adding evidence updates it.',
      category: 'roadmaps',
    },
    {
      question: 'Can I try changes to my resume before uploading a new version?',
      answer:
        'Yes. You keep one current resume, and replacing it rebuilds your skills and lists what changed. The Career Lab what-if lets you test added skills, projects or certifications without uploading anything.',
      category: 'access',
    },
  ];

  const filteredFaqs = activeCategory === 'all' ? faqs : faqs.filter((f) => f.category === activeCategory);

  return (
    <section id="faq" className="py-24 px-4 max-w-5xl mx-auto relative">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-md">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-cyan-300 tracking-wider uppercase">
            Intelligence Knowledge Base
          </span>
        </div>

        <h2 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Everything You Need To Know <br />
          <span className="bg-linear-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            About SkillBridge AI
          </span>
        </h2>

        <p className="text-slate-300 text-base sm:text-lg">
          Got questions regarding our architecture, algorithms, or guidance engine? Explore answers below.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {[
          { id: 'all', label: 'All Questions' },
          { id: 'ai', label: 'AI & Vector Engine' },
          { id: 'access', label: 'Platform & Access' },
          { id: 'roadmaps', label: 'Roadmaps & Guidance' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as typeof activeCategory)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              activeCategory === cat.id
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400 scale-105'
                : 'bg-slate-900/70 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Accordion Cards Stack */}
      <div className="space-y-4">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
              >
                <span className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {faq.question}
                </span>
                <div
                  className={`w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 border-t border-white/5 text-sm text-slate-300 leading-relaxed font-normal">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
