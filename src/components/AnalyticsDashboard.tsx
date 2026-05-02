import { motion } from 'motion/react';
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  Timer, 
  History, 
  Zap,
  Activity,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { AppAnalytics, AnalysisResult } from '../types';

interface AnalyticsDashboardProps {
  analytics: AppAnalytics;
  history: AnalysisResult[];
  onClose: () => void;
}

export default function AnalyticsDashboard({ analytics, history, onClose }: AnalyticsDashboardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl overflow-y-auto p-4 md:p-12"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-sage mb-2 block">System Analytics Panel</span>
            <h2 className="text-4xl font-serif text-[#2D2D2D]">Decision Performance Layer</h2>
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl border border-gray-100 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
          >
            Collapse Dashboard
          </button>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Intelligence Depth', value: analytics.totalDecisions, icon: Zap, sub: 'Total Decisions' },
            { label: 'Confidence Floor', value: `${analytics.avgConfidence}%`, icon: ShieldCheck, sub: 'Avg System Confidence' },
            { label: 'Decision Accuracy', value: `${analytics.accuracyRate}%`, icon: Target, sub: 'Post-Outcome Validated' },
            { label: 'Refinement Latency', value: analytics.avgIterations, icon: Activity, sub: 'Avg Iterations/Verdict' }
          ].map((kpi, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gray-50 rounded-3xl p-6 border border-gray-100"
            >
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-brand-gold mb-4 shadow-sm">
                <kpi.icon className="w-4 h-4" />
              </div>
              <p className="text-3xl font-serif text-[#2D2D2D] mb-1">{kpi.value}</p>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">{kpi.label}</p>
              <p className="text-[8px] font-bold text-gray-300 uppercase mt-1">{kpi.sub}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-8 mb-12">
          {/* Categories Chart */}
          <div className="lg:col-span-8 bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                <BarChart3 className="w-40 h-40" />
             </div>
             <div className="relative z-10">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-8 flex items-center gap-2">
                   <TrendingUp className="w-4 h-4" /> Category Distribution Analysis
                </h3>
                <div className="space-y-6">
                   {Object.entries(analytics.popularCategories || { 'Career': 5, 'Finance': 3, 'Personal': 2 }).map(([cat, count], i) => (
                     <div key={cat} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase">
                           <span className="text-[#4A4A4A]">{cat}</span>
                           <span className="text-brand-sage">{count} Trials</span>
                        </div>
                        <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${(count / analytics.totalDecisions) * 100}%` }}
                             className="h-full bg-brand-sage rounded-full"
                           />
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Efficiency Metric */}
          <div className="lg:col-span-4 bg-[#4A4A4A] text-white rounded-[2.5rem] p-10 relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-12">Operational Efficiency</h3>
                <div className="flex flex-col items-center justify-center text-center py-8">
                   <div className="relative">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/10" />
                        <circle 
                          cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="transparent" 
                          strokeDasharray={364}
                          strokeDashoffset={364 - (364 * analytics.accuracyRate / 100)}
                          className="text-brand-gold"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-3xl font-serif">{analytics.accuracyRate}%</span>
                         <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400">Yield</span>
                      </div>
                   </div>
                   <p className="mt-8 text-xs italic text-gray-300 leading-relaxed">
                      "System throughput indicates high alignment between AI logic and user-reported outcomes."
                   </p>
                </div>
             </div>
          </div>
        </div>

        {/* Audit Trail */}
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10">
           <h3 className="text-[11px] font-black uppercase tracking-widest text-[#4A4A4A] mb-8 flex items-center gap-2">
              <History className="w-4 h-4" /> Recent Decision Audit Trail
           </h3>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <th className="pb-4 pr-6">Dilemma ID</th>
                    <th className="pb-4 pr-6">Complexity</th>
                    <th className="pb-4 pr-6">Status</th>
                    <th className="pb-4 pr-6">System Score</th>
                    <th className="pb-4">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.slice(0, 5).map((item) => (
                    <tr key={item.id} className="group">
                      <td className="py-6 pr-6">
                        <p className="text-sm font-serif italic text-[#4A4A4A] truncate max-w-[240px]">"{item.decision}"</p>
                        <span className="text-[8px] font-bold text-gray-300 uppercase">{item.timestamp}</span>
                      </td>
                      <td className="py-6 pr-6">
                        <div className="flex gap-1">
                          {[1,2,3].map(s => (
                            <div key={s} className={`w-1 h-3 rounded-full ${item.metrics.inputComplexity > (s * 10) ? 'bg-brand-sage' : 'bg-gray-100'}`} />
                          ))}
                        </div>
                      </td>
                      <td className="py-6 pr-6">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${
                          item.outcome?.status === 'success' ? 'bg-brand-sage/5 text-brand-sage border-brand-sage/10' :
                          'bg-gray-50 text-gray-400 border-gray-100'
                        }`}>
                          {item.outcome?.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-6 pr-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-serif">{item.confidence.score}</span>
                          <span className="text-[8px] text-gray-300">/ 100</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <button className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:bg-brand-gold group-hover:text-white transition-all">
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
