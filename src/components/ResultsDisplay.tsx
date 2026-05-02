import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  AlertCircle,
  ShieldAlert,
  Brain,
  HelpCircle,
  ArrowRight,
  Frown,
  BarChart4,
  Activity
} from 'lucide-react';
import { AnalysisResult } from '../types';

interface ResultsDisplayProps {
  result: AnalysisResult;
  onRefine: (answer: string) => void;
  onUpdateOutcome?: (status: 'success' | 'mistake' | 'learning') => void;
}

export default function ResultsDisplay({ result, onRefine, onUpdateOutcome }: ResultsDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [refinementInput, setRefinementInput] = useState('');

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
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.34em] text-brand-sage">Intelligence Verdict</span>
              {result.timestamp && (
                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{new Date(result.timestamp).toLocaleDateString()}</span>
              )}
            </div>
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

      {/* 2. Brutal Honesty Layer */}
      <AnimatePresence>
        {result.brutalTruth && result.brutalTruth !== 'N/A - Standard Mode' && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-coral/5 border-2 border-brand-coral/20 rounded-[2rem] p-10 relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 opacity-[0.05] rotate-12">
               <ShieldAlert className="w-40 h-40 text-brand-coral" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-brand-coral flex items-center justify-center text-white">
                   <ShieldAlert className="w-4 h-4" />
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-coral">Brutally Honest Critique</h3>
              </div>
              <p className="text-xl md:text-2xl font-serif text-brand-coral/90 leading-relaxed italic">
                 "{result.brutalTruth}"
              </p>
              <p className="mt-6 text-[10px] font-bold text-brand-coral/60 uppercase tracking-widest">Cognitive Bias Alert: Challenging your current logic.</p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 3. Interrogation Phase */}
      <section className="bg-white rounded-[2rem] border border-border-light p-10 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-10 h-10 bg-brand-gold/10 rounded-xl flex items-center justify-center text-brand-gold">
              <Brain className="w-5 h-5" />
           </div>
           <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#4A4A4A]">Refining the Model</h3>
              <p className="text-[10px] text-gray-400 font-medium">Answer these to reduce uncertainty and sharpen the verdict.</p>
           </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {result.interrogation?.map((q) => (
             <button
               key={q.id}
               onClick={() => setRefinementInput(q.question)}
               className="p-6 text-left rounded-2xl bg-gray-50 border border-gray-100 hover:border-brand-gold hover:bg-white transition-all group"
             >
                <div className="w-6 h-6 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-brand-gold mb-4 group-hover:scale-110 transition-transform">
                   <HelpCircle className="w-3 h-3" />
                </div>
                <p className="text-xs font-bold text-[#4A4A4A] leading-relaxed italic group-hover:text-brand-gold transition-colors">"{q.question}"</p>
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-300 mt-4 block">{q.type} Focus</span>
             </button>
          ))}
        </div>

        <div className="relative">
          <textarea 
            value={refinementInput}
            onChange={(e) => setRefinementInput(e.target.value)}
            placeholder="Respond to a question or add a missing detail..."
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-6 text-sm italic focus:bg-white focus:border-brand-gold outline-none min-h-[120px] transition-all"
          />
          <button 
            disabled={!refinementInput.trim()}
            onClick={() => onRefine(refinementInput)}
            className="absolute bottom-4 right-4 flex items-center gap-2 px-6 py-3 bg-brand-gold text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#d4a017] shadow-lg shadow-brand-gold/20 transition-all disabled:opacity-30 disabled:shadow-none"
          >
             Refine Analysis <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 2. Audit-Ready Explainability (The "DS" Layer) */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Feature Importance / Weight Breakdown */}
        <section className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm">
           <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-8 flex items-center gap-2">
              <BarChart4 className="w-4 h-4" /> Decision Weight Entropy
           </h3>
           <div className="space-y-6">
             {result.weightBreakdown?.map((w, i) => (
                <div key={i} className="space-y-2">
                   <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-brand-sage" />
                         <span className="text-[10px] font-black uppercase text-[#4A4A4A]">{w.criteria}</span>
                      </div>
                      <span className="text-[10px] font-serif italic text-brand-sage">{w.impactScore}% Impact</span>
                   </div>
                   <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${w.impactScore}%` }}
                        className="h-full bg-brand-sage"
                      />
                   </div>
                   <p className="text-[9px] text-gray-400 italic leading-relaxed">{w.description}</p>
                </div>
             ))}
           </div>
        </section>

        {/* Sensitivity Analysis */}
        <section className="bg-[#4A4A4A] text-white rounded-[2.5rem] p-10 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-[0.05]">
              <Activity className="w-24 h-24" />
           </div>
           <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-8 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Sensitivity Model
           </h3>
           <div className="space-y-4">
              {result.sensitivityAnalysis?.map((s, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                   <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] font-black uppercase tracking-tighter text-brand-gold">{s.criteria} Sensitivity</span>
                      <div className="flex items-center gap-1 text-[8px] font-bold text-brand-coral">
                         <AlertCircle className="w-2 h-2" />
                         <span>FLIP RISK</span>
                      </div>
                   </div>
                   <p className="text-xs italic leading-relaxed text-gray-300">
                      Verdict reverses if {s.criteria.toLowerCase()} weight {s.direction}s by <span className="text-white font-bold">{Math.abs(s.flipThreshold - s.currentWeight)}%</span> (to {s.flipThreshold}%).
                   </p>
                </div>
              ))}
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest text-center">Calculated using Monte Carlo Simulation Principles</p>
              </div>
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

      {/* 6. Outcome Closing Loop */}
      <section className="bg-[#4A4A4A] text-white rounded-[2rem] p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6">Outcome Tracking & Learning</h3>
            <p className="text-2xl font-serif italic mb-4">"Did this intelligence hold up?"</p>
            <p className="text-gray-400 text-xs max-w-md leading-relaxed mb-8">Closing the loop helps Tiebreaker learn your decision patterns and improve future confidence models.</p>
            
            <div className="flex flex-wrap gap-3">
               {[
                 { id: 'success', label: 'Right Decision', icon: TrendingUp, color: 'hover:bg-brand-sage' },
                 { id: 'mistake', label: 'Mistake Made', icon: Frown, color: 'hover:bg-brand-coral' },
                 { id: 'learning', label: 'Incomplete / Learning', icon: Brain, color: 'hover:bg-brand-gold' }
               ].map((status) => (
                 <button
                   key={status.id}
                   onClick={() => onUpdateOutcome?.(status.id as any)}
                   className={`flex items-center gap-3 px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest transition-all ${result.outcome?.status === status.id ? 'bg-white text-[#4A4A4A]' : status.color}`}
                 >
                   <status.icon className="w-4 h-4" />
                   {status.label}
                 </button>
               ))}
            </div>

            <AnimatePresence>
              {result.outcome?.status && result.outcome.status !== 'pending' && result.outcome.status !== 'success' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-8 space-y-4"
                >
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                    <ShieldAlert className="w-3 h-3" /> System Feed: What did we miss?
                  </p>
                  <textarea 
                    placeholder="e.g. 'I overlooked the hidden maintenance costs' or 'The market shifted faster than predicted'..."
                    defaultValue={result.outcome.notes}
                    onChange={(e) => {
                      if (onUpdateOutcome) {
                        (onUpdateOutcome as any)(result.outcome!.status, e.target.value);
                      }
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs italic focus:bg-white/10 outline-none min-h-[80px]"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter italic">This feedback will be used to calibrate the next simulation.</p>
                    <button
                      onClick={() => onRefine(`RETROSPECTIVE ANALYSIS: I marked this as ${result.outcome?.status}. My feedback: "${result.outcome?.notes}". Please investigate why this happened, find web benchmarks for these specific issues, and provide corrected solutions.`)}
                      className="px-4 py-2 bg-brand-coral/20 text-brand-coral rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-brand-coral hover:text-white transition-all border border-brand-coral/20"
                    >
                      Recalibrate Intelligence
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="w-full md:w-1/3 bg-white/5 p-8 rounded-[2rem] border border-white/10">
             <p className="text-[10px] font-black uppercase text-gray-400 mb-2 underline decoration-white/20">Learning Log Status</p>
             <p className="text-lg font-serif italic">
               {result.outcome?.status === 'pending' ? 'Decision in Progress...' : `Logged as ${result.outcome?.status.toUpperCase()}`}
             </p>
             <div className="mt-6 flex items-center gap-2 text-[8px] text-gray-500 font-bold uppercase">
                <Target className="w-3 h-3" /> System Intelligence Updated
             </div>
          </div>
        </div>
      </section>

      {/* 7. Follow-up Intelligence Thread */}
      {result.followUps && result.followUps.length > 0 && (
        <div className="space-y-12 mt-12 pt-12 border-t-2 border-dashed border-gray-100">
           <div className="flex items-center gap-3 px-6">
              <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400">Intelligence Thread (Follow-ups)</h3>
           </div>
           {result.followUps.map((followUp, idx) => (
             <div key={idx} className="relative pl-8 border-l-2 border-brand-gold/20">
                <div className="absolute top-0 left-0 -translate-x-1/2 w-4 h-4 rounded-full bg-brand-gold border-4 border-white shadow-sm" />
                <ResultsDisplay 
                  result={followUp} 
                  onRefine={onRefine} 
                  onUpdateOutcome={onUpdateOutcome} 
                />
             </div>
           ))}
        </div>
      )}
    </div>
  );
}
