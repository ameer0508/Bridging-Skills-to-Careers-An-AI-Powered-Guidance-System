import React from 'react';
import { Sparkles, AlertCircle, HelpCircle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface AIResumeInsightsProps {
  topStrengths?: string[];
  weakSections?: string[];
  missingSections?: string[];
  parsingAmbiguities?: string[];
  recommendedImprovements?: Array<{ title: string; impact: string; suggestion: string }>;
}

export const AIResumeInsightsPanel: React.FC<AIResumeInsightsProps> = ({
  topStrengths = [],
  weakSections = [],
  missingSections = [],
  parsingAmbiguities = [],
  recommendedImprovements = []
}) => {
  const hasAnyInsights = topStrengths.length > 0 || weakSections.length > 0 || missingSections.length > 0 || parsingAmbiguities.length > 0 || recommendedImprovements.length > 0;

  return (
    <GlassPanel className="p-6 space-y-6 border-indigo-500/30">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">AI Resume Insights & Diagnostic Audit</h3>
            <p className="text-xs text-slate-400">Transformer-based semantic analysis and parsing breakdown</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
          Transformer NER v1.4
        </span>
      </div>

      {!hasAnyInsights ? (
        <div className="p-6 text-center text-xs text-slate-400 font-mono space-y-1">
          <p className="font-bold text-slate-300">No Diagnostic Insights Available</p>
          <p className="text-[11px] text-slate-500">Upload a PDF or DOCX resume to analyze strengths, section gaps, and ATS recommendations.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TOP STRENGTHS */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Top Core Strengths (Verified)
              </h4>
              <ul className="space-y-2">
                {topStrengths.length === 0 ? (
                  <li className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-500 italic">No specific strengths parsed.</li>
                ) : (
                  topStrengths.map((str, idx) => (
                    <li key={idx} className="p-3 bg-slate-950/60 border border-emerald-500/20 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* WEAK / MISSING SECTIONS */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Weak & Missing Information Gaps
              </h4>
              <ul className="space-y-2">
                {weakSections.length === 0 && missingSections.length === 0 ? (
                  <li className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-500 italic">No critical missing gaps identified.</li>
                ) : (
                  <>
                    {weakSections.map((sec, idx) => (
                      <li key={idx} className="p-3 bg-slate-950/60 border border-amber-500/20 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <span><strong>Weakness:</strong> {sec}</span>
                      </li>
                    ))}
                    {missingSections.map((sec, idx) => (
                      <li key={`m-${idx}`} className="p-3 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-slate-400 flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-1.5 shrink-0" />
                        <span><strong>Missing:</strong> {sec}</span>
                      </li>
                    ))}
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* PARSING AMBIGUITIES & RECOMMENDED IMPROVEMENTS */}
          <div className="pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Parsing Ambiguities & Variant Headings
              </h4>
              {parsingAmbiguities.length === 0 ? (
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-500 italic font-mono">
                  No section ambiguities detected.
                </div>
              ) : (
                parsingAmbiguities.map((amb, i) => (
                  <div key={i} className="p-3 bg-slate-950/60 border border-cyan-500/20 rounded-xl text-xs text-slate-300 font-mono">
                    ℹ️ {amb}
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4" />
                Recommended ATS Improvements
              </h4>
              <div className="space-y-2">
                {recommendedImprovements.length === 0 ? (
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-500 italic font-mono">
                    No explicit ATS improvements needed.
                  </div>
                ) : (
                  recommendedImprovements.map((rec, i) => (
                    <div key={i} className="p-3 bg-slate-950/60 border border-purple-500/20 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{rec.title}</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">{rec.impact}</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{rec.suggestion}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </GlassPanel>
  );
};
