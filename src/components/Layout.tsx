import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Users, 
    Package, 
    LogOut, 
    Menu, 
    Cpu,
    Factory,
    ClipboardCheck,
    Search,
    ChevronLeft,
    Monitor,
    ShieldCheck,
    FileText,
    TrendingUp,
    Truck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const NavItem: React.FC<{ 
    item: { name: string; path: string; icon: any }; 
    isActive: boolean;
    isCollapsed: boolean;
}> = ({ item, isActive, isCollapsed }) => {
    return (
        <Link
            to={item.path}
            className={cn(
                "relative flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-300 group",
                isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            )}
        >
            <item.icon size={20} className={cn("shrink-0", isActive ? "text-white" : "group-hover:scale-110 transition-transform")} />
            {!isCollapsed && (
                <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="whitespace-nowrap"
                >
                    {item.name}
                </motion.span>
            )}
            {isActive && !isCollapsed && (
                <motion.div 
                    layoutId="activeNav"
                    className="absolute right-2 w-1.5 h-5 bg-white/30 rounded-full"
                />
            )}
        </Link>
    );
};

const Layout: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'User Management', path: '/users', icon: Users },
        { name: 'Inventory', path: '/inventory', icon: Package },
        { name: 'Machines', path: '/machines', icon: Cpu },
        { name: 'Production', path: '/production', icon: Factory },
        { name: 'Quality Control', path: '/qc', icon: ClipboardCheck },
        { name: 'Sales Approvals', path: '/sales-approvals', icon: FileText },
        { name: 'Sales History', path: '/sales-history', icon: TrendingUp },
        { name: 'Dispatch', path: '/dispatch', icon: Truck },
        { name: 'Purchase Requests', path: '/purchase-requests', icon: ClipboardCheck },
        { name: 'Purchase Approvals', path: '/purchase-approvals', icon: ShieldCheck },
        { name: 'Purchase History', path: '/purchase-history', icon: Package },
    ];

    return (
        <div className="flex h-screen bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-500 dark">
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileOpen(false)}
                        className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside 
                className={cn(
                    "fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-all duration-500 ease-in-out lg:relative lg:translate-x-0",
                    isCollapsed ? "w-24" : "w-72",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className={cn("flex items-center h-24 px-6 mb-4", isCollapsed ? "justify-center" : "justify-between")}>
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-tr from-blue-700 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <Monitor size={24} className="text-white" />
                            </div>
                            {!isCollapsed && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex flex-col"
                                >
                                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">FACTORY ADMIN PORTAL</span>
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] leading-none mt-0.5">Admin v2.0</span>
                                </motion.div>
                            )}
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                        <div className={cn("px-4 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]", isCollapsed && "text-center")}>
                            {isCollapsed ? '•••' : 'Main Navigation'}
                        </div>
                        {navItems.map((item) => (
                            <NavItem 
                                key={item.path} 
                                item={item} 
                                isActive={location.pathname === item.path}
                                isCollapsed={isCollapsed}
                            />
                        ))}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="p-4 mt-auto border-t border-slate-50 dark:border-slate-800">
                        <div className={cn("flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] mb-4", isCollapsed && "justify-center")}>
                            <div className="relative shrink-0">
                                <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-blue-600 font-black shadow-sm">
                                    {user?.username?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase tracking-wider">
                                        {user?.username || 'Administrator'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                        System {user?.role || 'Root'}
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <button
                            onClick={handleLogout}
                            className={cn(
                                "flex items-center gap-3 w-full px-4 py-3 text-xs font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all uppercase tracking-widest",
                                isCollapsed && "justify-center"
                            )}
                        >
                            <LogOut size={18} />
                            {!isCollapsed && <span>End Session</span>}
                        </button>
                    </div>
                </div>

                {/* Collapse Toggle (Desktop) */}
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-4 top-10 hidden lg:flex w-8 h-8 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full items-center justify-center shadow-sm text-slate-400 hover:text-blue-600 transition-colors z-50"
                >
                    <ChevronLeft size={16} className={cn("transition-transform duration-500", isCollapsed && "rotate-180")} />
                </button>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Global Header */}
                <header className="h-24 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-6">
                        <button
                            className="p-3 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl lg:hidden transition-colors"
                            onClick={() => setIsMobileOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        
                        {/* Search Bar */}
                        <div className="hidden md:flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-5 py-2.5 rounded-2xl border border-transparent focus-within:border-blue-500/20 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all w-80 group">
                            <Search size={18} className="text-slate-400 group-focus-within:text-blue-500" />
                            <input 
                                type="text" 
                                placeholder="Global Search..." 
                                className="bg-transparent border-none text-sm font-bold text-slate-600 dark:text-slate-300 focus:outline-none w-full"
                            />
                            <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-black text-slate-500 dark:text-slate-400">
                                ⌘K
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Notifications removed */}
                        
                        <div className="h-10 w-[1px] bg-slate-100 dark:bg-slate-800 mx-2" />

                        <div className="flex items-center gap-3 pl-2">
                            <div className="hidden sm:block text-right">
                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-1">
                                    {user?.username || 'ADMIN'}
                                </p>
                                <div className="flex items-center gap-1.5 justify-end">
                                    <ShieldCheck size={10} className="text-blue-600" />
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Verified</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 border-2 border-white dark:border-slate-800 rounded-2xl flex items-center justify-center shadow-soft overflow-hidden">
                                <img 
                                    src={`https://ui-avatars.com/api/?name=${user?.username || 'Admin'}&background=0D8ABC&color=fff&bold=true`} 
                                    alt="User" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
