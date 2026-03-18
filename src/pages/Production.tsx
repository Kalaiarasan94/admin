import React, { useEffect, useState } from 'react';
import { 
    Plus, 
    Search, 
    Calendar, 
    Cpu, 
    ClipboardList,
    TrendingUp,
    Timer,
    BarChart3,
    Filter
} from 'lucide-react';
import client from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

interface Production {
    log_id: number;
    machine_id: number;
    machine_name?: string;
    product_name?: string;
    total_output: number;
    created_at: string;
    approval_status: string;
    shift: string;
}

const Production: React.FC = () => {
    const [productions, setProductions] = useState<Production[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // For new production entry (simulated for admin)
    const fetchProduction = async () => {
        setLoading(true);
        try {
            const response = await client.get('/production', {
                params: { search: searchTerm }
            });
            setProductions(response.data);
        } catch (err) {
            console.error('Error fetching production logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProduction();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-2">
                        <TrendingUp size={14} /> Throughput Monitoring
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Production Intelligence</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Historical audit of operational output and efficiency metrics.</p>
                </div>
                <div className="flex gap-4">
                    <button className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 px-6 py-3.5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-soft active:scale-95">
                        <ClipboardList size={18} />
                        Export Log
                    </button>
                </div>
            </header>

            {/* Efficiency Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Avg Daily Output', value: '1,280', unit: 'm', icon: BarChart3, color: 'blue' },
                    { label: 'Active Machines', value: '08', unit: 'Units', icon: Cpu, color: 'emerald' },
                    { label: 'Operational Time', value: '22.4', unit: 'h', icon: Timer, color: 'purple' },
                    { label: 'Yield Rate', value: '98.2', unit: '%', icon: TrendingUp, color: 'indigo' },
                ].map((stat, i) => (
                    <div key={i} className="glass p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-soft group hover:translate-y-[-4px] transition-all">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{stat.label}</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
                            <span className="text-xs font-bold text-slate-400 uppercase">{stat.unit}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search and Advanced Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Filter by machine, head or serial..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-white shadow-soft focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-[1.25rem] text-slate-400 hover:text-indigo-600 transition-all shadow-soft">
                        <Calendar size={20} />
                    </button>
                    <button className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-[1.25rem] text-slate-400 hover:text-indigo-600 transition-all shadow-soft">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {/* Production Table */}
            <div className="glass rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-slate-800 overflow-hidden relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Machine Unit</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Product Asset</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shift</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Output</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Approval</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-8 py-6"><div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full"></div></td>
                                    </tr>
                                ))
                            ) : productions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-slate-300">
                                                <ClipboardList size={32} />
                                            </div>
                                            <p className="text-slate-400 font-bold">No production logs registered</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                productions.map((p, idx) => (
                                    <motion.tr 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        key={p.log_id} 
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                                    <Calendar size={14} />
                                                </div>
                                                <div className="font-bold text-slate-900 dark:text-white text-sm">
                                                    {new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <Cpu size={16} className="text-slate-400" />
                                                <span className="font-black text-slate-700 dark:text-slate-300 tracking-tight">Machine #{p.machine_id}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500">
                                                    {(p.product_name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-slate-600 dark:text-slate-400 text-sm">{p.product_name || 'Generic Product'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-slate-500 uppercase">{p.shift}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-black text-slate-900 dark:text-white">{p.total_output}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Units</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                                p.approval_status === 'approved' 
                                                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                                                    : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30"
                                            }`}>
                                                {p.approval_status}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Production;
