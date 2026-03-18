import React, { useEffect, useState, useCallback } from 'react';
import { 
    Package, 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    X, 
    Boxes,
    Layers,
    Tag,
    AlertTriangle
} from 'lucide-react';
import client from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

// Simple Icon fallback for Mold
const BoxIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
);

interface InventoryItem {
    id: number;
    product_name?: string;
    material_name?: string;
    color_name?: string;
    mold_name?: string;
    item_name?: string;
    opening_stock?: number;
    closing_stock?: number;
    stock_qty_kgs?: number;
    stock_qty_pcs?: number;
    unit?: string;
    minimum_stock_level?: number;
    cavity_options?: string;
    cavity_count?: number;
    cavity_weights?: number[] | Record<string, number>;
    total_weight?: number;
    // Computed fields for UI
    display_name: string;
    display_quantity: number | string;
    display_unit: string;
}

const Inventory: React.FC = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('product');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    
    // Form states
    const [formData, setFormData] = useState<Partial<InventoryItem>>({});

    const tabs = [
        { id: 'product', label: 'Products', icon: Package },
        { id: 'material', label: 'Raw Materials', icon: Layers },
        { id: 'color', label: 'Colors', icon: Tag },
        { id: 'mold', label: 'Molds', icon: BoxIcon },
        { id: 'packing', label: 'Packing', icon: Boxes },
    ];

    const fetchInventory = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.get('/inventory', {
                params: { type: activeTab }
            });
            
            // Map backend data to display format
            const mapped: InventoryItem[] = response.data.map((item: any) => {
                let display_name = '';
                let display_quantity: number | string = 0;
                let display_unit = '';

                if (activeTab === 'product') {
                    display_name = item.product_name || '';
                    display_quantity = item.closing_stock || 0;
                    display_unit = 'PCS';
                } else if (activeTab === 'material') {
                    display_name = item.material_name || '';
                    display_quantity = item.closing_stock || 0;
                    display_unit = item.unit || 'KG';
                } else if (activeTab === 'color') {
                    display_name = item.color_name || '';
                    display_quantity = item.stock_qty_kgs || 0;
                    display_unit = 'KG';
                } else if (activeTab === 'mold') {
                    display_name = item.mold_name || '';
                    display_quantity = item.cavity_count || 1; 
                    display_unit = 'CAVITIES';
                } else if (activeTab === 'packing') {
                    display_name = item.item_name || '';
                    display_quantity = item.stock_qty_pcs || 0;
                    display_unit = 'PCS';
                }

                return { ...item, display_name, display_quantity, display_unit };
            });

            setItems(mapped.filter((i: InventoryItem) => 
                i.display_name.toLowerCase().includes(searchTerm.toLowerCase())
            ));
        } catch (err: any) {
            console.error('Error fetching inventory:', err);
            setError(err.response?.data?.message || 'Failed to fetch inventory assets.');
        } finally {
            setLoading(false);
        }
    }, [activeTab, searchTerm]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleOpenModal = (item: InventoryItem | null = null) => {
        if (item) {
            setEditingItem(item);
            // Ensure cavity_weights is an array if it's a mold
            let initialData = { ...item };
            if (activeTab === 'mold' && item.cavity_weights) {
                if (!Array.isArray(item.cavity_weights)) {
                    // Convert from Record if needed, though backend should return what we store
                    initialData.cavity_weights = Object.values(item.cavity_weights);
                }
            } else if (activeTab === 'mold') {
                initialData.cavity_weights = [];
                initialData.cavity_count = item.cavity_count || 1;
            }
            setFormData(initialData);
        } else {
            setEditingItem(null);
            setFormData(activeTab === 'mold' ? { cavity_count: 1, cavity_weights: [0] } : {});
        }
        setIsModalOpen(true);
    };

    const handleCavityCountChange = (count: number) => {
        const newCount = Math.max(1, count);
        const currentWeights = Array.isArray(formData.cavity_weights) ? [...formData.cavity_weights] : [];
        
        const newWeights = Array(newCount).fill(0).map((_, i) => currentWeights[i] || 0);
        
        setFormData({
            ...formData,
            cavity_count: newCount,
            cavity_weights: newWeights
        });
    };

    const handleWeightChange = (index: number, weight: number) => {
        const currentWeights = Array.isArray(formData.cavity_weights) ? [...formData.cavity_weights] : [];
        currentWeights[index] = weight;
        setFormData({
            ...formData,
            cavity_weights: currentWeights
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation for mold
        if (activeTab === 'mold') {
            if (!formData.mold_name) {
                alert('Mold name is required');
                return;
            }
            if (!formData.cavity_count || formData.cavity_count < 1) {
                alert('Cavity count must be at least 1');
                return;
            }
            if (Array.isArray(formData.cavity_weights)) {
                if (formData.cavity_weights.length !== formData.cavity_count) {
                    alert('Number of weights must match cavity count');
                    return;
                }
                if (formData.cavity_weights.some(w => isNaN(w) || w <= 0)) {
                    alert('All cavity weights must be valid positive numbers');
                    return;
                }
            }
        }
        try {
            const dataToSave = { ...formData };
            // Clean up computed fields before sending to backend
            delete dataToSave.display_name;
            delete dataToSave.display_quantity;
            delete dataToSave.display_unit;

            if (editingItem) {
                await client.put(`/inventory/${activeTab}/${editingItem.id}`, dataToSave);
            } else {
                await client.post(`/inventory/${activeTab}`, dataToSave);
            }
            setIsModalOpen(false);
            fetchInventory();
        } catch (err) {
            console.error('Error saving inventory item:', err);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Delete this item from registry?')) {
            try {
                await client.delete(`/inventory/${activeTab}/${id}`);
                fetchInventory();
            } catch (err) {
                console.error('Error deleting item:', err);
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-[0.2em] mb-2">
                        <Package size={14} /> Global Warehouse
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Inventory Assets</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Real-time tracking of raw materials and finished products.</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => fetchInventory()}
                        className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-2xl shadow-soft transition-all active:scale-95"
                    >
                        <Search size={20} />
                    </button>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3.5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95"
                    >
                        <Plus size={18} />
                        Register Asset
                    </button>
                </div>
            </header>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-[2rem] w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === tab.id 
                                ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" 
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <div className="relative group max-w-xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder={`Search ${activeTab}s...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-white shadow-soft focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                />
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-[200px] bg-slate-100 dark:bg-slate-800/50 rounded-[2.5rem] animate-pulse" />
                        ))
                    ) : error ? (
                        <div className="col-span-full py-20 text-center">
                            <div className="p-8 bg-rose-50 dark:bg-rose-900/10 rounded-3xl border border-rose-100 dark:border-rose-900/20 max-w-md mx-auto">
                                <AlertTriangle className="mx-auto text-rose-500 mb-4" size={48} />
                                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Sync Failure</h2>
                                <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
                                <button 
                                    onClick={() => fetchInventory()}
                                    className="px-6 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl text-sm font-bold shadow-xl hover:scale-105 transition-transform"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-300 mx-auto mb-4">
                                <Package size={40} />
                            </div>
                            <p className="text-slate-400 font-bold">No assets found in this category</p>
                        </div>
                    ) : (
                        items.map((item, idx) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                key={item.id}
                                className="glass p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                    <button 
                                        onClick={() => handleOpenModal(item)}
                                        className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-xl shadow-soft transition-all active:scale-90"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(item.id)}
                                        className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 rounded-xl shadow-soft transition-all active:scale-90"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="inline-flex px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                        {activeTab}
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{item.display_name}</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Asset #{item.id.toString().padStart(5, '0')}</p>
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                {activeTab === 'mold' ? 'Capacity' : 'Stock Level'}
                                            </p>
                                            <div className="flex items-baseline gap-1">
                                                <span className={`text-3xl font-black text-slate-900 dark:text-white`}>
                                                    {item.display_quantity}
                                                </span>
                                                <span className="text-sm font-black text-slate-400 uppercase">{item.display_unit}</span>
                                            </div>
                                        </div>

                                        {activeTab === 'mold' && (
                                            <div className="flex gap-6 text-right">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Weight</p>
                                                    <p className="text-sm font-black text-blue-600 dark:text-blue-400">
                                                        {(Array.isArray(item.cavity_weights) 
                                                            ? (item.cavity_weights.reduce((a: number, b: number) => a + b, 0) / (item.cavity_weights.length || 1))
                                                            : 0
                                                        ).toFixed(2)}g
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Weight</p>
                                                    <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                                                        {Number(item.total_weight || 0).toFixed(2)}g
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Asset Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" 
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-10 bg-slate-900 text-white relative">
                                <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                                <h2 className="text-3xl font-black tracking-tight uppercase">
                                    {editingItem ? 'Edit Asset' : 'New Asset'}
                                </h2>
                                <p className="text-slate-400 text-sm font-medium mt-2">
                                    {activeTab.toUpperCase()} Category Registry
                                </p>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="p-10 space-y-6">
                                <div className="space-y-4">
                                    {activeTab === 'product' && (
                                        <>
                                            <input 
                                                placeholder="Product Name"
                                                value={formData.product_name || ''}
                                                onChange={e => setFormData({...formData, product_name: e.target.value})}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none"
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <input type="number" placeholder="Opening Stock" value={formData.opening_stock || ''} onChange={e => setFormData({...formData, opening_stock: Number(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none" />
                                                <input type="number" placeholder="Closing Stock" value={formData.closing_stock || ''} onChange={e => setFormData({...formData, closing_stock: Number(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none" />
                                            </div>
                                        </>
                                    )}
                                    {activeTab === 'material' && (
                                        <>
                                            <input placeholder="Material Name" value={formData.material_name || ''} onChange={e => setFormData({...formData, material_name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <input type="number" placeholder="Opening Stock" value={formData.opening_stock || ''} onChange={e => setFormData({...formData, opening_stock: Number(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none" />
                                                <input placeholder="Unit (KG/MT)" value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none" />
                                            </div>
                                        </>
                                    )}
                                    {activeTab === 'color' && (
                                        <>
                                            <input placeholder="Color Name" value={formData.color_name || ''} onChange={e => setFormData({...formData, color_name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none" />
                                            <input type="number" placeholder="Stock Qty (KG)" value={formData.stock_qty_kgs || ''} onChange={e => setFormData({...formData, stock_qty_kgs: Number(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none" />
                                        </>
                                    )}
                                    {activeTab === 'mold' && (
                                        <div className="space-y-4 max-h-[40vh] overflow-y-auto px-2 pb-2 scrollbar-hide">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Mold Name</label>
                                                <input placeholder="Mold Name" value={formData.mold_name || ''} onChange={e => setFormData({...formData, mold_name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">No. of Cavities</label>
                                                <input 
                                                    type="number" 
                                                    placeholder="No. of Cavities" 
                                                    value={formData.cavity_count || ''} 
                                                    onChange={e => handleCavityCountChange(parseInt(e.target.value) || 0)} 
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Cavity Weights (g)</label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {Array.isArray(formData.cavity_weights) && formData.cavity_weights.map((weight, index) => (
                                                        <div key={index} className="space-y-1">
                                                            <p className="text-[9px] font-bold text-slate-400 px-2">Cavity {index + 1}</p>
                                                            <input 
                                                                type="number" 
                                                                step="0.01" 
                                                                placeholder="Weight" 
                                                                value={weight || ''} 
                                                                onChange={e => handleWeightChange(index, parseFloat(e.target.value) || 0)} 
                                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-white outline-none text-sm" 
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Cavity Options</label>
                                                <input placeholder="Cavity Options (Description)" value={formData.cavity_options || ''} onChange={e => setFormData({...formData, cavity_options: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none" />
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === 'packing' && (
                                        <>
                                            <input placeholder="Item Name" value={formData.item_name || ''} onChange={e => setFormData({...formData, item_name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none" />
                                            <input type="number" placeholder="Stock Qty (PCS)" value={formData.stock_qty_pcs || ''} onChange={e => setFormData({...formData, stock_qty_pcs: Number(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none" />
                                        </>
                                    )}
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all"
                                    >
                                        Discard
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-[2] px-6 py-4 text-xs font-black uppercase tracking-widest text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:opacity-90 rounded-2xl transition-all shadow-xl active:scale-95"
                                    >
                                        {editingItem ? 'Commit Update' : 'Initialize Asset'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Inventory;
