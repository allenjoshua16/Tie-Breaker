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
  AlignmentType
} from 'docx';
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  Layout,
  MessageSquareQuote,
  Target,
  Copy,
  Check,
  Sparkles,
  Zap,
  Loader2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  ShieldAlert,
  Brain,
  ArrowRight,
  BarChart4,
  Calculator,
  Compass,
  Download,
  Share2,
  Map as MapIcon,
  Image as ImageIcon
} from 'lucide-react';
import { AnalysisResult } from '../types';
import DecisionSimulation from './DecisionSimulation';
import DecisionMap from './DecisionMap';

interface ResultsDisplayProps {
  result: AnalysisResult;
  decision?: string;
  onRefine?: (input: string) => void;
  onUpdateOutcome?: (
    status: 'pending' | 'success' | 'mistake' | 'learning',
    notes?: string,
    timestamp?: number
  ) => void;  depth?: number;
}

export default function ResultsDisplay({
  result,
  decision,
  onRefine,
  onUpdateOutcome,
  depth = 0
}: ResultsDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [refinementInput, setRefinementInput] = useState('');
  const [localNotes, setLocalNotes] = useState(result.outcome?.notes || '');
  const lastNotesUpdate = useRef<string>(result.outcome?.notes || '');

  useEffect(() => {
    if (result.id) {
      setLocalNotes(result.outcome?.notes || '');
      lastNotesUpdate.current = result.outcome?.notes || '';
    }
  }, [result.id, result.outcome?.notes]);

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

  const buildLiveIntelligenceLink = () => {
    const baseDecision = decision || result.decision || 'strategic decision';

    const query = encodeURIComponent(
      `2026 market intelligence latest trends risks opportunities research for ${baseDecision}`
    );

    return `https://www.google.com/search?q=${query}`;
  };

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

  const getReliabilityColor = (rel: string) => {
    switch (rel) {
      case 'High':
        return 'text-brand-sage bg-brand-sage/10 border-brand-sage/20';
      case 'Medium':
        return 'text-brand-gold bg-brand-gold/10 border-brand-gold/20';
      case 'Low':
        return 'text-brand-coral bg-brand-coral/10 border-brand-coral/20';
      default:
        return 'text-gray-400 bg-gray-100 border-gray-200';
    }
  };

  const handleExport = async () => {
    try {
      const sections = [];

      sections.push(
        new Paragraph({
          text: 'Tiebreaker Intelligence Report',
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Generated on: ', bold: true }),
            new TextRun(new Date().toLocaleString())
          ],
          alignment: AlignmentType.RIGHT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Decision ID: ', bold: true }),
            new TextRun(result.id)
          ],
          alignment: AlignmentType.RIGHT
        }),
        new Paragraph({ text: '', spacing: { after: 200 } })
      );

      sections.push(
        new Paragraph({
          text: 'Original Dilemma',
          heading: HeadingLevel.HEADING_1
        }),
        new Paragraph({
          children: [new TextRun({ text: result.decision, italics: true })],
          spacing: { after: 400 }
        })
      );

      sections.push(
        new Paragraph({
          text: 'Intelligence Verdict',
          heading: HeadingLevel.HEADING_1
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Primary Option: ', bold: true }),
            new TextRun({ text: result.verdict, color: 'E76F51', bold: true })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Confidence Index: ', bold: true }),
            new TextRun({ text: `${result.confidence.score}%`, bold: true }),
            new TextRun({ text: ` (${result.confidence.label})`, italics: true })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Justification: ', bold: true }),
            new TextRun(result.confidence.justification)
          ]
        }),
        new Paragraph({
          text: result.summary,
          spacing: { before: 200, after: 400 }
        })
      );

      if (result.swot) {
        sections.push(
          new Paragraph({
            text: 'SWOT Analysis',
            heading: HeadingLevel.HEADING_1
          }),
          new Paragraph({ text: 'Strengths', heading: HeadingLevel.HEADING_2 }),
          ...result.swot.strengths.map((item) => new Paragraph({ text: `• ${item}` })),
          new Paragraph({ text: 'Weaknesses', heading: HeadingLevel.HEADING_2 }),
          ...result.swot.weaknesses.map((item) => new Paragraph({ text: `• ${item}` })),
          new Paragraph({ text: 'Opportunities', heading: HeadingLevel.HEADING_2 }),
          ...result.swot.opportunities.map((item) => new Paragraph({ text: `• ${item}` })),
          new Paragraph({ text: 'Threats', heading: HeadingLevel.HEADING_2 }),
          ...result.swot.threats.map((item) => new Paragraph({ text: `• ${item}` })),
          new Paragraph({ text: '', spacing: { after: 400 } })
        );
      }

      if (result.comparison) {
        const rows = [
          new TableRow({
            children: result.comparison.headers.map(
              (h) =>
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                  shading: { fill: 'F5F5F5' }
                })
            )
          }),
          ...result.comparison.rows.map(
            (row) =>
              new TableRow({
                children: getRowCells(row).map(
                  (cell) =>
                    new TableCell({
                      children: [new Paragraph({ text: cell })]
                    })
                )
              })
          )
        ];

        sections.push(
          new Paragraph({
            text: 'Strategic Matrix',
            heading: HeadingLevel.HEADING_1
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows
          }),
          new Paragraph({ text: '', spacing: { after: 400 } })
        );
      }

      if (result.prosCons) {
        sections.push(
          new Paragraph({
            text: 'Balance Sheet',
            heading: HeadingLevel.HEADING_1
          }),
          new Paragraph({ text: 'High Value Upside', heading: HeadingLevel.HEADING_2 }),
          ...result.prosCons.pros.map((pro) => new Paragraph({ text: `• ${pro}`, spacing: { after: 100 } })),
          new Paragraph({ text: 'Risk Exposure', heading: HeadingLevel.HEADING_2 }),
          ...result.prosCons.cons.map((con) => new Paragraph({ text: `• ${con}`, spacing: { after: 100 } })),
          new Paragraph({ text: '', spacing: { after: 400 } })
        );
      }

      if (result.sources && result.sources.length > 0) {
        sections.push(
          new Paragraph({
            text: 'Data Sources & Grounding',
            heading: HeadingLevel.HEADING_1
          }),
          ...result.sources.map(
            (s) =>
              new Paragraph({
                children: [
                  new TextRun({ text: `• ${s.title}`, bold: true }),
                  new TextRun({ text: ` [Reliability: ${s.reliability}]`, italics: true }),
                  ...(s.url ? [new TextRun({ text: ` URL: ${s.url}`, size: 16 })] : [])
                ],
                spacing: { after: 100 }
              })
          )
        );
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: sections
          }
        ]
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tiebreaker_report_${result.id.slice(0, 8)}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate Word report', err);
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tiebreaker_${result.id.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
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
          <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed mb-8">{result.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-[#4A4A4A] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2D2D2D] transition-all"
          >
            Reset Engine
          </button>
        </motion.section>
      )}

      {!result.error && (
        <>
          <section className="bg-white rounded-[2.5rem] border border-border-light shadow-sm overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="p-10 flex flex-col items-center justify-center bg-gray-50/50 md:w-1/3">
              <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-200" />
                  <motion.circle
                    initial={{ strokeDasharray: '0 365' }}
                    animate={{ strokeDasharray: `${(result.confidence.score / 100) * 365} 365` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
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
                    <span className="text-[10px] font-black uppercase tracking-[0.34em] text-brand-sage">
                      Intelligence Verdict
                    </span>
                    {result.preferences?.deepIntelligence && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-gold/10 rounded-md border border-brand-gold/20">
                        <Zap className="w-2.5 h-2.5 text-brand-gold fill-brand-gold" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#8a702e]">
                          Deep Intelligence Active
                        </span>
                      </div>
                    )}
                  </div>

                  {result.timestamp && (
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                      {getSafeDate(result.timestamp)}
                    </span>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-coral/10 rounded-lg">
                    <Target className="w-3.5 h-3.5 text-brand-coral" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-coral">
                      Primary Option: {result.verdict}
                    </span>
                  </div>
                  <p className="text-2xl md:text-3xl font-serif text-[#2D2D2D] leading-tight italic">
                    "{result.summary}"
                  </p>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Sharpen Intelligence Report
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={refinementInput}
                        onChange={(e) => setRefinementInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && refinementInput.trim()) {
                            onRefine?.(refinementInput);
                            setRefinementInput('');
                          }
                        }}
                        placeholder="Add missing context or ask a follow-up question..."
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-brand-sage focus:ring-1 focus:ring-brand-sage/20 outline-none transition-all pr-12"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">Enter</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (refinementInput.trim()) {
                          onRefine?.(refinementInput);
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

          <DecisionSimulation
            result={result}
            onCommit={() => onUpdateOutcome?.(result.outcome?.status || 'pending', result.outcome?.notes, Date.now())}
          />

          {(result.mapData || result.visualAsset) && (
            <div className="grid lg:grid-cols-12 gap-8">
              {result.mapData && (
                <motion.section
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className={`${result.visualAsset ? 'lg:col-span-7' : 'lg:col-span-12'}`}
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-brand-sage/10 flex items-center justify-center text-brand-sage">
                      <MapIcon className="w-4 h-4" />
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-sage">
                      Spatial Analysis & Routing
                    </h3>
                  </div>
                  <DecisionMap data={result.mapData} />
                </motion.section>
              )}

              {result.visualAsset && (
                <motion.section
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className={`${result.mapData ? 'lg:col-span-5' : 'lg:col-span-12'}`}
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-gold">
                      Logic Visualization
                    </h3>
                  </div>

                  <div className="bg-white p-6 rounded-[2.5rem] border border-border-light shadow-sm overflow-hidden h-full flex flex-col">
                    <div className="flex-1 rounded-2xl overflow-hidden bg-gray-50 mb-6 group relative">
                      {result.visualAsset.url ? (
                        <img
                          src={result.visualAsset.url}
                          alt="Logic visualization"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center p-8 text-center text-gray-400">
                          <ImageIcon className="w-8 h-8 mb-4 text-brand-gold/60" />
                          <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                            Visualization unavailable
                          </p>
                          <p className="text-[10px] text-gray-400 mt-2 max-w-sm leading-relaxed">
                            The AI generated the visual concept, but the image API quota is currently unavailable.
                          </p>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                        <p className="text-[10px] text-white/90 italic line-clamp-2">
                          {result.visualAsset.description}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">AI Render Prompt</p>
                      <p className="text-[10px] text-gray-600 italic line-clamp-3">"{result.visualAsset.prompt}"</p>
                    </div>
                  </div>
                </motion.section>
              )}
            </div>
          )}

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
                          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-coral">
                            Cognitive Bias & Environmental Scan
                          </h3>
                        </div>

                        {result.brutalTruth && (
                          <p className="text-xl font-serif text-brand-coral/90 leading-relaxed italic mb-8">
                            "{result.brutalTruth}"
                          </p>
                        )}

                        <p className="text-[10px] font-bold text-brand-coral/60 uppercase tracking-widest">
                          Context: {result.emotionalIntelligence?.decisionEnvironment || 'Mixed emotional/rational environment detected.'}
                        </p>
                      </div>

                      <div className="md:col-span-5 space-y-4">
                        <p className="text-[10px] font-black text-brand-coral/40 uppercase tracking-[0.2em] mb-2">
                          Detected Risk Patterns
                        </p>

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

          <div className="grid lg:grid-cols-12 gap-8">
            <section className="lg:col-span-4 bg-white rounded-[2.5rem] p-10 shadow-sm border border-border-light flex flex-col">
              <div className="flex items-center gap-2 mb-10">
                <Layout className="w-4 h-4 text-brand-sage" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#9B9B9B]">Option Comparison</h3>
              </div>

              <div className="flex-1 space-y-12">
                <div className="space-y-6">
                  <p className="text-[9px] font-black text-brand-sage uppercase tracking-[0.2em] mb-4">
                    High Value Upside
                  </p>
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
                  <p className="text-[9px] font-black text-brand-coral uppercase tracking-[0.2em] mb-4">
                    Risk Exposure
                  </p>
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

            <section className="lg:col-span-8 bg-white rounded-[2.5rem] p-10 shadow-sm border border-border-light flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 mb-10">
                <BarChart4 className="w-4 h-4 text-brand-sage" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#9B9B9B]">
                  Strategic Multi-node Matrix
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {result.comparison?.headers.map((header, i) => (
                        <th
                          key={i}
                          className={`py-6 pr-6 font-black uppercase tracking-wider text-[#9B9B9B] ${
                            i === 0 ? 'w-1/3' : ''
                          }`}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="text-[#4A4A4A] divide-y divide-gray-50">
                    {result.comparison?.rows.map((row, ri) => (
                      <tr key={ri} className="hover:bg-gray-50/50 transition-colors">
                        {getRowCells(row).map((cell, ci) => (
                          <td
                            key={ci}
                            className={`py-6 pr-6 ${
                              ci === 0 ? 'font-serif italic text-base text-[#2D2D2D]' : 'font-medium leading-relaxed'
                            }`}
                          >
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

          {result.swot && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-border-light"
            >
              <div className="flex items-center gap-2 mb-10">
                <Compass className="w-4 h-4 text-brand-sage" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#9B9B9B]">
                  SWOT Intelligence Framework
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl border border-brand-sage/20 bg-brand-sage/5">
                  <div className="flex items-center gap-3 mb-5">
                    <ShieldCheck className="w-5 h-5 text-brand-sage" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-sage">Strengths</h4>
                  </div>
                  <ul className="space-y-3 text-xs text-[#4A4A4A] font-medium leading-relaxed">
                    {result.swot.strengths?.map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <CheckCircle2 className="w-4 h-4 text-brand-sage flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 rounded-3xl border border-brand-coral/20 bg-brand-coral/5">
                  <div className="flex items-center gap-3 mb-5">
                    <AlertCircle className="w-5 h-5 text-brand-coral" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-coral">Weaknesses</h4>
                  </div>
                  <ul className="space-y-3 text-xs text-[#4A4A4A] font-medium leading-relaxed">
                    {result.swot.weaknesses?.map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <XCircle className="w-4 h-4 text-brand-coral flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 rounded-3xl border border-brand-gold/20 bg-brand-gold/5">
                  <div className="flex items-center gap-3 mb-5">
                    <TrendingUp className="w-5 h-5 text-brand-gold" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-gold">Opportunities</h4>
                  </div>
                  <ul className="space-y-3 text-xs text-[#4A4A4A] font-medium leading-relaxed">
                    {result.swot.opportunities?.map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <ArrowRight className="w-4 h-4 text-brand-gold flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 rounded-3xl border border-gray-300 bg-gray-50">
                  <div className="flex items-center gap-3 mb-5">
                    <ShieldAlert className="w-5 h-5 text-gray-600" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-600">Threats</h4>
                  </div>
                  <ul className="space-y-3 text-xs text-[#4A4A4A] font-medium leading-relaxed">
                    {result.swot.threats?.map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <Zap className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.section>
          )}

          <section className="bg-white border border-border-light rounded-[2.5rem] p-10 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-brand-sage" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#4A4A4A]">
                    Data Sovereignty & Grounding
                  </h3>
                </div>
                <p className="text-xs text-gray-400 font-medium tracking-tight">
                  Research models leveraged to build this intelligence framework.
                </p>
              </div>

              <a
                href={buildLiveIntelligenceLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100 shadow-inner hover:bg-white hover:border-brand-sage/30 transition-all"
              >
                <span className="w-1.5 h-1.5 bg-brand-sage rounded-full animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                  Live 2026 Intelligence Index
                </span>
                <ExternalLink className="w-3 h-3 text-brand-sage" />
              </a>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {result.sources?.map((source, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl border border-gray-100 bg-[#F9F9F9] flex flex-col hover:border-brand-sage transition-all hover:bg-white group shadow-sm"
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className={`px-2.5 py-1 rounded-md text-[8px] font-bold uppercase tracking-widest border ${getReliabilityColor(source.reliability)}`}>
                      {source.reliability} Accuracy
                    </span>

                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 group-hover:text-brand-sage transition-colors"
                      >
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

          {depth < 3 && result.followUps && result.followUps.length > 0 && (
            <div className="space-y-12 mt-12 pt-12 border-t-2 border-dashed border-gray-100">
              <div className="flex items-center gap-3 px-6">
                <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400">
                  Decision Expansion Thread
                </h3>
              </div>

              {result.followUps.map((followUp, idx) => (
                <div key={followUp.id || idx} className="relative pl-8 border-l-2 border-brand-gold/20">
                  <div className="absolute top-0 left-0 -translate-x-1/2 w-4 h-4 rounded-full bg-brand-gold border-4 border-white shadow-sm" />
                  <ResultsDisplay
                    result={followUp}
                    decision={followUp.decision || decision}
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