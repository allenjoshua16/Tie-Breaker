import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle,
  AlignmentType
} from 'docx';
import { 
  CheckCircle2, 
  XCircle, 
  Scale,
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
  Loader2,
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
  Activity,
  Calculator,
  Compass,
  Download,
  Share2,
  Lock,
  EyeOff,
  Map as MapIcon
} from 'lucide-react';
import { AnalysisResult } from '../types';
import DecisionSimulation from './DecisionSimulation';
import DecisionMap from './DecisionMap';

interface ResultsDisplayProps {
  result: AnalysisResult;
  onRefine: (answer: string) => void;
  onUpdateOutcome?: (status: 'pending' | 'success' | 'mistake' | 'learning', notes?: string, committedAt?: number) => void;
}

export default function ResultsDisplay({ result, onRefine, onUpdateOutcome, depth = 0 }: ResultsDisplayProps & { depth?: number }) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [refinementInput, setRefinementInput] = useState('');
  const [localNotes, setLocalNotes] = useState(result.outcome?.notes || '');
  const lastNotesUpdate = useRef<string>(result.outcome?.notes || '');

  // Reset local notes when result ID changes significantly
  useEffect(() => {
    if (result.id) {
      setLocalNotes(result.outcome?.notes || '');
      lastNotesUpdate.current = result.outcome?.notes || '';
    }
  }, [result.id]);

  // Debounce notes update
  useEffect(() => {
    if (localNotes === lastNotesUpdate.current) return;
    
    const handler = setTimeout(() => {
      if (onUpdateOutcome && localNotes !== lastNotesUpdate.current) {
        lastNotesUpdate.current = localNotes;
        onUpdateOutcome(result.outcome?.status || 'pending', localNotes);
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [localNotes, onUpdateOutcome, result.outcome?.status]);

  const handleCopy = () => {
    const text = `
Decision: ${result.decision}
Verdict: ${result.verdict}
Confidence: ${result.confidence.score}%
Intelligence Report: ${result.summary}
    `;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const shareText = `Tiebreaker Analysis: "${result.decision}"\nVerdict: ${result.verdict}\nView Full Intelligence Report at: https://tiebreaker.app/share/${result.id}`;
    navigator.clipboard.writeText(shareText);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleExport = async () => {
    try {
      const sections = [];

      // 1. Title and Metadata
      sections.push(
        new Paragraph({
          text: "Tiebreaker Intelligence Report",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Generated on: ", bold: true }),
            new TextRun(new Date().toLocaleString()),
          ],
          alignment: AlignmentType.RIGHT,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Decision ID: ", bold: true }),
            new TextRun(result.id),
          ],
          alignment: AlignmentType.RIGHT,
        }),
        new Paragraph({ text: "", spacing: { after: 200 } })
      );

      // 2. Original Dilemma
      sections.push(
        new Paragraph({
          text: "Original Dilemma",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: result.decision, italics: true }),
          ],
          spacing: { after: 400 },
        })
      );

      // 3. Intelligence Verdict
      sections.push(
        new Paragraph({
          text: "Intelligence Verdict",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Primary Option: ", bold: true }),
            new TextRun({ text: result.verdict, color: "E76F51", bold: true }), // Brand Coral
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Confidence Index: ", bold: true }),
            new TextRun({ text: `${result.confidence.score}%`, bold: true }),
            new TextRun({ text: ` (${result.confidence.label})`, italics: true }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Justification: ", bold: true }),
            new TextRun(result.confidence.justification),
          ],
        }),
        new Paragraph({
          text: result.summary,
          spacing: { before: 200, after: 400 },
        })
      );

      // 4. Strategic Comparison
      if (result.comparison) {
        const rows = [
          new TableRow({
            children: result.comparison.headers.map(h => 
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                shading: { fill: "F5F5F5" },
              })
            ),
          }),
          ...result.comparison.rows.map(row => 
            new TableRow({
              children: getRowCells(row).map(cell => 
                new TableCell({
                  children: [new Paragraph({ text: cell })],
                })
              ),
            })
          ),
        ];

        sections.push(
          new Paragraph({
            text: "Strategic Matrix",
            heading: HeadingLevel.HEADING_1,
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: rows,
          }),
          new Paragraph({ text: "", spacing: { after: 400 } })
        );
      }

      // 5. Pros and Cons
      if (result.prosCons) {
        sections.push(
          new Paragraph({
            text: "Balance Sheet",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: "High Value Upside", heading: HeadingLevel.HEADING_2 }),
          ...result.prosCons.pros.map(pro => new Paragraph({ text: `• ${pro}`, spacing: { after: 100 } })),
          new Paragraph({ text: "Risk Exposure", heading: HeadingLevel.HEADING_2 }),
          ...result.prosCons.cons.map(con => new Paragraph({ text: `• ${con}`, spacing: { after: 100 } })),
          new Paragraph({ text: "", spacing: { after: 400 } })
        );
      }

      // 6. Risk Patterns & Brutal Truth
      if (result.emotionalIntelligence || result.brutalTruth) {
        sections.push(
          new Paragraph({
            text: "Risk Patterns & Cognitive Biases",
            heading: HeadingLevel.HEADING_1,
          })
        );

        if (result.brutalTruth) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: "Brutal Truth: ", bold: true, color: "E76F51" }),
                new TextRun({ text: result.brutalTruth, italics: true }),
              ],
              spacing: { after: 200 },
            })
          );
        }

        if (result.emotionalIntelligence) {
           sections.push(
             new Paragraph({
               children: [new TextRun({ text: "Decision Environment: ", bold: true }), new TextRun(result.emotionalIntelligence.decisionEnvironment)],
               spacing: { after: 200 }
             }),
             ...result.emotionalIntelligence.biases.map(b => new Paragraph({
               children: [
                 new TextRun({ text: `${b.bias} (${b.severity}% intensity): `, bold: true }),
                 new TextRun({ text: b.mitigation, italics: true })
               ],
               spacing: { after: 100 }
             }))
           );
        }
        sections.push(new Paragraph({ text: "", spacing: { after: 400 } }));
      }

      // 7. Scenarios
      if (result.scenarios && result.scenarios.length > 0) {
        sections.push(
          new Paragraph({
            text: "Scenario Modeling",
            heading: HeadingLevel.HEADING_1,
          }),
          ...result.scenarios.map(s => [
            new Paragraph({ text: s.title, heading: HeadingLevel.HEADING_2 }),
            new Paragraph({
              children: [
                new TextRun({ text: "Impact: ", bold: true }),
                new TextRun(s.impact),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Outcome: ", bold: true }),
                new TextRun(s.outcome),
              ],
              spacing: { after: 200 },
            }),
          ]).flat()
        );
      }

      // 8. Sources
      if (result.sources && result.sources.length > 0) {
        sections.push(
          new Paragraph({
            text: "Data Sources & Grounding",
            heading: HeadingLevel.HEADING_1,
          }),
          ...result.sources.map(s => new Paragraph({
            children: [
              new TextRun({ text: `• ${s.title}`, bold: true }),
              new TextRun({ text: ` [Reliability: ${s.reliability}]`, italics: true }),
              ...(s.url ? [new TextRun({ text: ` URL: ${s.url}`, size: 16 })] : []),
            ],
            spacing: { after: 100 },
          }))
        );
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: sections,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tiebreaker_report_${result.id.slice(0, 8)}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate Word report", err);
      // Fallback to JSON if Word fails for some reason
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tiebreaker_${result.id.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getReliabilityColor = (rel: string) => {
    switch (rel) {
      case 'High': return 'text-brand-sage bg-brand-sage/10 border-brand-sage/20';
      case 'Medium': return 'text-brand-gold bg-brand-gold/10 border-brand-gold/20';
      case 'Low': return 'text-brand-coral bg-brand-coral/10 border-brand-coral/20';
      default: return 'text-gray-400 bg-gray-100 border-gray-200';
    }
  };

  // Legacy compatibility for old data structure
  const getRowCells = (row: any): string[] => {
    if (Array.isArray(row)) return row;
    if (row && typeof row === 'object' && Array.isArray(row.cells)) return row.cells;
    return [];
  };

  const getSafeDate = (ts: any) => {
    try {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? 'Recently' : d.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-12 pb-24">
      {result.error && (
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-brand-coral/5 border border-brand-coral/20 rounded-[2.5rem] p-12 text-center"
        >
           <div className="w-20 h-20 bg-brand-coral/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <ShieldAlert className="w-10 h-10 text-brand-coral" />
           </div>
           <h3 className="text-2xl font-serif text-[#2D2D2D] mb-4">Verification Intelligence Failed</h3>
           <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed mb-8">
             {result.error}
           </p>
           <div className="flex justify-center gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-[#4A4A4A] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2D2D2D] transition-all"
              >
                Reset Engine
              </button>
           </div>
        </motion.section>
      )}

      {!result.error && (
        <>
          {/* 1. Confidence & Verdict Section */}
      <section className="bg-white rounded-[2.5rem] border border-border-light shadow-sm overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
        <div className="p-10 flex flex-col items-center justify-center bg-gray-50/50 md:w-1/3">
          <div className="relative w-32 h-32 flex items-center justify-center mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                className="text-gray-200"
              />
              <motion.circle
                initial={{ strokeDasharray: "0 365" }}
                animate={{ strokeDasharray: `${(result.confidence.score / 100) * 365} 365` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeLinecap="round"
                className="text-brand-sage"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-[#4A4A4A]">{result.confidence.score}%</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-1">Index</span>
            </div>
          </div>
          
          <div className="text-center space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-sage mb-1">{result.confidence.label}</p>
              <p className="text-[10px] text-gray-400 leading-relaxed italic max-w-[180px]">
                {result.confidence.justification}
              </p>
            </div>

            {result.confidenceBreakdown && (
              <div className="pt-4 border-t border-gray-100 space-y-3">
                 <div className="flex items-center gap-2 text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                    <Calculator className="w-2.5 h-2.5" /> Stability Breakdown
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded-lg border border-gray-100">
                       <p className="text-[10px] font-black text-[#4A4A4A]">{result.confidenceBreakdown.consistency}%</p>
                       <p className="text-[6px] font-bold text-gray-400 uppercase">Consistency</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-100">
                       <p className="text-[10px] font-black text-[#4A4A4A]">{result.confidenceBreakdown.variance}%</p>
                       <p className="text-[6px] font-bold text-gray-400 uppercase">Variance</p>
                    </div>
                 </div>
                 <p className="text-[7px] text-gray-400 font-mono italic">{result.confidenceBreakdown.formula}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-10 flex-1 relative bg-white">
          <div className="absolute top-6 left-10">
             <MessageSquareQuote className="w-8 h-8 text-brand-sage/10" />
          </div>
          <div className="relative z-1">
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.34em] text-brand-sage">Intelligence Verdict</span>
              </div>
              {result.timestamp && (
                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{getSafeDate(result.timestamp)}</span>
              )}
            </div>
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-coral/10 rounded-lg">
                <Target className="w-3.5 h-3.5 text-brand-coral" />
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-coral">Primary Option: {result.verdict}</span>
              </div>
              <p className="text-2xl md:text-3xl font-serif text-[#2D2D2D] leading-tight italic">
                "{result.summary}"
              </p>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-100">
               <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sharpen Intelligence Report</p>
               </div>
               <div className="flex gap-4">
                  <div className="flex-1 relative">
                     <input 
                        type="text" 
                        value={refinementInput}
                        onChange={(e) => setRefinementInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && refinementInput.trim()) {
                            onRefine(refinementInput);
                            setRefinementInput('');
                          }
                        }}
                        placeholder="Add missing context or ask a follow-up question..."
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-brand-sage focus:ring-1 focus:ring-brand-sage/20 outline-none transition-all pr-12"
                     />
                     <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">Enter</span>
                     </div>
                  </div>
                  <button
                    onClick={() => {
                      if (refinementInput.trim()) {
                        onRefine(refinementInput);
                        setRefinementInput('');
                      }
                    }}
                    disabled={!refinementInput.trim()}
                    className="px-6 py-3 bg-brand-sage text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#6f8d86] shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Zap className="w-3.5 h-3.5" /> Refine
                  </button>
               </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#F5F1EE] rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#4A4A4A] hover:bg-[#EDE7E2] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-brand-sage" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied Model' : 'Copy Logic'}
              </button>
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#F5F1EE] rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#4A4A4A] hover:bg-[#EDE7E2] transition-colors border border-transparent hover:border-brand-sage/20"
              >
                {shared ? <Check className="w-3.5 h-3.5 text-brand-sage" /> : <Share2 className="w-3.5 h-3.5" />}
                {shared ? 'Link Shared' : 'Share Internal'}
              </button>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-brand-sage hover:border-brand-sage/20 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Download .DOCX
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Decision Simulation Engine (The Elite Differentiator) */}
      <DecisionSimulation 
        result={result} 
        onCommit={(option) => onUpdateOutcome?.(result.outcome?.status || 'pending', result.outcome?.notes, Date.now())}
      />

      {/* 1.5. Spatial Intelligence Layer */}
      {result.mapData && (
        <div className="grid lg:grid-cols-12 gap-8">
             <motion.section 
               initial={{ opacity: 0, x: -20 }}
               whileInView={{ opacity: 1, x: 0 }}
               className="lg:col-span-12"
             >
                <div className="mb-6 flex items-center gap-3">
                   <div className="w-8 h-8 rounded-xl bg-brand-sage/10 flex items-center justify-center text-brand-sage">
                      <MapIcon className="w-4 h-4" />
                   </div>
                   <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-sage">Spatial Analysis & Routing</h3>
                </div>
                <DecisionMap data={result.mapData} />
             </motion.section>
        </div>
      )}

      {/* 2. Emotional Intelligence & Brutal Honesty */}
      <div className="grid lg:grid-cols-12 gap-8">
        <section className="lg:col-span-12">
          <AnimatePresence>
            {(result.emotionalIntelligence || result.brutalTruth) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-brand-coral/5 border border-brand-coral/20 rounded-[2.5rem] p-10 relative overflow-hidden"
              >
                <div className="absolute -top-10 -right-10 opacity-[0.05] rotate-12">
                   <Brain className="w-48 h-48 text-brand-coral" />
                 </div>
                <div className="relative z-1 grid md:grid-cols-12 gap-12">
                  <div className="md:col-span-7">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-xl bg-brand-coral flex items-center justify-center text-white">
                         <ShieldAlert className="w-4 h-4" />
                      </div>
                      <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-coral">Cognitive Bias & Environmental Scan</h3>
                    </div>
                    {result.brutalTruth && (
                      <p className="text-xl font-serif text-brand-coral/90 leading-relaxed italic mb-8">
                         "{result.brutalTruth}"
                      </p>
                    )}
                    <p className="text-[10px] font-bold text-brand-coral/60 uppercase tracking-widest">
                       Context: {result.emotionalIntelligence?.decisionEnvironment || "Mixed emotional/rational environment detected."}
                    </p>
                  </div>
                  
                  <div className="md:col-span-5 space-y-4">
                    <p className="text-[10px] font-black text-brand-coral/40 uppercase tracking-[0.2em] mb-2">Detected Risk Patterns</p>
                    {result.emotionalIntelligence?.biases.map((b, i) => (
                      <div key={i} className="p-4 bg-white/40 rounded-2xl border border-brand-coral/10">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black text-brand-coral uppercase">{b.bias}</span>
                          <span className="text-[8px] font-bold text-brand-coral/60">{b.severity}% Intensity</span>
                        </div>
                        <div className="h-1 bg-brand-coral/10 rounded-full mb-3">
                           <div className="h-full bg-brand-coral" style={{ width: `${b.severity}%` }} />
                        </div>
                        <p className="text-[9px] text-brand-coral/80 font-medium leading-relaxed italic">
                           Fix: {b.mitigation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* 2. Tables & Matrices */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Balance Sheet (Pros/Cons) */}
        <section className="lg:col-span-4 bg-white rounded-[2.5rem] p-10 shadow-sm border border-border-light flex flex-col">
          <div className="flex items-center gap-2 mb-10">
            <Layout className="w-4 h-4 text-brand-sage" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#9B9B9B]">Option Comparison</h3>
          </div>
          <div className="flex-1 space-y-12">
            <div className="space-y-6">
              <p className="text-[9px] font-black text-brand-sage uppercase tracking-[0.2em] mb-4">High Value Upside</p>
              <ul className="text-xs space-y-5 text-text-main font-medium">
                {result.prosCons?.pros.map((pro, i) => (
                  <li key={i} className="flex gap-4 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-brand-sage flex-shrink-0" />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <p className="text-[9px] font-black text-brand-coral uppercase tracking-[0.2em] mb-4">Risk Exposure</p>
              <ul className="text-xs space-y-5 text-text-main font-medium">
                {result.prosCons?.cons.map((con, i) => (
                  <li key={i} className="flex gap-4 leading-relaxed">
                    <XCircle className="w-4 h-4 text-brand-coral flex-shrink-0" />
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Matrix Analysis (Side by Side) */}
        <section className="lg:col-span-8 bg-white rounded-[2.5rem] p-10 shadow-sm border border-border-light flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-10">
            <BarChart4 className="w-4 h-4 text-brand-sage" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#9B9B9B]">Strategic Multi-node Matrix</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  {result.comparison?.headers.map((header, i) => (
                    <th key={i} className={`py-6 pr-6 font-black uppercase tracking-wider text-[#9B9B9B] ${i === 0 ? 'w-1/3' : ''}`}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[#4A4A4A] divide-y divide-gray-50">
                {result.comparison?.rows.map((row, Ri) => (
                  <tr key={Ri} className="hover:bg-gray-50/50 transition-colors">
                    {getRowCells(row).map((cell, Ci) => (
                      <td key={Ci} className={`py-6 pr-6 ${Ci === 0 ? 'font-serif italic text-base text-[#2D2D2D]' : 'font-medium leading-relaxed'}`}>
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

      {/* SWOT Analysis System */}
      {result.swot && (
        <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-border-light">
          <div className="flex items-center gap-2 mb-10">
            <Scale className="w-4 h-4 text-brand-gold" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#9B9B9B]">Strategic SWOT Analysis</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 bg-[#F8FAF9] rounded-[2rem] border border-brand-sage/10 relative overflow-hidden group hover:border-brand-sage/30 transition-all">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-brand-sage/5 rounded-full blur-2xl group-hover:bg-brand-sage/10 transition-all" />
              <div className="relative z-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand-sage/10 rounded-xl flex items-center justify-center text-brand-sage">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-brand-sage">Strengths</h4>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Internal Intelligence</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  {result.swot.strengths.map((s, i) => (
                    <li key={i} className="flex gap-3 text-xs font-medium text-[#4A4A4A] leading-relaxed">
                      <div className="w-1.5 h-1.5 bg-brand-sage rounded-full mt-1.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-8 bg-[#FFF9F9] rounded-[2rem] border border-brand-coral/10 relative overflow-hidden group hover:border-brand-coral/30 transition-all">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-brand-coral/5 rounded-full blur-2xl group-hover:bg-brand-coral/10 transition-all" />
              <div className="relative z-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand-coral/10 rounded-xl flex items-center justify-center text-brand-coral">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-brand-coral">Weaknesses</h4>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Internal Hazards</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  {result.swot.weaknesses.map((w, i) => (
                    <li key={i} className="flex gap-3 text-xs font-medium text-[#4A4A4A] leading-relaxed">
                      <div className="w-1.5 h-1.5 bg-brand-coral rounded-full mt-1.5 flex-shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-8 bg-[#FFFAF5] rounded-[2rem] border border-brand-gold/10 relative overflow-hidden group hover:border-brand-gold/30 transition-all">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-brand-gold/5 rounded-full blur-2xl group-hover:bg-brand-gold/10 transition-all" />
              <div className="relative z-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand-gold/10 rounded-xl flex items-center justify-center text-brand-gold">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-[#8a702e]">Opportunities</h4>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">External Upside</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  {result.swot.opportunities.map((o, i) => (
                    <li key={i} className="flex gap-3 text-xs font-medium text-[#4A4A4A] leading-relaxed">
                      <div className="w-1.5 h-1.5 bg-brand-gold rounded-full mt-1.5 flex-shrink-0" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 relative overflow-hidden group hover:border-gray-200 transition-all">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-gray-200/20 rounded-full blur-2xl group-hover:bg-gray-200/40 transition-all" />
              <div className="relative z-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center text-gray-500">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-500">Threats</h4>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">External Risks</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  {result.swot.threats.map((t, i) => (
                    <li key={i} className="flex gap-3 text-xs font-medium text-[#4A4A4A] leading-relaxed">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Transparency Layer */}
      <section className="bg-white border border-border-light rounded-[2.5rem] p-10 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-brand-sage" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#4A4A4A]">Data Sovereignty & Grounding</h3>
            </div>
            <p className="text-xs text-gray-400 font-medium tracking-tight">Research models leveraged to build this intelligence framework.</p>
          </div>
          <a 
            href={`https://www.google.com/search?q=${encodeURIComponent(result.decision + " market intelligence 2026")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100 shadow-inner hover:bg-white hover:border-brand-sage/30 transition-all group"
          >
             <span className="w-1.5 h-1.5 bg-brand-sage rounded-full animate-pulse" />
             <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-brand-sage">Live 2026 Intelligence Index Active</span>
             <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-brand-sage" />
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {result.sources.map((source, i) => (
            <div key={i} className="p-6 rounded-2xl border border-gray-100 bg-[#F9F9F9] flex flex-col hover:border-brand-sage transition-all hover:bg-white group shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <span className={`px-2.5 py-1 rounded-md text-[8px] font-bold uppercase tracking-widest border ${getReliabilityColor(source.reliability)}`}>
                  {source.reliability} Accuracy
                </span>
                {source.url && (
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 group-hover:text-brand-sage transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <p className="text-sm font-bold text-[#4A4A4A] mb-3 leading-tight">{source.title}</p>
              <div className="mt-auto pt-6 flex items-center gap-2 text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
                <AlertCircle className="w-3 h-3" />
                Evidence Integrated
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Follow-up Intelligence Thread */}
      {depth < 3 && result.followUps && result.followUps.length > 0 && (
        <div className="space-y-12 mt-12 pt-12 border-t-2 border-dashed border-gray-100">
           <div className="flex items-center gap-3 px-6">
              <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400">Decision Expansion Thread</h3>
           </div>
           {result.followUps.map((followUp, idx) => (
             <div key={followUp.id || idx} className="relative pl-8 border-l-2 border-brand-gold/20">
                <div className="absolute top-0 left-0 -translate-x-1/2 w-4 h-4 rounded-full bg-brand-gold border-4 border-white shadow-sm" />
                <ResultsDisplay 
                  result={followUp} 
                  onRefine={onRefine} 
                  onUpdateOutcome={onUpdateOutcome} 
                  depth={depth + 1}
                />
             </div>
           ))}
        </div>
      )}
    </>
  )}
</div>
  );
}
