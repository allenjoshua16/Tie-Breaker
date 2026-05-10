/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scale, Loader2, Sparkles, History, Trash2, ChevronRight, Share2, Download, Info, BarChart3, LogIn, LogOut, User as UserIcon, ShieldCheck, Zap, Compass } from 'lucide-react';
import { analyzeDecision } from './services/geminiService';
import { AnalysisResult, UserPreferences, AppAnalytics } from './types';
import { loginWithGoogle, logout, auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { saveUser, saveDecision, fetchDecisions, deleteDecisions, normalizeDecision } from './lib/dbService';
import { APIProvider } from '@vis.gl/react-google-maps';
import DecisionInput from './components/DecisionInput';
import ResultsDisplay from './components/ResultsDisplay';
import AnalyticsDashboard from './components/AnalyticsDashboard';

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  // Force loading state reset if stuck
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        if (loading) {
          setLoading(false);
          setError("The simulation timed out. This may happen with high-complexity queries. Please try again or simplify your request.");
        }
      }, 60000); // 60 seconds
      return () => clearTimeout(timeout);
    }
  }, [loading]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    risk: 50,
    cost: 50,
    growth: 50,
    stability: 50,
    brutalHonesty: true,
    deepIntelligence: true
  });
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

  // Auth and Data Fetching
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;
      
      setUser(currentUser);
      if (currentUser) {
        try {
          await saveUser(currentUser);
          const remoteHistory = await fetchDecisions(currentUser.uid);
          if (isMounted) setHistory(remoteHistory);
        } catch (err) {
          console.error("Critical: Failed to sync user data.", err);
          setError("Failed to sync your history. Please check your permissions.");
        }
      } else {
        // Fallback to local storage for guests
        const saved = localStorage.getItem('tiebreaker_history_v2');
        if (saved && isMounted) {
          try {
            setHistory(JSON.parse(saved));
          } catch (e) {
            console.error("Failed to parse local history", e);
          }
        }
      }
    });
    return () => { isMounted = false; unsubscribe(); };
  }, []);

  // Save guest history to local storage
  useEffect(() => {
    if (!user) {
      localStorage.setItem('tiebreaker_history_v2', JSON.stringify(history));
    }
  }, [history, user]);

  const handleLogin = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err?.code !== 'auth/cancelled-popup-request' && err?.code !== 'auth/popup-closed-by-user') {
        setError("Login failed. Check your connection.");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setHistory([]);
      setResult(null);
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.displayName ? user.displayName.split(' ')[0] : 'Human 👽';
    
    if (hour < 12) return `Good Morning, ${name}`;
    if (hour < 18) return `Good Afternoon, ${name}`;
    return `Good Evening, ${name}`;
  };

  const handleAnalyze = useCallback(async (decision: string, preferences: UserPreferences, images?: string[]) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setShowHistory(false);
    try {
      const historicalBiases = history
        .filter(h => h.emotionalIntelligence?.biases)
        .flatMap(h => h.emotionalIntelligence!.biases.map(b => b.bias));
      
      const commonBiases = Array.from(new Set(historicalBiases)).slice(0, 3).join(', ');
      
      const historyContext = history
        .slice(0, 5)
        .map(h => `- ${h.decision}: ${h.outcome?.status || 'Pending'} ${h.outcome?.notes ? `(Retrospective: ${h.outcome.notes})` : ''}`)
        .join('\n');

      const personalizedContext = `
        Pattern Context: 
        - Historical Bias Tendencies: ${commonBiases || 'None detected yet'}
        - Recent Success/Failure Loop: ${historyContext || 'First decision'}
      `;

      const data = await analyzeDecision(decision, preferences, personalizedContext, images);
      const normalizedData = normalizeDecision(data);
      setError(null);
      setResult(normalizedData);
      setLoading(false); // Release loading early
      
      setHistory(prev => {
        const filtered = prev.filter(h => h.id !== normalizedData.id);
        const newHistory = [normalizedData, ...filtered].slice(0, 10);
        return newHistory;
      });
      
      if (user) {
        saveDecision(user.uid, normalizedData).catch(err => {
          console.error("Cloud sync failed", err);
        });
      }
    } catch (err) {
      setLoading(false);
      setError("Analysis failed. Please ensure your query is specific and meaningful.");
      console.error(err);
    }
  }, [history, user, loading]);

  const handleRefine = useCallback(async (answer: string) => {
    if (!result || loading) return;
    setLoading(true);
    setError(null);
    try {
      const isRetrospective = answer.includes('RETROSPECTIVE ANALYSIS');
      const refinementPrompt = isRetrospective 
        ? answer 
        : `ORIGINAL DILEMMA: ${result.decision}\n\nUSER CLARIFICATION/ANSWER: "${answer}"\n\nPlease refine the initial analysis based on this mission-critical input. Keep the same decision context but sharpen the intelligence.`;
      
      const data = await analyzeDecision(refinementPrompt, result.preferences);
      const followUp = normalizeDecision({ ...data, decision: `Follow-up Insight: ${answer.slice(0, 30)}...` });
      
      const updatedResult = normalizeDecision({
        ...result,
        followUps: [...(result.followUps || []), followUp]
      });
      
      setError(null);
      setResult(updatedResult);
      setLoading(false); // Release loading early
      setHistory(prev => prev.map(h => h.id === result.id ? updatedResult : h));
      
      if (user) {
        saveDecision(user.uid, updatedResult).catch(err => {
          console.error("Refinement sync failed", err);
        });
      }
    } catch (err) {
      setLoading(false);
      setError("Refinement loop failed. Try a different input.");
    }
  }, [result, user, loading]);

  // Use a ref for the result to avoid dependency cycles in updateOutcome
  const resultRef = useRef(result);
  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  const updateOutcome = useCallback(async (status: 'pending' | 'success' | 'mistake' | 'learning', notes?: string, committedAt?: number) => {
    const currentResult = resultRef.current;
    if (!currentResult) return;
    
    // Prevent redundant updates if nothing meaningful changed
    if (status === currentResult.outcome?.status && notes === currentResult.outcome?.notes && !committedAt) {
      return;
    }

    const updated: AnalysisResult = normalizeDecision({ 
      ...currentResult, 
      outcome: { 
        status, 
        notes: (notes !== undefined ? notes : currentResult.outcome?.notes) || null, 
        loggedAt: Date.now(),
        committedAt: committedAt || currentResult.outcome?.committedAt
      } 
    });
    
    setResult(updated);
    setHistory(prev => prev.map(h => h.id === currentResult.id ? updated : h));
    
    if (user) {
      // Use a background task for saving to not block UI/render
      saveDecision(user.uid, updated).catch(console.error);
    }
  }, [user]);

  const clearHistoryData = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Clear all decision history? This will reset the learning model.")) {
      if (user) {
        await deleteDecisions(user.uid);
      }
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

  const handleExport = () => {
    if (!result) return;
    const dataStr = JSON.stringify(result, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `tiebreaker_report_${result.id}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY}>
      <div className="min-h-screen flex bg-[#F9F9F9]">
        {/* Sidebar Archives - Claude style */}
        <AnimatePresence mode="wait">
          {showHistory && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="h-screen sticky top-0 border-r border-border-light bg-white flex flex-col z-[60] overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-serif text-[#2D2D2D]">Archives</h2>
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black">Intelligence History</p>
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-brand-coral"
                  title="Close Archives"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {history.length === 0 ? (
                  <div className="text-center py-12 px-4 opacity-40">
                    <History className="w-8 h-8 mx-auto mb-3 text-gray-200" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">No Intelligence Records</p>
                  </div>
                ) : (
                  history.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setResult(item);
                        // On mobile, close sidebar after selection
                        if (window.innerWidth < 768) setShowHistory(false);
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all group relative overflow-hidden ${
                        result?.id === item.id 
                          ? 'bg-brand-sage/5 border-brand-sage' 
                          : 'bg-white border-transparent hover:border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative z-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[7px] font-black uppercase tracking-widest text-[#9B9B9B]">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                          {item.outcome?.status && item.outcome?.status !== 'pending' && (
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              item.outcome.status === 'success' ? 'bg-brand-sage' :
                              item.outcome.status === 'mistake' ? 'bg-brand-coral' : 'bg-brand-gold'
                            }`} />
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-[#4A4A4A] truncate italic leading-tight mb-2">
                          "{item.decision}"
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="h-1 flex-1 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-brand-sage/40 rounded-full" 
                              style={{ width: `${item.confidence.score}%` }} 
                            />
                          </div>
                          <span className="text-[8px] font-bold text-gray-400">{item.confidence.score}%</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {history.length > 0 && (
                <div className="p-4 border-t border-gray-50">
                  <button 
                    onClick={clearHistoryData}
                    className="w-full py-3 text-[10px] font-black text-brand-coral uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-coral/5 rounded-xl transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Wipe Archives
                  </button>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className={`border-b border-border-light bg-white/80 backdrop-blur-md sticky top-0 z-[50] px-6 py-4 transition-all ${showHistory ? 'left-80' : 'left-0'}`}>
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-6">
                {!showHistory && (
                  <button 
                    onClick={() => setShowHistory(true)}
                    className="p-2 text-gray-400 hover:text-brand-sage hover:bg-gray-50 rounded-xl transition-all"
                    title="Open Archives"
                  >
                    <History className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={() => setShowAbout(true)}
                  className="flex items-center gap-3 group text-left transition-all active:scale-95"
                >
                  <div className="w-9 h-9 bg-[#4A4A4A] rounded-xl flex items-center justify-center text-white font-serif text-lg font-bold group-hover:bg-brand-sage transition-colors">
                    T
                  </div>
                  <div>
                    <h1 className="text-xl font-serif italic font-bold text-[#4A4A4A] leading-none group-hover:text-brand-sage transition-colors">Tiebreaker</h1>
                    <p className="text-[8px] uppercase tracking-widest text-[#9B9B9B] font-bold mt-1 group-hover:text-brand-sage/60">Decision Intelligence Platform</p>
                  </div>
                </button>
              </div>
          <nav className="flex items-center gap-3">
            {user ? (
               <div className="flex items-center gap-4 bg-gray-50 pr-2 pl-4 py-1.5 rounded-2xl border border-gray-100">
                  <div className="hidden md:block">
                     <p className="text-[10px] font-black uppercase text-[#4A4A4A] tracking-tighter leading-none">{user.displayName || 'Intel Agent'}</p>
                     <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Verified Member</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-gray-300 hover:text-brand-coral transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-xl object-cover border-2 border-white shadow-sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-brand-sage flex items-center justify-center text-white">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
               </div>
            ) : (
              <button 
                onClick={handleLogin}
                disabled={isAuthenticating}
                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-brand-sage hover:bg-brand-sage/5 transition-all flex items-center gap-2 border border-brand-sage/20 rounded-xl disabled:opacity-50"
              >
                {isAuthenticating ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogIn className="w-3 h-3" />}
                {isAuthenticating ? 'Authenticating...' : 'Auth Portal'}
              </button>
            )}
            <div className="w-px h-8 bg-gray-100 mx-1 hidden md:block" />
            <button 
              onClick={handleNewDecision}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-brand-sage text-white rounded-xl hover:bg-[#6f8d86] shadow-sm transition-all"
            >
              New Analysis
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
        <AnimatePresence mode="wait">
          {!result && !loading ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto text-center mb-10"
            >
              <h2 className="text-4xl font-serif text-[#2D2D2D] mb-4 tracking-tight">
                {getGreeting()}
              </h2>
              <p className="text-sm text-gray-500 font-medium max-w-lg mx-auto opacity-70 italic leading-relaxed">
                Strategic intelligence for high-stakes decisions and strategic precision.
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="max-w-3xl mx-auto mb-16 relative">
          {!result && <DecisionInput onAnalyze={handleAnalyze} isLoading={loading} />}
          
          {error && !result && (
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
              {/* Result Toolbar - Fixed overlap by making the sticky container full-width with a solid background */}
              <div className="sticky top-[73px] z-[40] bg-[#F9F9F9] -mx-4 px-4 py-6 shadow-[0_20px_20px_-10px_rgba(249,249,249,1)]">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
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
              </div>

              <div className="pt-4">
                <ResultsDisplay 
                  result={result} 
                  onRefine={handleRefine}
                  onUpdateOutcome={updateOutcome}
                />
              </div>
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

      {/* About Modal Overlay */}
      <AnimatePresence>
        {showAbout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAbout(false)}
            className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl w-full bg-white border border-border-light rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="relative p-12">
                <button 
                  onClick={() => setShowAbout(false)}
                  className="absolute top-8 right-8 p-3 hover:bg-gray-50 rounded-2xl transition-colors md:hidden"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>

                <div className="flex items-center gap-4 mb-10">
                  <div className="w-14 h-14 bg-[#4A4A4A] rounded-2xl flex items-center justify-center text-white font-serif text-2xl font-bold">
                    T
                  </div>
                  <div>
                    <h1 className="text-3xl font-serif italic font-bold text-[#4A4A4A]">Tiebreaker</h1>
                    <p className="text-[10px] uppercase tracking-widest text-brand-sage font-black">Strategic Intelligence Engine</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <section>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#4A4A4A] mb-3 flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4 text-brand-sage" /> Purpose
                    </h3>
                    <p className="text-lg text-gray-500 font-serif italic leading-relaxed">
                      Tiebreaker is built to dismantle the gridlock of high-stakes choices. We provide a neutral, deep-intelligence layer between your instincts and your actions, ensuring that strategic decisions are weighted against objective values rather than fleeting impulses.
                    </p>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#4A4A4A] mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-brand-gold" /> Capabilities
                      </h3>
                      <ul className="space-y-2 text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-brand-sage rounded-full" /> Brutal Honesty Modeling
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-brand-sage rounded-full" /> Risk-Mitigation Simulation
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-brand-sage rounded-full" /> Cognitive Bias Detection
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-brand-sage rounded-full" /> Long-term Impact Analysis
                        </li>
                      </ul>
                    </section>
                    <section>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#4A4A4A] mb-3 flex items-center gap-2">
                        <Compass className="w-4 h-4 text-brand-coral" /> Strategic Value
                      </h3>
                      <p className="text-sm text-gray-400 leading-relaxed italic">
                        Move beyond binary "pro vs con" lists. Our engine identifies the 'Third Path'—strategic alternatives that balance stability with aggressive growth opportunities.
                      </p>
                    </section>
                  </div>

                  <div className="pt-8 border-t border-gray-50 flex justify-between items-center">
                    <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest leading-none">
                      v2.4.0 • Enterprise Decision Intelligence
                    </p>
                    <button 
                      onClick={() => setShowAbout(false)}
                      className="px-6 py-3 bg-[#4A4A4A] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-brand-sage transition-all shadow-lg"
                    >
                      Return to Command
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
    </APIProvider>
  );
}

