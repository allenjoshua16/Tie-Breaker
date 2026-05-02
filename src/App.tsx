/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scale, Loader2, Sparkles, History, Trash2, ChevronRight, Share2, Download, Info, BarChart3 } from 'lucide-react';
import { analyzeDecision } from './services/geminiService';
import { AnalysisResult, UserPreferences, AppAnalytics } from './types';
import DecisionInput from './components/DecisionInput';
import ResultsDisplay from './components/ResultsDisplay';
import AnalyticsDashboard from './components/AnalyticsDashboard';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  // Compute Analytics
  const analytics: AppAnalytics = useMemo(() => {
    const total = history.length;
    if (total === 0) return {
      totalDecisions: 0,
      avgConfidence: 0,
      accuracyRate: 0,
      regretAverage: 0,
      popularCategories: {},
      avgIterations: 0
    };

    const avgConfidence = Math.round(history.reduce((acc, h) => acc + h.confidence.score, 0) / total);
    const completed = history.filter(h => h.outcome?.status && h.outcome.status !== 'pending');
    const success = completed.filter(h => h.outcome?.status === 'success').length;
    const accuracyRate = completed.length > 0 ? Math.round((success / completed.length) * 100) : 0;
    
    // Average iterations (including follow-ups)
    const totalIterations = history.reduce((acc, h) => acc + (h.followUps?.length || 0) + 1, 0);
    const avgIterations = Number((totalIterations / total).toFixed(1));

    return {
      totalDecisions: total,
      avgConfidence,
      accuracyRate,
      regretAverage: 0, // Future: implement regret slider
      popularCategories: { 'General': total }, // Mock for now
      avgIterations
    };
  }, [history]);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('tiebreaker_history_v2');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history when it changes
  useEffect(() => {
    localStorage.setItem('tiebreaker_history_v2', JSON.stringify(history));
  }, [history]);

  const handleAnalyze = async (decision: string, preferences: UserPreferences) => {
    setLoading(true);
    setError(null);
    setShowHistory(false);
    try {
      // Build history context for recursive intelligence
      const historyContext = history
        .slice(0, 5)
        .map(h => `- Decision: ${h.decision} | Outcome: ${h.outcome?.status || 'Pending'} ${h.outcome?.notes ? `(Retrospective Learning: ${h.outcome.notes})` : ''}`)
        .join('\n');

      const data = await analyzeDecision(decision, preferences, historyContext);
      setResult(data);
      // Add to history (limit to 10 latest)
      setHistory(prev => [data, ...prev.filter(h => h.id !== data.id)].slice(0, 10));
    } catch (err) {
      setError("Analysis failed. Please ensure your query is specific and meaningful.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async (answer: string) => {
    if (!result) return;
    setLoading(true);
    setError(null);
    try {
      const isRetrospective = answer.includes('RETROSPECTIVE ANALYSIS');
      const refinementPrompt = isRetrospective 
        ? answer 
        : `ORIGINAL DILEMMA: ${result.decision}\n\nUSER CLARIFICATION/ANSWER: "${answer}"\n\nPlease refine the initial analysis based on this mission-critical input. Keep the same decision context but sharpen the intelligence.`;
      
      const data = await analyzeDecision(refinementPrompt, result.preferences);
      
      // Create a follow-up result
      const followUp = { ...data, decision: `Follow-up Insight: ${answer.slice(0, 30)}...` };
      
      const updatedResult = {
        ...result,
        followUps: [...(result.followUps || []), followUp]
      };
      
      setResult(updatedResult);
      setHistory(prev => prev.map(h => h.id === result.id ? updatedResult : h));
    } catch (err) {
      setError("Refinement loop failed. Try a different input.");
    } finally {
      setLoading(false);
    }
  };

  const updateOutcome = (status: 'success' | 'mistake' | 'learning', notes?: string) => {
    if (!result) return;
    const updated = { 
      ...result, 
      outcome: { status, notes: notes || result.outcome?.notes, loggedAt: Date.now() } 
    };
    setResult(updated);
    setHistory(prev => prev.map(h => h.id === result.id ? updated : h));
  };

  const clearHistoryData = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Clear all decision history?")) {
      setHistory([]);
    }
  };

  const handleNewDecision = () => {
    setResult(null);
    setShowHistory(false);
    setError(null);
  };

  const [shared, setShared] = useState(false);
  const handleShare = () => {
    if (!result) return;
    const text = `High-Stakes Analysis: "${result.decision}"\nVerdict: ${result.summary}\nConfidence: ${result.confidence.score}%\n\nView full analysis at Tiebreaker.`;
    navigator.clipboard.writeText(text);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F9]">
      {/* Header */}
      <header className="border-b border-border-light bg-white/80 backdrop-blur-md sticky top-0 z-10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#4A4A4A] rounded-xl flex items-center justify-center text-white font-serif text-lg font-bold">
              T
            </div>
            <div>
              <h1 className="text-xl font-serif italic font-bold text-[#4A4A4A] leading-none">Tiebreaker</h1>
              <p className="text-[8px] uppercase tracking-widest text-[#9B9B9B] font-bold mt-1">Decision Intelligence Platform</p>
            </div>
          </div>
          <nav className="flex items-center gap-3">
            <button 
              onClick={() => setShowDashboard(true)}
              className="p-2 text-gray-400 hover:text-brand-sage transition-colors"
              title="System Analytics"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border border-border-light rounded-xl transition-all flex items-center gap-2 ${
                showHistory ? 'bg-[#4A4A4A] text-white border-[#4A4A4A]' : 'text-text-main hover:bg-gray-50'
              }`}
            >
              <History className="w-3 h-3" />
              Archives
            </button>
            <button 
              onClick={handleNewDecision}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-brand-sage text-white rounded-xl hover:bg-[#6f8d86] shadow-sm transition-all"
            >
              Consult Engine
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
        <AnimatePresence mode="wait">
          {showHistory ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-3xl mx-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-serif text-[#2D2D2D]">Intelligence Archives</h2>
                  <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Your analyzed high-stakes decisions</p>
                </div>
                {history.length > 0 && (
                  <button 
                    onClick={clearHistoryData}
                    className="text-[10px] font-bold text-brand-coral uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" /> Wipe Archives
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[2rem] border border-dashed border-border-light">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-gray-400 font-medium italic">No previous intelligence reports found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setResult(item);
                        setShowHistory(false);
                      }}
                      className="w-full text-left bg-white p-6 rounded-3xl border border-border-light hover:border-brand-sage hover:shadow-md transition-all group flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[8px] uppercase tracking-widest font-bold text-brand-sage">Decision Report</span>
                          {item.outcome?.status && item.outcome?.status !== 'pending' && (
                             <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter border ${
                               item.outcome.status === 'success' ? 'bg-brand-sage/10 text-brand-sage border-brand-sage/20' :
                               item.outcome.status === 'mistake' ? 'bg-brand-coral/10 text-brand-coral border-brand-coral/20' :
                               'bg-brand-gold/10 text-brand-gold border-brand-gold/20'
                             }`}>
                               {item.outcome.status}
                             </span>
                          )}
                        </div>
                        <p className="text-lg font-serif italic text-text-main mb-1 truncate">"{item.decision}"</p>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Confidence: {item.confidence.score}%</span>
                          <span className="text-[10px] text-gray-300">•</span>
                          <p className="text-[10px] text-gray-400 font-medium truncate italic">"{item.summary.slice(0, 80)}..."</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-brand-sage transform group-hover:translate-x-1 transition-all ml-4" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : !result && !loading ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 bg-white border border-border-light px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-sage mb-6 shadow-sm">
                <Sparkles className="w-3 h-3 text-brand-gold animate-pulse" />
                V2: High-Stakes Decision Modeling
              </div>
              <h2 className="text-6xl font-serif text-[#2D2D2D] mb-8 leading-tight tracking-tight">
                Turn uncertainty into <br />
                <span className="italic underline decoration-brand-sage decoration-4 underline-offset-12">strategic precision</span>.
              </h2>
              <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                Tiebreaker isn't just a pro/con list. It's a high-confidence intelligence engine that models scenarios and weights decisions against your unique priorities.
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="max-w-3xl mx-auto mb-16 relative">
          {!result && !showHistory && <DecisionInput onAnalyze={handleAnalyze} isLoading={loading} />}
          
          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-2xl flex items-center gap-3"
            >
              <Info className="w-5 h-5 text-brand-coral" />
              <p className="text-xs text-brand-coral font-bold uppercase tracking-widest">
                {error}
              </p>
            </motion.div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-24"
            >
              <div className="relative mb-6">
                <Loader2 className="w-16 h-16 animate-spin text-brand-sage stroke-[1.5px]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-brand-gold rounded-full animate-ping" />
                </div>
              </div>
              <p className="font-bold text-[10px] uppercase tracking-[0.3em] text-[#4A4A4A] animate-pulse">Running Deep Simulation</p>
              <div className="flex gap-1 mt-3">
                {[1, 2, 3].map(i => <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }} className="w-1 h-1 bg-brand-sage rounded-full" />)}
              </div>
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              className="space-y-12"
            >
              {/* Result Toolbar */}
              <div className="flex items-center justify-between max-w-4xl mx-auto sticky top-24 z-10">
                <button
                   onClick={handleNewDecision}
                   className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#4A4A4A] bg-white border border-border-light rounded-xl hover:shadow-md transition-all flex items-center gap-2"
                >
                  <ChevronRight className="w-3 h-3 rotate-180" /> Back to Workspace
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={handleShare}
                    className="p-3 bg-white border border-border-light rounded-xl hover:shadow-md transition-all text-gray-500 hover:text-brand-sage"
                    title="Share Analysis"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <ResultsDisplay 
                result={result} 
                onRefine={handleRefine}
                onUpdateOutcome={updateOutcome}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      <footer className="bg-white border-t border-border-light px-10 py-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
             <div className="flex items-center gap-2 opacity-50 mb-2">
                <div className="w-5 h-5 bg-[#4A4A4A] rounded flex items-center justify-center text-white font-serif text-[10px] font-bold">T</div>
                <h3 className="font-serif italic font-bold text-sm">Tiebreaker</h3>
             </div>
             <p className="text-[10px] text-gray-400 font-medium tracking-tight">
               Precision Decision Intelligence for High-Stakes Professionals.
             </p>
          </div>
          <div className="flex gap-12 font-bold uppercase tracking-[0.2em] text-[10px] text-gray-400">
             <div className="flex flex-col gap-2">
                <span className="text-[#4A4A4A]">Platform</span>
                <a href="#" className="hover:text-brand-sage">Security</a>
                <a href="#" className="hover:text-brand-sage">Ethics</a>
             </div>
             <div className="flex flex-col gap-2">
                <span className="text-[#4A4A4A]">Resources</span>
                <a href="#" className="hover:text-brand-sage">Privacy</a>
                <a href="#" className="hover:text-brand-sage">Terms</a>
             </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-50 text-center">
           <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">
             &copy; 2026 Tiebreaker Labs &bull; Powered by Google Gemini Intelligence
           </p>
        </div>
      </footer>

      {/* Analytics Overlay */}
      <AnimatePresence>
        {showDashboard && (
          <AnalyticsDashboard 
            analytics={analytics} 
            history={history} 
            onClose={() => setShowDashboard(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

