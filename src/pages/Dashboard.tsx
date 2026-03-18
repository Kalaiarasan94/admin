import React, { useEffect, useState } from 'react';
import { 
    Users, 
    Cpu, 
    TrendingUp, 
    AlertTriangle,
    CheckCircle,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Shield,
    ClipboardCheck,
    Activity,
    ChevronRight,
    Filter
} from 'lucide-react';
import client from '../api/client';
import { motion } from 'framer-motion';

interface DashboardStats {
    users: { role: string; count: string }[];
    machines: { status: string; count: string }[];
    totalMachines: string;
    production: string;
    qc: string;
    attendance: { status: string; count: string }[];
    headAttendance: { role: string; count: string }[];
    sales?: { count: string; total: string; pending_count: string };
    productionTrend?: { day: string; output: string }[];
}

const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    change?: string; 
    isPositive?: boolean; 
    icon: React.ElementType; 
    color: string;
    delay?: number;
}> = ({ title, value, change, isPositive, icon: Icon, color, delay = 0 }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className="glass p-6 rounded-3xl shadow-soft hover:shadow-strong transition-all duration-300 group overflow-hidden relative"
    >
        {/* Decorative background element */}
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 blur-2xl group-hover:scale-150 transition-transform duration-500 ${color}`} />
        
        <div className="flex items-start justify-between relative z-10">
            <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
                {change && (
                    <div className="flex items-center gap-1.5 mt-3">
                        <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPositive 
                                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" 
                                : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                        }`}>
                            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {change}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">vs yesterday</span>
                    </div>
                )}
            </div>
            <div className={`p-4 rounded-2xl shadow-lg shadow-blue-500/10 ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
    </motion.div>
);

const ActivityItem: React.FC<{ title: string; time: string; type: 'success' | 'warning' | 'info' }> = ({ title, time, type }) => {
    const colors = {
        success: 'bg-emerald-500',
        warning: 'bg-amber-500',
        info: 'bg-blue-500'
    };

    return (
        <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
            <div className={`mt-1.5 w-2 h-2 rounded-full ${colors[type]} ring-4 ring-slate-100 dark:ring-slate-800 shrink-0 shadow-sm`} />
            <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                    <Clock size={10} /> {time}
                </p>
            </div>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-400 self-center" />
        </div>
    );
};

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async (isPolling = false) => {
        try {
            if (!isPolling) setLoading(true);
            setError(null);
            const response = await client.get('/dashboard/stats');
            const data = response.data;
            
            setStats(data);
        } catch (err: any) {
            console.error('Error fetching stats:', err);
            if (!isPolling) setError(err.response?.data?.message || 'Failed to load dashboard data. Please try again later.');
        } finally {
            if (!isPolling) setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        
        const interval = setInterval(() => {
            fetchStats(true);
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh]">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-400 text-sm font-medium animate-pulse">Loading analytics...</p>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] px-4">
                <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20 max-w-md w-full text-center">
                    <AlertTriangle className="mx-auto text-rose-500 mb-4" size={48} />
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Something went wrong</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">{error || 'Unable to fetch dashboard stats'}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl text-sm font-bold shadow-xl hover:scale-105 transition-transform"
                    >
                        Try Refreshing
                    </button>
                </div>
            </div>
        );
    }

    const totalUsers = stats.users.reduce((acc, curr) => acc + parseInt(curr.count || '0'), 0);
    const runningMachines = stats.machines.find(m => m.status?.toLowerCase() === 'running')?.count || '0';

    return (
        <div className="max-w-7xl mx-auto space-y-10 relative">
            {/* Page Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-[0.2em] mb-2">
                        <Activity size={14} /> Live System Feed
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Factory Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Monitoring engine running with full capacity.</p>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20">Today</button>
                    <button className="px-4 py-2 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all">Weekly</button>
                    <button className="px-4 py-2 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all">Monthly</button>
                </div>
            </header>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <StatCard 
                    title="System Users" 
                    value={totalUsers} 
                    change="+2"
                    isPositive={true}
                    icon={Users} 
                    color="bg-indigo-600" 
                    delay={0.1}
                />
                <StatCard 
                    title="Machines Active" 
                    value={`${runningMachines}/${stats.totalMachines}`} 
                    change="-1"
                    isPositive={false}
                    icon={Cpu} 
                    color="bg-purple-600" 
                    delay={0.2}
                />
                <StatCard 
                    title="Output (Units)" 
                    value={stats.production} 
                    change="+12%"
                    isPositive={true}
                    icon={TrendingUp} 
                    color="bg-emerald-600" 
                    delay={0.3}
                />
                <StatCard 
                    title="Quality Score" 
                    value={`${stats.qc} Checks`} 
                    change="98%"
                    isPositive={true}
                    icon={ClipboardCheck} 
                    color="bg-blue-600" 
                    delay={0.4}
                />
                <StatCard 
                    title="Staff Presence" 
                    value={stats.attendance.find(a => a.status?.toLowerCase() === 'present')?.count || '0'} 
                    change="85%"
                    isPositive={true}
                    icon={CheckCircle} 
                    color="bg-sky-600" 
                    delay={0.5}
                />
                <StatCard 
                    title="Pending Sales" 
                    value={stats.sales?.pending_count || '0'} 
                    change="Needs Review"
                    isPositive={false}
                    icon={ClipboardCheck} 
                    color="bg-rose-600" 
                    delay={0.55}
                />
                <StatCard 
                    title="Supervisors" 
                    value={stats.headAttendance.reduce((acc, curr) => acc + parseInt(curr.count || '0'), 0)} 
                    change="On Duty"
                    isPositive={true}
                    icon={Shield} 
                    color="bg-amber-600" 
                    delay={0.6}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Secondary Stats/Analytics */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="glass p-8 rounded-[2rem] shadow-soft border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Performance Analytics</h3>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                                    <span className="text-xs font-bold text-slate-500">Output</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-indigo-300" />
                                    <span className="text-xs font-bold text-slate-500">Efficiency</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Visual placeholder for Chart (using CSS/SVG) */}
                        <div className="h-64 flex items-end justify-between gap-4 px-2">
                            {(stats.productionTrend && stats.productionTrend.length > 0 ? stats.productionTrend : [
                                {day: 'No Data', output: '0'}
                            ]).map((item, i) => {
                                const maxOutput = Math.max(...(stats.productionTrend?.map(p => parseInt(p.output)) || [100]));
                                const height = maxOutput > 0 ? (parseInt(item.output) / maxOutput) * 100 : 0;
                                
                                return (
                                    <div key={i} className="flex-1 group relative">
                                        <motion.div 
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max(height, 5)}%` }}
                                            transition={{ duration: 1, delay: i * 0.05 }}
                                            className="w-full bg-gradient-to-t from-blue-700 to-blue-400 rounded-t-xl opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer relative"
                                        >
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                                {item.output} Units
                                            </div>
                                        </motion.div>
                                        <div className="mt-2 text-[10px] font-black text-slate-400 text-center overflow-hidden">
                                            {item.day}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="glass p-8 rounded-[2rem] shadow-soft">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-black text-slate-900 dark:text-white tracking-tight">System Reliability</h4>
                                <Activity size={20} className="text-blue-600" />
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="48" cy="48" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                                        <circle cx="48" cy="48" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={251.2} strokeDashoffset={251.2 * (1 - 0.992)} className="text-blue-600" />
                                    </svg>
                                    <span className="absolute text-sm font-black text-slate-900 dark:text-white">99.2%</span>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Uptime Score</p>
                                    <p className="text-sm font-bold text-emerald-600">Perfectly Optimized</p>
                                    <div className="flex gap-1">
                                        {[1,2,3,4,5].map(i => <div key={i} className="w-4 h-1 rounded-full bg-emerald-500" />)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="glass p-8 rounded-[2rem] shadow-soft">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-black text-slate-900 dark:text-white tracking-tight">Resource Usage</h4>
                                <TrendingDown size={20} className="text-rose-500" />
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                                        <span className="text-slate-500">Electricity</span>
                                        <span className="text-slate-900 dark:text-white">74%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: '74%' }} transition={{ duration: 1 }} className="h-full bg-blue-600 rounded-full" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                                        <span className="text-slate-500">Raw Material</span>
                                        <span className="text-slate-900 dark:text-white">42%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: '42%' }} transition={{ duration: 1 }} className="h-full bg-indigo-500 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info/Activity */}
                <div className="lg:col-span-4 space-y-10">
                    <div className="glass p-8 rounded-[2rem] shadow-soft border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Activity Feed</h3>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                                <Filter size={16} className="text-slate-400" />
                            </button>
                        </div>
                        <div className="space-y-2 -mx-2">
                            <ActivityItem title="Log ID #452 approved by Head" time="12 mins ago" type="success" />
                            <ActivityItem title="Machine #04 maintenance alert" time="45 mins ago" type="warning" />
                            <ActivityItem title="New inventory batch: PLASTIC_V2" time="2 hours ago" type="info" />
                            <ActivityItem title="User 'John_Doe' role updated" time="3 hours ago" type="info" />
                            <ActivityItem title="Production target reached (Log #451)" time="5 hours ago" type="success" />
                        </div>
                        <button className="w-full mt-6 py-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                            View All History
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-blue-700 to-indigo-800 p-8 rounded-[2rem] shadow-strong text-white relative overflow-hidden group">
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                        <Shield size={48} className="text-white/20 mb-6" />
                        <h4 className="text-2xl font-black mb-3 leading-tight tracking-tight">Security & Compliance</h4>
                        <p className="text-blue-100 text-sm leading-relaxed mb-6 font-medium">All systems are operating under ISO 9001:2015 quality standards.</p>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl w-fit text-xs font-bold">
                            <CheckCircle size={14} className="text-emerald-400" /> Verified 07 Mar 2026
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
