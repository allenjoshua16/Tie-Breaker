import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sliders, TrendingUp, AlertCircle, CheckCircle2, ChevronRight, BarChart4 } from 'lucide-react';
import { AnalysisResult, ScoringNode } from '../types';

interface DecisionSimulationProps {
  result: AnalysisResult;
  onCommit: (option: string) => void;
}

export default function DecisionSimulation({ result, onCommit }: DecisionSimulationProps) {
  const [weights, setWeights] = useState<Record<string, number>>(
    result.scoringEngine?.criteriaWeights || { Risk: 25, Cost: 25, Growth: 25, Stability: 25 }
  );
  const [committed, setCommitted] = useState(!!result.outcome?.committedAt);

  const calculatedNodes = useMemo(() => {
    if (!result.scoringEngine) return [];

    const weightSum = Object.values(weights).reduce((a, b) => a + b, 0);
    const normalizedWeights = Object.keys(weights).reduce((acc, key) => ({
      ...acc,
      [key]: weights[key] / (weightSum || 1)
    }), {} as Record<string, number>);

    return result.scoringEngine.nodes.map(node => {
      let weightedScore = 0;
      Object.keys(weights).forEach(criteria => {
        const score = node.scores[criteria] || 0;
        weightedScore += score * normalizedWeights[criteria];
      });
      return {
        ...node,
        totalWeightedScore: Math.round(weightedScore)
      };
    }).sort((a, b) => b.totalWeightedScore - a.totalWeightedScore);
  }, [weights, result.scoringEngine]);

  const topOption = calculatedNodes[0];
  const originalVerdict = result.verdict;
  const isVerdictChanged = topOption?.option !== originalVerdict;

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-brand-coral mb-2 flex items-center gap-2">
            <Sliders className="w-4 h-4" /> Live Simulation Engine
          </h3>
          <p className="text-sm font-medium text-text-main">Adjust weights to model different priority landscapes.</p>
        </div>
        {!committed ? (
          <button 
            disabled={!topOption}
            onClick={() => {
              if (topOption) {
                setCommitted(true);
                onCommit(topOption.option);
              }
            }}
            className="px-6 py-3 bg-brand-coral text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-brand-coral/20 flex items-center gap-2 group"
          >
            Confirm Decision
            <CheckCircle2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          </button>
        ) : (
          <div className="px-6 py-3 bg-gray-50 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-gray-100 flex items-center gap-2">
            Decision Committed
            <CheckCircle2 className="w-4 h-4 text-brand-sage" />
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* Controls */}
        <div className="lg:col-span-5 space-y-8">
          {Object.keys(weights).map((criteria) => (
            <div key={criteria} className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-tighter text-[#4A4A4A]">{criteria} Priority</span>
                <span className="text-[10px] font-serif italic text-brand-sage">{weights[criteria]}%</span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={weights[criteria]}
                disabled={committed}
                onChange={(e) => setWeights(prev => ({ ...prev, [criteria]: parseInt(e.target.value) }))}
                className="w-full h-1 bg-gray-50 rounded-full appearance-none cursor-pointer accent-brand-sage hover:accent-brand-coral transition-colors disabled:opacity-50"
              />
            </div>
          ))}
          
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
             <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
             <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                Simulation uses dynamic normalization. Total landscape weight: {Object.values(weights).reduce((a, b) => a + b, 0)} units.
             </p>
          </div>
        </div>

        {/* Real-time Rankings */}
        <div className="lg:col-span-7 space-y-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Real-time Probabilistic Rankings</p>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {calculatedNodes.map((node, i) => (
                <motion.div 
                  key={node.option}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={`p-5 rounded-3xl border transition-all ${
                    i === 0 
                      ? 'bg-white border-brand-coral shadow-md ring-4 ring-brand-coral/5' 
                      : 'bg-gray-50/50 border-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                       <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${
                          i === 0 ? 'bg-brand-coral text-white' : 'bg-white text-gray-400 border border-gray-200 shadow-sm'
                       }`}>
                          {i + 1}
                       </span>
                       <div>
                          <p className={`text-sm font-bold ${i === 0 ? 'text-[#2D2D2D]' : 'text-gray-500'}`}>{node.option}</p>
                          {i === 0 && (
                            <span className="text-[8px] font-black text-brand-coral uppercase tracking-widest">Target Selection</span>
                          )}
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xl font-serif italic text-[#2D2D2D] leading-none">{node.totalWeightedScore}</p>
                       <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Weighted Index</p>
                    </div>
                  </div>

                  {/* Criteria Breakdown mini-bars */}
                  <div className="flex gap-1 mt-4">
                    {Object.keys(weights).map((c) => {
                      const score = node.scores[c] || 0;
                      return (
                        <div key={c} className="flex-1 space-y-1">
                           <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${i === 0 ? 'bg-brand-coral' : 'bg-gray-300'}`}
                                style={{ width: `${score}%` }}
                              />
                           </div>
                           <div className="flex justify-between items-center px-0.5">
                             <span className="text-[6px] font-black uppercase text-gray-400">{c[0]}</span>
                             <span className="text-[6px] font-bold text-gray-500">{score}</span>
                           </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {isVerdictChanged && (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-4 bg-brand-coral/5 border border-brand-coral/10 rounded-2xl flex items-center gap-3 mt-6"
            >
               <AlertCircle className="w-5 h-5 text-brand-coral" />
               <p className="text-xs text-brand-coral font-medium italic">
                  A priori verdict has flipped. Priority adjustment suggests "{topOption?.option}" is now superior to "{originalVerdict}".
               </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
