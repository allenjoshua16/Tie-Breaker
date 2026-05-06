import React, { useState } from 'react';
import { Send, Sparkles, SlidersHorizontal, Info, ShieldAlert, Zap } from 'lucide-react';
import { UserPreferences } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface DecisionInputProps {
  onAnalyze: (decision: string, preferences: UserPreferences) => void;
  isLoading: boolean;
}

const EXAMPLES = [
  "Should I move from New York to Austin?",
  "Should I lead the new cross-functional product team?",
  "Should I buy a new electric car or keep my current SUV?",
  "Should I accept a high-paying soul-crushing job or a low-paying passion job?"
];

export default function DecisionInput({ onAnalyze, isLoading }: DecisionInputProps) {
  const [value, setValue] = useState('');
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<UserPreferences>({
    risk: 50,
    cost: 50,
    growth: 50,
    stability: 50,
    brutalHonesty: false,
    deepIntelligence: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onAnalyze(value, prefs);
    }
  };

  const updatePref = (key: keyof UserPreferences, val: any) => {
    setPrefs(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Describe your dilemma (e.g. 'Should I invest $50k in my startup idea?')..."
            className="w-full min-h-[180px] p-8 text-xl font-serif italic border-2 border-border-light rounded-3xl focus:border-brand-sage focus:ring-0 resize-none transition-all duration-300 placeholder:text-gray-300 bg-white shadow-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!value.trim() || isLoading}
            className={`absolute bottom-6 right-6 p-4 rounded-full transition-all duration-300 ${
              value.trim() && !isLoading 
                ? 'bg-[#4A4A4A] text-white shadow-lg hover:bg-black hover:scale-105 active:scale-95' 
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            <Send className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm">
          <div className="flex divide-x divide-gray-100">
            <button
              type="button"
              onClick={() => setShowPrefs(!showPrefs)}
              className="flex-1 p-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#4A4A4A] hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Tailor Intelligence
              </div>
              <span className="text-[8px] text-gray-400 font-bold">
                {showPrefs ? 'Collapse' : 'Customize'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => updatePref('brutalHonesty', !prefs.brutalHonesty)}
              className={`px-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                prefs.brutalHonesty ? 'bg-brand-coral/10 text-brand-coral' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Brutal honesty {prefs.brutalHonesty ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={() => updatePref('deepIntelligence', !prefs.deepIntelligence)}
              className={`px-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border-l border-gray-100 ${
                prefs.deepIntelligence ? 'bg-brand-sage/10 text-brand-sage' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <Zap className={`w-4 h-4 ${prefs.deepIntelligence ? 'text-brand-gold fill-brand-gold' : ''}`} />
              Deep Intel {prefs.deepIntelligence ? 'ACTIVE' : 'OFF'}
            </button>
          </div>

          <AnimatePresence>
            {showPrefs && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6 pt-2 space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    { key: 'risk', label: 'Risk Tolerance', left: 'Cautious', right: 'Ambitious' },
                    { key: 'cost', label: 'Cost Sensitivity', left: 'Economical', right: 'Premium' },
                    { key: 'growth', label: 'Growth Potential', left: 'Passive', right: 'Aggressive' },
                    { key: 'stability', label: 'Stability Preference', left: 'Fluid', right: 'Secure' }
                  ].map((p) => (
                    <div key={p.key} className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        <span>{p.label}</span>
                        <span className="text-brand-sage">{prefs[p.key as keyof UserPreferences] as number}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={prefs[p.key as keyof UserPreferences] as number}
                        onChange={(e) => updatePref(p.key as keyof UserPreferences, parseInt(e.target.value))}
                        className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand-sage"
                      />
                      <div className="flex justify-between text-[8px] font-medium text-gray-300 uppercase tracking-tighter">
                        <span>{p.left}</span>
                        <span>{p.right}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-gray-50 flex items-center gap-4">
                   <div className="flex-1">
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Decision Deadline (Pressure Mode)</p>
                      <input 
                        type="text" 
                        placeholder="e.g. '24 hours', 'Next Monday'"
                        value={prefs.deadline || ''}
                        onChange={(e) => updatePref('deadline', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-border-light rounded-xl text-xs focus:border-brand-sage outline-none"
                      />
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              onClick={() => setValue(example)}
              className="text-[9px] font-bold uppercase tracking-widest text-[#9B9B9B] hover:text-[#4A4A4A] hover:bg-gray-50 px-3 py-2 rounded-lg border border-border-light transition-all duration-200 flex items-center gap-2"
            >
              <Sparkles className="w-3 h-3 text-brand-gold" />
              {example}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
