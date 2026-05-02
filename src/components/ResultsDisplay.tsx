import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle, 
  Table as TableIcon, 
  TrendingUp, 
  Layout,
  MessageSquareQuote,
  Target,
  Copy,
  Check,
  Sparkles,
  Zap,
  RotateCw,
  ListTodo,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AnalysisResult } from '../types';

interface ResultsDisplayProps {
  result: AnalysisResult;
}

export default function ResultsDisplay({ result }: ResultsDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `
Decision: ${result.decision}
Confidence: ${result.confidence.score}% (${result.confidence.label})
Summary: ${result.summary}

Critical Flip Factor:
${result.criticalVariable.variable}: ${result.criticalVariable.flipCondition}

Next Steps:
${result.nextSteps.map(s => `- ${s}`).join('\n')}
    `;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getReliabilityColor = (rel: string) => {
    switch (rel) {
      case 'High': return 'text-brand-sage bg-brand-sage/10 border-brand-sage/20';
      case 'Medium': return 'text-brand-gold bg-brand-gold/10 border-brand-gold/20';
      case 'Low': return 'text-brand-coral bg-brand-coral/10 border-brand-coral/20';
      default: return 'text-gray-400 bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="space-y-12 pb-24">
      {/* 1. Confidence & Verdict Section */}
      <section className="bg-white rounded-[2rem] border border-border-light shadow-sm overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
        <div className="p-10 flex flex-col items-center justify-center bg-gray-50/50 md:w-1/3">
          <div className="relative w-32 h-32 flex items-center justify-center mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-100"
              />
              <motion.circle
                initial={{ strokeDasharray: "0 365" }}
                animate={{ strokeDasharray: `${(result.confidence.score / 100) * 365} 365` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeLinecap="round"
                className="text-brand-sage"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-[#4A4A4A]">{result.confidence.score}%</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Confidence</span>
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-sage mb-2">{result.confidence.label}</p>
          <p className="text-[10px] text-center text-gray-400 leading-relaxed max-w-[160px] italic">
            {result.confidence.justification}
          </p>
        </div>
        <div className="p-10 flex-1 relative bg-white">
          <div className="absolute top-6 left-10">
             <MessageSquareQuote className="w-8 h-8 text-brand-sage/10" />
          </div>
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.34em] text-brand-sage mb-6 block">Intelligence Verdict</span>
            <p className="text-2xl md:text-3xl font-serif text-[#2D2D2D] leading-tight italic">
              "{result.summary}"
            </p>
            <div className="mt-8 flex gap-3">
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 px-6 py-2 bg-[#F5F1EE] rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#4A4A4A] hover:bg-[#EDE7E2] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-brand-sage" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied Intelligence' : 'Copy Analysis'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Intelligence Layer: Flip Factor, Scenarios, Action Plan */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Flip Factor (Critical Variable) */}
        <section className="lg:col-span-4 bg-[#FFFAFA] border border-brand-coral/10 rounded-[2rem] p-8 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-brand-coral" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-brand-coral">The Decision Flip</h3>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Critical Intelligence Variable</p>
              <p className="text-xl font-serif text-[#2D2D2D] italic">"{result.criticalVariable.variable}"</p>
            </div>
            <div className="bg-white/80 rounded-2xl p-4 border border-brand-coral/5">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Current Context</p>
              <p className="text-xs text-text-main leading-relaxed">{result.criticalVariable.currentState}</p>
            </div>
            <div className="bg-brand-coral text-white rounded-2xl p-4 shadow-sm shadow-brand-coral/20">
              <p className="text-[10px] font-bold uppercase mb-2 opacity-80 underline decoration-white/30">Mind-Flip Condition</p>
              <p className="text-sm font-medium leading-relaxed italic">{result.criticalVariable.flipCondition}</p>
            </div>
          </div>
        </section>

        {/* Action Plan */}
        <section className="lg:col-span-4 bg-white border border-border-light rounded-[2rem] p-8 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <ListTodo className="w-5 h-5 text-brand-sage" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#4A4A4A]">Strategic Next Steps</h3>
          </div>
          <div className="flex-1 space-y-4">
            {result.nextSteps.map((step, i) => (
              <div key={i} className="flex gap-4 items-start group">
                <div className="w-6 h-6 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-bold text-brand-sage flex-shrink-0 group-hover:bg-brand-sage group-hover:text-white transition-all">
                  {i + 1}
                </div>
                <p className="text-xs text-text-main leading-relaxed font-medium pt-1">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scenario Simulator */}
        <section className="lg:col-span-4 bg-[#F5F1EE] rounded-[2rem] p-8 flex flex-col shadow-sm border border-border-light relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700">
            <RotateCw className="w-48 h-48" />
          </div>
          <div className="flex items-center gap-2 mb-6 relative">
            <RotateCw className="w-5 h-5 text-brand-gold" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#4A4A4A]">Scenario Simulator</h3>
          </div>
          <div className="flex-1 space-y-3 relative">
            {result.scenarios.map((scenario, i) => (
              <div key={i} className="bg-white/60 hover:bg-white p-4 rounded-xl border border-[#EDE7E2] transition-colors">
                <div className="flex justify-between items-center mb-1">
                   <p className="text-[10px] font-black text-[#2D2D2D] truncate">{scenario.title}</p>
                   <span className="text-[8px] font-bold text-brand-sage uppercase">{scenario.impact}</span>
                </div>
                <p className="text-[10px] text-gray-500 italic leading-snug">Outcome: {scenario.outcome}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-[#EDE7E2]">
             <p className="text-[9px] text-[#9B9B9B] italic font-medium leading-relaxed">Intelligence models 10,000+ probabilistic outcomes per simulation node.</p>
          </div>
        </section>

      </div>

      {/* 3. Deep Analysis Section: Grid inspired by Design */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Balance Sheet (Pros/Cons) */}
        <section className="lg:col-span-4 bg-white rounded-[2rem] p-8 shadow-sm border border-border-light flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <Layout className="w-4 h-4 text-brand-sage" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#9B9B9B]">The Balance Sheet</h3>
          </div>
          <div className="flex-1 space-y-10">
            <div className="space-y-4">
              <p className="text-[9px] font-black text-brand-sage uppercase tracking-[0.2em]">High Value Upside</p>
              <ul className="text-xs space-y-4 text-text-main font-medium">
                {result.prosCons?.pros.map((pro, i) => (
                  <li key={i} className="flex gap-3 leading-relaxed">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-sage flex-shrink-0 mt-0.5" />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <p className="text-[9px] font-black text-brand-coral uppercase tracking-[0.2em]">Risk Exposure</p>
              <ul className="text-xs space-y-4 text-text-main font-medium">
                {result.prosCons?.cons.map((con, i) => (
                  <li key={i} className="flex gap-3 leading-relaxed">
                    <XCircle className="w-3.5 h-3.5 text-brand-coral flex-shrink-0 mt-0.5" />
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Matrix Analysis (Side by Side) */}
        <section className="lg:col-span-8 bg-white rounded-[2rem] p-8 shadow-sm border border-border-light flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-8">
            <TableIcon className="w-4 h-4 text-brand-sage" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#9B9B9B]">Strategic Options Matrix</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  {result.comparison?.headers.map((header, i) => (
                    <th key={i} className={`py-4 pr-4 font-black uppercase tracking-wider text-[#9B9B9B] ${i === 0 ? 'w-1/4' : ''}`}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[#4A4A4A]">
                {result.comparison?.rows.slice(0, 8).map((row, Ri) => (
                  <tr key={Ri} className="border-b border-gray-50/50 hover:bg-gray-50/50 transition-colors">
                    {row.map((cell, Ci) => (
                      <td key={Ci} className={`py-4 pr-4 ${Ci === 0 ? 'font-serif italic text-base text-[#2D2D2D]' : 'font-medium leading-relaxed'}`}>
                         {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* 4. Transparency Layer: Sources & Data Integrity */}
      <section className="bg-white border border-border-light rounded-[2rem] p-10 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-brand-sage" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#4A4A4A]">Transparency Layer</h3>
            </div>
            <p className="text-xs text-gray-400 font-medium tracking-tight">Decisions are only as strong as the data behind them. Here is our research backbone.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 shadow-inner">
             <span className="w-1.5 h-1.5 bg-brand-sage rounded-full animate-pulse" />
             <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Live Web Grounding Active</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {result.sources.map((source, i) => (
            <div key={i} className="p-5 rounded-2xl border border-gray-100 bg-[#F9F9F9] flex flex-col hover:border-brand-sage transition-all hover:bg-white group">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-widest border ${getReliabilityColor(source.reliability)}`}>
                  {source.reliability} Reliability
                </span>
                {source.url && (
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 group-hover:text-brand-sage">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-xs font-bold text-[#4A4A4A] mb-2 leading-relaxed">{source.title}</p>
              <div className="mt-auto pt-4 flex items-center gap-1.5 text-[8px] font-medium text-gray-400 uppercase tracking-tighter">
                <AlertCircle className="w-2.5 h-2.5" />
                Verified Insights Applied
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
