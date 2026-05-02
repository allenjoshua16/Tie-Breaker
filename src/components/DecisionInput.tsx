import React, { useState } from 'react';
import { Send, Sparkles, SlidersHorizontal, Info } from 'lucide-react';
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
    stability: 50
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onAnalyze(value, prefs);
    }
  };

  const updatePref = (key: keyof UserPreferences, val: number) => {
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
          <button
            type="button"
            onClick={() => setShowPrefs(!showPrefs)}
            className="w-full p-4 flex items-center justify-between text-sm font-bold uppercase tracking-widest text-[#4A4A4A] hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Tailor Intelligence
            </div>
            <span className="text-[10px] text-gray-400 font-medium">
              {showPrefs ? 'Hide Preferences' : 'Adjust Priorities'}
            </span>
          </button>

          <AnimatePresence>
            {showPrefs && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4"
              >
                {[
                  { key: 'risk', label: 'Risk Tolerance', left: 'Cautious', right: 'Ambitious' },
                  { key: 'cost', label: 'Cost Sensitivity', left: 'Economical', right: 'Premium' },
                  { key: 'growth', label: 'Growth Potential', left: 'Passive', right: 'Aggressive' },
                  { key: 'stability', label: 'Stability Preference', left: 'Fluid', right: 'Secure' }
                ].map((p) => (
                  <div key={p.key} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      <span>{p.label}</span>
                      <span className="text-brand-sage">{prefs[p.key as keyof UserPreferences]}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={prefs[p.key as keyof UserPreferences]}
                      onChange={(e) => updatePref(p.key as keyof UserPreferences, parseInt(e.target.value))}
                      className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand-sage"
                    />
                    <div className="flex justify-between text-[8px] font-medium text-gray-300 uppercase tracking-tighter">
                      <span>{p.left}</span>
                      <span>{p.right}</span>
                    </div>
                  </div>
                ))}
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
