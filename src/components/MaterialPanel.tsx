
import React, { useState, useMemo } from 'react';
import { useData } from '../DataContext';
import { Package, Plus, Search, History, IndianRupee, X, FileText, Layers, Scissors, Shirt, Ruler, CheckCircle2, ChevronRight, AlertCircle, Bell, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { MOCK_INVENTORY } from '../constants';
import { WalletSection } from './WalletSection';
import { Order, OrderStatus, InventoryItem } from '../types';

// --- CONFIGURATION FOR GARMENT MATERIALS (WITH HINDI TERMS & DEFAULTS) ---
const GARMENT_PRESETS: Record<string, string[]> = {
    'Shirt': ['Box Patti (Box Pati)', 'Collar (Kolar)', 'Cuff (Kaf)', 'Buttons (Batan)', 'Thread (Reel)', 'Fusing'],
    'Kurta': ['Buttons (Batan)', 'Thread (Reel)', 'Fusing', 'Collar (Kolar)'],
    'Pant': ['Belt Roll', 'Grip (Girrf)', 'Zip (Chain Jip)', 'Hook (Huk)', 'Pocketing (Pogetin)', 'Thread (Reel)'],
    'Pyjama': ['Nada/Elastic', 'Thread (Reel)'],
    'Trousers': ['Zip (Chain)', 'Hook (Huk)', 'Grip (Girrf)', 'Pocketing', 'Thread (Reel)'],
    'Safari': ['Buttons (Pcs)', 'Fusing', 'Canvas', 'Pads', 'Lining'],
    'Coat': ['Canvas', 'Fusing', 'Pads', 'Buttons', 'Lining', 'Felt'],
    'Suit': ['Canvas', 'Fusing', 'Buttons', 'Zip', 'Hook'],
    'Sherwani': ['Canvas', 'Fusing', 'Fancy Buttons', 'Lining', 'Pads'],
};

// --- DEFAULT VALUES MAP ---
const DEFAULT_VALUES: Record<string, string> = {
    'Box Patti (Box Pati)': '20 Inch',
    'Collar (Kolar)': '15 Inch',
    'Cuff (Kaf)': '9 Inch',
    'Buttons (Batan)': '14 Pcs',
    'Thread (Reel)': '1 Gati',
    'Belt Roll': '36 Inch',
    'Grip (Girrf)': '38 Inch',
    'Zip (Chain Jip)': '1 Pich',
    'Hook (Huk)': '1 Jodi',
    'Pocketing (Pogetin)': '15 Inch'
};

// Default inventory for fallback
const INVENTORY_TYPES = [
    "Thread", "Button", "Canvas", "Zip", "Hook", "Grip", "Collar Material", "Pocketing", "Belt Roll", "Patti Roll", "Fabric", "Lining"
];

export const MaterialPanel: React.FC = () => {
  const { inventory, currentUser, processWorkerPayout, transactions, orders, addOrderLog, addInventoryItem, payoutRates } = useData(); 
  
  const displayInventory = inventory.length > 0 ? inventory : MOCK_INVENTORY;
  
  // Filter logs for material history
  const materialLogs = transactions.filter(t => 
      t.description.includes('Stock Entry') || t.description.includes('Material Used')
  );

  const [activeTab, setActiveTab] = useState<'ISSUE' | 'STOCK' | 'LOGS'>('ISSUE');
  
  // --- ISSUE TAB STATE ---
  const [billSearch, setBillSearch] = useState('');
  // Expanded state: billNumber -> itemType (to toggle specific form)
  const [expandedForm, setExpandedForm] = useState<{bill: string, type: string} | null>(null);
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  
  // Dynamic Material Form State
  const [materialInputs, setMaterialInputs] = useState<Record<string, string>>({}); 
  const [customMaterialName, setCustomMaterialName] = useState('');
  const [customMaterialValue, setCustomMaterialValue] = useState('');

  // --- STOCK TAB STATE ---
  const [stockSearch, setStockSearch] = useState('');
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [newStockItem, setNewStockItem] = useState({ name: '', type: 'Thread', qty: '', unit: 'Pcs', price: '' });

  // --- DERIVED STATE: PENDING REQUESTS ---
  // Orders that are in STITCHING phase
  const pendingRequests = useMemo(() => {
      return orders.filter(o => {
          const isStitching = o.status === OrderStatus.STITCHING;
          return isStitching;
      });
  }, [orders]);

  // --- HANDLERS ---

  const handleBillSearch = (e: React.FormEvent) => {
      e.preventDefault();
      const term = billSearch.trim().toLowerCase();
      if (!term) return;
      
      const found = orders.find(o => o.billNumber.toLowerCase() === term);
      if (found) {
          setFoundOrder(found);
      } else {
          alert("Order not found with Bill Number: " + term);
          setFoundOrder(null);
      }
      setBillSearch('');
  };

  const toggleIssueForm = (order: Order, itemType: string) => {
      // Toggle logic
      if (expandedForm?.bill === order.billNumber && expandedForm?.type === itemType) {
          setExpandedForm(null);
          setMaterialInputs({});
      } else {
          setExpandedForm({ bill: order.billNumber, type: itemType });
          
          // Initialize inputs based on preset AND Default Values
          const preset = GARMENT_PRESETS[itemType] || GARMENT_PRESETS['Shirt']; 
          const initial: Record<string, string> = {};
          
          preset.forEach(field => {
              initial[field] = DEFAULT_VALUES[field] || '';
          });
          
          setMaterialInputs(initial);
      }
  };

  const handleInputChange = (field: string, value: string) => {
      setMaterialInputs(prev => ({...prev, [field]: value}));
  };

  const handleAddCustomField = () => {
      if(customMaterialName && customMaterialValue) {
          setMaterialInputs(prev => ({...prev, [customMaterialName]: customMaterialValue}));
          setCustomMaterialName('');
          setCustomMaterialValue('');
      }
  };

  const submitIssueMaterial = (order: Order, itemType: string) => {
      if (!currentUser) return;

      // Filter out empty inputs
      const usedMaterials = Object.entries(materialInputs)
        .filter(([_, val]) => (val as string).trim() !== '')
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ');

      if (!usedMaterials) {
          alert("Please confirm at least one material value.");
          return;
      }

      // 1. Log Payout Transaction
      const description = `Material Used for ${itemType} (Bill ${order.billNumber}): ${usedMaterials}`;
      processWorkerPayout(
          currentUser.id,
          payoutRates.MATERIAL_ISSUE, // Small incentive for logging
          description,
          order.billNumber
      );

      // 2. Add to Order History so it shows in "Work History" Report & marks as issued
      addOrderLog(order.billNumber, `Material Issued by ${currentUser.name} for ${itemType}: ${usedMaterials}`);

      alert("Material Issued Successfully!");
      setExpandedForm(null);
      setMaterialInputs({});
  };

  const submitAddStock = () => {
      if (!currentUser) return;
      if (!newStockItem.name || !newStockItem.qty) return;

      // 1. Create real item
      const newItem: InventoryItem = {
          id: `MAT-${Date.now()}`,
          name: newStockItem.name,
          type: newStockItem.type as any,
          quantity: parseFloat(newStockItem.qty),
          unit: newStockItem.unit,
          costPerUnit: parseFloat(newStockItem.price) || 0,
          status: 'In Stock'
      };

      // 2. Add to global state
      addInventoryItem(newItem);

      // 3. Log payout
      const desc = `Stock Entry: ${newStockItem.name} - ${newStockItem.qty} ${newStockItem.unit} @ ₹${newStockItem.price || 0}/unit`;
      processWorkerPayout(
          currentUser.id,
          payoutRates.MATERIAL_ENTRY,
          desc,
          'STOCK-ENTRY'
      );
      
      alert("Stock Added Successfully!");
      setIsAddStockModalOpen(false);
      setNewStockItem({ name: '', type: 'Thread', qty: '', unit: 'Pcs', price: '' });
  };

  // Helper to extract distinct item types from an order string list or itemType field
  const getOrderItems = (order: Order) => {
      const distinctTypes = new Set<string>();
      
      // Check items array
      if (order.items && order.items.length > 0) {
          order.items.forEach(i => {
              if (i.toLowerCase().includes('shirt')) distinctTypes.add('Shirt');
              else if (i.toLowerCase().includes('pant')) distinctTypes.add('Pant');
              else if (i.toLowerCase().includes('coat')) distinctTypes.add('Coat');
              else if (i.toLowerCase().includes('safari')) distinctTypes.add('Safari');
              else if (i.toLowerCase().includes('kurta')) distinctTypes.add('Kurta');
              else if (i.toLowerCase().includes('suit')) distinctTypes.add('Suit');
              else if (i.toLowerCase().includes('sherwani')) distinctTypes.add('Sherwani');
              else if (i.toLowerCase().includes('pyjama')) distinctTypes.add('Pyjama');
          });
      }
      
      // Fallback to main itemType if nothing found in items
      if (distinctTypes.size === 0) {
          distinctTypes.add(order.itemType);
      }
      
      return Array.from(distinctTypes);
  };

  return (
    <div className="space-y-6 animate-fade-in relative perspective-[1000px]">
      
      {/* --- HEADER & TABS --- */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif text-white tracking-wide">Material <span className="text-gold-500">Master</span></h2>
          <p className="text-neutral-400 text-sm mt-1">Issue Material by Bill No. & Manage Stock</p>
        </div>
        <div className="flex bg-neutral-900 rounded-xl p-1.5 border border-white/5 backdrop-blur-md">
          <button onClick={() => setActiveTab('ISSUE')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'ISSUE' ? 'bg-gold-600 text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}>Issue Material</button>
          <button onClick={() => setActiveTab('STOCK')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'STOCK' ? 'bg-gold-600 text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}>Stock Inventory</button>
          <button onClick={() => setActiveTab('LOGS')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'LOGS' ? 'bg-gold-600 text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}>History Logs</button>
        </div>
      </div>

      <WalletSection />

      {/* --- ISSUE MATERIAL TAB (MAIN) --- */}
      {activeTab === 'ISSUE' && (
          <div className="space-y-8 animate-fade-in">
              
              {/* 1. Pending Requests Section (Notifications/Tasks) */}
              <div className="space-y-4">
                  <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-gold-500 animate-pulse" />
                      <h3 className="text-xl font-bold text-white">Pending Material Requests</h3>
                      <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                  </div>
                  
                  {pendingRequests.length === 0 ? (
                      <div className="bg-neutral-900/30 border border-neutral-800 border-dashed rounded-xl p-8 text-center text-neutral-500">
                          <p>No pending material requests from Cutting Department.</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 gap-4">
                          {pendingRequests.map(order => {
                              const distinctItems = getOrderItems(order);
                              
                              return (
                              <div key={order.billNumber} className="bg-gradient-to-br from-neutral-900 to-black border border-neutral-800 rounded-xl overflow-hidden hover:border-gold-600/50 transition-all card-3d">
                                  {/* Card Header */}
                                  <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                      <div>
                                          <div className="flex items-center gap-3 mb-1">
                                              <span className="text-gold-500 font-mono font-bold text-lg">{order.billNumber}</span>
                                              {order.vipCategory && <span className="text-[10px] bg-gold-900/30 text-gold-500 px-2 py-0.5 rounded border border-gold-900/50 flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> VIP</span>}
                                          </div>
                                          <h4 className="text-white font-bold text-xl">{order.customerName}</h4>
                                          <p className="text-xs text-neutral-500 mt-1">Received from: {order.history?.[order.history.length-1]?.updatedBy || 'Cutting'}</p>
                                      </div>
                                      
                                      <div className="flex flex-wrap gap-2">
                                          {distinctItems.map((type) => {
                                              const isExpanded = expandedForm?.bill === order.billNumber && expandedForm?.type === type;
                                              // Check if this specific item type has been issued already in history logs
                                              const isIssued = order.history?.some(h => h.description?.includes(`Material Issued`) && h.description?.includes(type));

                                              return (
                                                  <button 
                                                    key={type}
                                                    onClick={() => !isIssued && toggleIssueForm(order, type)}
                                                    disabled={isIssued}
                                                    className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all border ${isIssued ? 'bg-green-900/20 text-green-500 border-green-900 cursor-default' : isExpanded ? 'bg-gold-600 text-black border-gold-600' : 'bg-neutral-800 text-white border-neutral-700 hover:border-gold-500'}`}
                                                  >
                                                      {isIssued ? <CheckCircle2 className="h-4 w-4"/> : (isExpanded ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>)}
                                                      {type} Material {isIssued && '(Done)'}
                                                  </button>
                                              );
                                          })}
                                      </div>
                                  </div>

                                  {/* INLINE FORM (ACCORDION STYLE) */}
                                  {expandedForm?.bill === order.billNumber && (
                                      <div className="border-t border-neutral-800 bg-black/40 p-6 animate-fade-in">
                                          <div className="flex items-center gap-2 mb-4">
                                              <div className="h-px flex-1 bg-neutral-800"></div>
                                              <span className="text-xs text-gold-500 uppercase font-bold tracking-widest">Adding Material For {expandedForm.type}</span>
                                              <div className="h-px flex-1 bg-neutral-800"></div>
                                          </div>

                                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                                              {Object.keys(materialInputs).map((label) => (
                                                  <div key={label}>
                                                      <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">{label}</label>
                                                      <input 
                                                          type="text" 
                                                          value={materialInputs[label]} 
                                                          onChange={(e) => handleInputChange(label, e.target.value)}
                                                          className="w-full bg-neutral-900 border border-neutral-700 text-white p-2 rounded-lg focus:border-gold-500 focus:outline-none font-bold text-sm"
                                                          placeholder="Value..."
                                                      />
                                                  </div>
                                              ))}
                                          </div>

                                          {/* Custom Item Row */}
                                          <div className="flex gap-2 mb-6 max-w-md">
                                               <input 
                                                  value={customMaterialName} 
                                                  onChange={e => setCustomMaterialName(e.target.value)} 
                                                  className="flex-1 bg-neutral-900 border border-neutral-700 text-white p-2 rounded-lg text-xs" 
                                                  placeholder="Other Item (e.g. Logo)"
                                              />
                                              <input 
                                                  value={customMaterialValue} 
                                                  onChange={e => setCustomMaterialValue(e.target.value)} 
                                                  className="w-24 bg-neutral-900 border border-neutral-700 text-white p-2 rounded-lg text-xs" 
                                                  placeholder="Qty"
                                              />
                                              <button onClick={handleAddCustomField} className="bg-neutral-800 text-white px-3 rounded-lg hover:bg-gold-600 hover:text-black font-bold"><Plus className="h-4 w-4"/></button>
                                          </div>

                                          <div className="flex justify-end gap-3">
                                              <button onClick={() => setExpandedForm(null)} className="px-6 py-2 rounded-lg border border-neutral-700 text-white hover:bg-neutral-800 text-sm font-bold">Cancel</button>
                                              <button 
                                                  onClick={() => submitIssueMaterial(order, expandedForm.type)}
                                                  className="px-8 py-2 rounded-lg bg-gold-600 hover:bg-gold-500 text-black font-bold text-sm shadow-lg flex items-center gap-2"
                                              >
                                                  <CheckCircle2 className="h-4 w-4" /> Save & Confirm
                                              </button>
                                          </div>
                                      </div>
                                  )}
                              </div>
                              );
                          })}
                      </div>
                  )}
              </div>

              {/* 2. Manual Search (Fallback) */}
              <div className="pt-8 border-t border-neutral-800">
                  <div className="glass-panel p-6 border border-neutral-800 rounded-2xl flex flex-col md:flex-row gap-6 items-center">
                      <div className="w-full md:w-1/2">
                          <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold block mb-2">Manual Search (If not in pending)</label>
                          <form onSubmit={handleBillSearch} className="relative">
                              <input 
                                  type="text" 
                                  placeholder="Enter Bill Number..." 
                                  value={billSearch}
                                  onChange={(e) => setBillSearch(e.target.value)}
                                  className="w-full bg-black/60 border border-neutral-700 text-white pl-10 pr-4 py-3 rounded-xl focus:border-gold-500 focus:outline-none uppercase font-mono shadow-inner"
                              />
                              <Search className="absolute left-3 top-3.5 h-4 w-4 text-neutral-500" />
                              <button type="submit" className="absolute right-2 top-2 bottom-2 bg-neutral-800 hover:bg-gold-600 hover:text-black text-white px-4 rounded-lg font-bold text-xs transition-all">Search</button>
                          </form>
                      </div>
                  </div>

                  {/* Search Result */}
                  {foundOrder && (
                      <div className="mt-6 p-4 bg-neutral-900/50 border border-gold-600/30 rounded-xl animate-fade-in">
                          <div className="flex justify-between items-center mb-4">
                              <h4 className="text-white font-bold">{foundOrder.customerName} <span className="text-gold-500 text-sm">({foundOrder.billNumber})</span></h4>
                              <button onClick={() => setFoundOrder(null)} className="text-neutral-500 hover:text-white"><X className="h-4 w-4"/></button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                              {(foundOrder.items && foundOrder.items.length > 0 ? foundOrder.items : [foundOrder.itemType]).map((itemStr, idx) => {
                                  let type = foundOrder.itemType; 
                                  if(itemStr.toLowerCase().includes('shirt')) type = 'Shirt';
                                  else if(itemStr.toLowerCase().includes('pant')) type = 'Pant';
                                  
                                  const isExpanded = expandedForm?.bill === foundOrder.billNumber && expandedForm?.type === type;
                                  // Check if issued
                                  const isIssued = foundOrder.history?.some(h => h.description?.includes(`Material Issued`) && h.description?.includes(type));

                                  return (
                                      <button 
                                        key={idx}
                                        onClick={() => !isIssued && toggleIssueForm(foundOrder, type)}
                                        disabled={isIssued}
                                        className={`bg-black border ${isExpanded ? 'border-gold-500 bg-neutral-800' : 'border-neutral-700 hover:border-gold-500'} text-white p-3 rounded-lg flex items-center justify-between group transition-all ${isIssued ? 'opacity-60 cursor-not-allowed' : ''}`}
                                      >
                                          <span>{type} {isIssued && '(Done)'}</span>
                                          {isIssued ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : (isExpanded ? <ChevronUp className="h-4 w-4 text-gold-500" /> : <ArrowRight className="h-4 w-4 text-neutral-500 group-hover:text-gold-500" />)}
                                      </button>
                                  );
                              })}
                          </div>
                          
                          {/* INLINE FORM FOR FOUND ORDER */}
                          {expandedForm?.bill === foundOrder.billNumber && (
                              <div className="mt-4 border-t border-neutral-800 bg-black/40 p-6 animate-fade-in rounded-xl">
                                  <div className="flex items-center gap-2 mb-4">
                                      <div className="h-px flex-1 bg-neutral-800"></div>
                                      <span className="text-xs text-gold-500 uppercase font-bold tracking-widest">Adding Material For {expandedForm.type}</span>
                                      <div className="h-px flex-1 bg-neutral-800"></div>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                                      {Object.keys(materialInputs).map((label) => (
                                          <div key={label}>
                                              <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">{label}</label>
                                              <input 
                                                  type="text" 
                                                  value={materialInputs[label]} 
                                                  onChange={(e) => handleInputChange(label, e.target.value)}
                                                  className="w-full bg-neutral-900 border border-neutral-700 text-white p-2 rounded-lg focus:border-gold-500 focus:outline-none font-bold text-sm"
                                                  placeholder="Value..."
                                              />
                                          </div>
                                      ))}
                                  </div>

                                  {/* Custom Item Row */}
                                  <div className="flex gap-2 mb-6 max-w-md">
                                       <input 
                                          value={customMaterialName} 
                                          onChange={e => setCustomMaterialName(e.target.value)} 
                                          className="flex-1 bg-neutral-900 border border-neutral-700 text-white p-2 rounded-lg text-xs" 
                                          placeholder="Other Item (e.g. Logo)"
                                      />
                                      <input 
                                          value={customMaterialValue} 
                                          onChange={e => setCustomMaterialValue(e.target.value)} 
                                          className="w-24 bg-neutral-900 border border-neutral-700 text-white p-2 rounded-lg text-xs" 
                                          placeholder="Qty"
                                      />
                                      <button onClick={handleAddCustomField} className="bg-neutral-800 text-white px-3 rounded-lg hover:bg-gold-600 hover:text-black font-bold"><Plus className="h-4 w-4"/></button>
                                  </div>

                                  <div className="flex justify-end gap-3">
                                      <button onClick={() => setExpandedForm(null)} className="px-6 py-2 rounded-lg border border-neutral-700 text-white hover:bg-neutral-800 text-sm font-bold">Cancel</button>
                                      <button 
                                          onClick={() => submitIssueMaterial(foundOrder, expandedForm.type)}
                                          className="px-8 py-2 rounded-lg bg-gold-600 hover:bg-gold-500 text-black font-bold text-sm shadow-lg flex items-center gap-2"
                                      >
                                          <CheckCircle2 className="h-4 w-4" /> Save & Confirm
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* --- STOCK INVENTORY TAB --- */}
      {activeTab === 'STOCK' && (
          <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-neutral-800">
                  <div className="relative w-full max-w-md">
                      <input 
                          type="text" 
                          placeholder="Search Inventory..." 
                          value={stockSearch}
                          onChange={(e) => setStockSearch(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-700 text-white pl-9 pr-4 py-2 rounded-lg text-sm focus:border-gold-500 focus:outline-none"
                      />
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                  </div>
                  <button onClick={() => setIsAddStockModalOpen(true)} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Add Stock
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {displayInventory.filter(i => i.name.toLowerCase().includes(stockSearch.toLowerCase())).map((item) => (
                      <div key={item.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex justify-between items-center group hover:border-gold-600/30 transition-colors">
                          <div>
                              <p className="text-white font-bold">{item.name}</p>
                              <p className="text-xs text-neutral-500">{item.type}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-gold-500 font-mono font-bold text-lg">{item.quantity} <span className="text-xs text-neutral-500">{item.unit}</span></p>
                              {item.costPerUnit && <p className="text-[10px] text-neutral-400 font-mono">₹{item.costPerUnit} / unit</p>}
                              {item.status === 'Low Stock' && <span className="text-[10px] text-red-500 flex items-center gap-1 justify-end"><AlertCircle className="h-3 w-3"/> Low</span>}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- ADD STOCK MODAL --- */}
      {isAddStockModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
                  <h3 className="text-white font-bold mb-4">Add New Inventory</h3>
                  <div className="space-y-4">
                      <input 
                          value={newStockItem.name} 
                          onChange={e => setNewStockItem({...newStockItem, name: e.target.value})} 
                          className="w-full bg-black border border-neutral-700 text-white p-3 rounded-lg" 
                          placeholder="Item Name (e.g. White Thread)" 
                      />
                      <div className="grid grid-cols-2 gap-4">
                          <select 
                              value={newStockItem.type} 
                              onChange={e => setNewStockItem({...newStockItem, type: e.target.value})} 
                              className="bg-black border border-neutral-700 text-white p-3 rounded-lg"
                          >
                              {INVENTORY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <input 
                              value={newStockItem.qty} 
                              onChange={e => setNewStockItem({...newStockItem, qty: e.target.value})} 
                              type="number" 
                              className="bg-black border border-neutral-700 text-white p-3 rounded-lg" 
                              placeholder="Quantity" 
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <input 
                              value={newStockItem.unit} 
                              onChange={e => setNewStockItem({...newStockItem, unit: e.target.value})} 
                              className="bg-black border border-neutral-700 text-white p-3 rounded-lg" 
                              placeholder="Unit (Pcs/Roll)" 
                          />
                          <input 
                              value={newStockItem.price} 
                              onChange={e => setNewStockItem({...newStockItem, price: e.target.value})} 
                              type="number" 
                              className="bg-black border border-neutral-700 text-white p-3 rounded-lg" 
                              placeholder="Cost per Unit (₹)" 
                          />
                      </div>
                      <div className="flex gap-3 pt-4">
                          <button onClick={() => setIsAddStockModalOpen(false)} className="flex-1 bg-neutral-800 text-white py-3 rounded-lg font-bold">Cancel</button>
                          <button onClick={submitAddStock} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold">Save Stock</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- LOGS TAB --- */}
      {activeTab === 'LOGS' && (
          <div className="glass-panel border border-neutral-800 rounded-xl overflow-hidden animate-fade-in">
             <div className="p-4 bg-neutral-900 border-b border-neutral-800">
                 <h4 className="text-white font-bold flex items-center gap-2"><History className="h-4 w-4 text-gold-500"/> Material Usage History</h4>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-neutral-400">
                    <thead className="bg-black text-neutral-500 uppercase text-xs">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">User ID</th>
                            <th className="p-4">Details</th>
                            <th className="p-4 text-right">Bill No</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {materialLogs.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center">No logs found.</td></tr>
                        ) : (
                            materialLogs.map(log => (
                                <tr key={log.id} className="hover:bg-neutral-800/30 transition-colors">
                                    <td className="p-4 whitespace-nowrap">
                                        <div className="text-white font-bold text-xs">{log.date}</div>
                                        <div className="text-[10px]">{log.time}</div>
                                    </td>
                                    <td className="p-4 text-xs font-mono text-gold-600">
                                        {log.userId}
                                    </td>
                                    <td className="p-4 text-neutral-300">
                                        {log.description}
                                    </td>
                                    <td className="p-4 text-right font-mono text-gold-500 text-xs">
                                        {log.relatedBillNumber || '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
             </div>
          </div>
      )}

    </div>
  );
};
