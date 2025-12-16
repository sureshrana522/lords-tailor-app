
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../DataContext';
import { Order, OrderStatus, Measurements, Customer, WorkerRole } from '../types';
import { Ruler, Save, ArrowRight, CheckCircle2, User, Clock, Scissors, UserPlus, FileText, CheckSquare, ShieldCheck, Search, Crown, IndianRupee, Calendar, ShoppingBag, Link as LinkIcon, Activity, Package, Shirt, Truck, Eye, X, AlertCircle, Camera, Image as ImageIcon, Check, ArrowLeft, Plus, Trash2, Edit2, Phone, ClipboardList, Send, History, Lock, Printer, Share2, MapPin, Loader2, Mic, StopCircle, PlayCircle } from 'lucide-react';
import { VIP_CATEGORIES } from '../constants';
import { WalletSection } from './WalletSection';

// Define measurement fields configuration OUTSIDE the component to prevent re-creation
const UPPER_FIELDS = [
  { id: 'length', label: 'Length (Lambai)' },
  { id: 'shoulder', label: 'Shoulder (Tira)' },
  { id: 'sleeve', label: 'Sleeve (Baaju)' },
  { id: 'chest', label: 'Chest (Chaati)' },
  { id: 'waist', label: 'Stomach (Pet)' },
  { id: 'neck', label: 'Neck (Gala)' },
  { id: 'collar', label: 'Collar' },
  { id: 'forearm', label: 'Forearm' }
];

const LOWER_FIELDS = [
  { id: 'pLength', label: 'Pant Length' },
  { id: 'pWaist', label: 'Waist (Kamar)' },
  { id: 'hips', label: 'Hips (Seat)' },
  { id: 'thigh', label: 'Thigh (Jangh)' },
  { id: 'rise', label: 'Rise (Latak)' },
  { id: 'bottom', label: 'Bottom (Mohri)' },
  { id: 'knee', label: 'Knee (Ghuta)' },
  { id: 'pCuff', label: 'Cuff' }
];

export const MeasurementPanel: React.FC = () => {
  const { 
    orders, customers, currentUser, allUsers,
    updateOrderStatus, updateOrderVipCategory, updateCustomerMeasurements, updateCustomerPhoto, updateOrderNotes,
    addCustomer, addOrder, generateBillNumber, generateCustomerId, getCustomerByMobile,
    processWorkerPayout, payoutRates
  } = useData();
  
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [view, setView] = useState<'LIST' | 'BILL_VIEW'>('LIST');

  // Form Data State
  const [formData, setFormData] = useState<Measurements>({});
  const [measurementNotes, setMeasurementNotes] = useState(''); 
  const [activeCategoryTab, setActiveCategoryTab] = useState<'UPPER' | 'LOWER'>('UPPER'); 
  
  const [currentPhoto, setCurrentPhoto] = useState<string>('');
  const [selectedVipCategory, setSelectedVipCategory] = useState('');
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [selectedCuttingMaster, setSelectedCuttingMaster] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const cuttingMasters = allUsers.filter(u => u.role === WorkerRole.CUTTING);

  useEffect(() => {
    const pending = orders.filter(o => o.status === OrderStatus.MEASUREMENT);
    pending.sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());
    setPendingOrders(pending);
  }, [orders]);

  const handleSelectOrder = (order: Order) => {
    setIsSuccess(false);
    setSaveMessage('');
    setSelectedCuttingMaster('');
    
    setSelectedOrder(order);
    setView('LIST'); 
    
    setSelectedVipCategory(order.vipCategory || '');
    setMeasurementNotes(order.notes || ''); 
    
    const isLower = ['Pant', 'Pyjama', 'Trousers'].includes(order.itemType);
    setActiveCategoryTab(isLower ? 'LOWER' : 'UPPER');

    const customer = customers.find(c => c.id === order.customerId);
    if (customer) {
        setFormData(customer.measurements || {});
        setCurrentPhoto(customer.measurementImage || '');
    } else {
        setFormData({});
        setCurrentPhoto('');
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMeasurementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
          ...prev,
          [name]: value
      }));
  };

  const getMeasurementRate = (order: Order) => {
     const isNew = order.isNewCustomer;
     const type = order.itemType;

     if (type === 'Shirt' || type === 'Kurta') {
         return isNew ? payoutRates.MEASUREMENT_SHIRT_NEW : payoutRates.MEASUREMENT_SHIRT_OLD;
     }
     if (type === 'Pant' || type === 'Pyjama') {
         return isNew ? payoutRates.MEASUREMENT_PANT_NEW : payoutRates.MEASUREMENT_PANT_OLD;
     }
     if (type === 'Coat' || type === 'Suit') return payoutRates.MEASUREMENT_COAT;
     if (type === 'Safari') return payoutRates.MEASUREMENT_SAFARI;
     
     return 25; // Default fallback
  };

  const initiateHandover = () => {
    if (!selectedOrder) return;
    // Save draft first
    updateCustomerMeasurements(selectedOrder.customerId, formData);
    updateOrderVipCategory(selectedOrder.billNumber, selectedVipCategory);
    updateOrderNotes(selectedOrder.billNumber, measurementNotes);
    if (currentPhoto) {
        updateCustomerPhoto(selectedOrder.customerId, currentPhoto);
    }
    setIsHandoverModalOpen(true);
  };

  const confirmHandover = () => {
    if (!selectedOrder) return;
    
    // Auto-assign to first cutting master if none selected (Optional fallback)
    let finalCuttingMaster = selectedCuttingMaster;
    let finalMasterName = cuttingMasters.find(c => c.id === selectedCuttingMaster)?.name;

    if (!finalCuttingMaster && cuttingMasters.length > 0) {
        finalCuttingMaster = cuttingMasters[0].id;
        finalMasterName = cuttingMasters[0].name;
    }

    const finalNote = measurementNotes ? `Notes: ${measurementNotes}. Handover to ${finalMasterName}` : `Handover to ${finalMasterName}`;

    updateOrderStatus(
      selectedOrder.billNumber, 
      OrderStatus.CUTTING, 
      finalNote,
      finalCuttingMaster,
      finalMasterName
    );

    if (currentUser) {
        const rate = getMeasurementRate(selectedOrder);
        processWorkerPayout(
            currentUser.id,
            rate,
            `Measurement for ${selectedOrder.itemType} (${selectedOrder.billNumber})`,
            selectedOrder.billNumber
        );
    }

    setIsHandoverModalOpen(false);
    setIsSuccess(true);
    setSaveMessage(`Sent to Cutting (${finalMasterName})`);
    
    setTimeout(() => {
        setSelectedOrder(null);
        setIsSuccess(false);
    }, 2000);
  };

  // Helper for rendering inputs to ensure stability
  const renderFields = (fields: typeof UPPER_FIELDS) => {
      return (
          <div className="grid grid-cols-2 gap-4">
              {fields.map(field => (
                  <div key={field.id} className="relative">
                      <label className="text-[10px] text-neutral-500 uppercase font-bold absolute -top-2 left-2 bg-neutral-900 px-1">
                          {field.label}
                      </label>
                      <input
                          type="text" // Use text to allow fractions/text notes
                          name={field.id}
                          value={(formData as any)[field.id] || ''}
                          onChange={handleMeasurementChange}
                          className="w-full bg-neutral-900 border border-neutral-700 text-white p-4 rounded-xl focus:border-gold-500 focus:outline-none text-lg font-bold"
                          placeholder="0.0"
                          inputMode="decimal" // Better keyboard for numbers
                      />
                  </div>
              ))}
          </div>
      );
  };

  return (
    <div className="space-y-6 animate-fade-in perspective-[1000px]">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
           <div className="flex items-center gap-3">
               <h2 className="text-3xl font-serif text-white tracking-wide">Measurement <span className="text-gold-500">Lab</span></h2>
               <span className="bg-neutral-800 text-neutral-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-neutral-700">
                   {currentUser?.name}
               </span>
           </div>
           <p className="text-neutral-400 text-sm mt-1">Capture Data & Assign to Cutting</p>
        </div>
      </div>

      <WalletSection />

      {/* SUCCESS OVERLAY */}
      {isSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-green-600 text-white p-8 rounded-full shadow-[0_0_50px_rgba(22,163,74,0.6)] flex flex-col items-center animate-float">
                  <CheckCircle2 className="h-16 w-16 mb-2" />
                  <h3 className="text-2xl font-bold">{saveMessage}</h3>
              </div>
          </div>
      )}

      {/* MAIN CONTENT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: PENDING LIST */}
          <div className={`${selectedOrder ? 'hidden lg:block lg:col-span-4' : 'col-span-12'}`}>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden h-[80vh] flex flex-col">
                  <div className="p-4 border-b border-neutral-800 bg-black/40">
                      <h4 className="text-white font-bold flex items-center gap-2">
                          <ClipboardList className="h-5 w-5 text-gold-500" /> Pending ({pendingOrders.length})
                      </h4>
                  </div>
                  <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-2">
                      {pendingOrders.length === 0 ? (
                          <div className="text-center py-20 text-neutral-500">No orders pending.</div>
                      ) : (
                          pendingOrders.map(order => (
                              <div 
                                key={order.billNumber}
                                onClick={() => handleSelectOrder(order)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedOrder?.billNumber === order.billNumber ? 'bg-gold-900/20 border-gold-500 shadow-lg' : 'bg-neutral-900/50 border-neutral-800 hover:border-gold-500/50'}`}
                              >
                                  <div className="flex justify-between items-start mb-1">
                                      <h5 className="text-white font-bold">{order.customerName}</h5>
                                      <span className="text-[10px] bg-neutral-800 text-gold-500 px-2 py-0.5 rounded border border-neutral-700">{order.billNumber}</span>
                                  </div>
                                  <p className="text-neutral-400 text-xs mb-2">{order.itemType} • Due: {order.deliveryDate}</p>
                                  {order.isNewCustomer && <span className="text-[10px] text-green-500 bg-green-900/20 px-2 py-0.5 rounded font-bold">New Client</span>}
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>

          {/* RIGHT: MEASUREMENT FORM */}
          {selectedOrder && (
              <div className="col-span-12 lg:col-span-8 animate-fade-in">
                  <div className="glass-panel border border-neutral-800 rounded-xl p-6 relative">
                      
                      {/* Back Button (Mobile) */}
                      <button onClick={() => setSelectedOrder(null)} className="lg:hidden absolute top-4 right-4 text-neutral-500 hover:text-white">
                          <X className="h-6 w-6" />
                      </button>

                      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-neutral-800">
                          <div className="bg-gold-600 p-3 rounded-xl text-black">
                              <User className="h-8 w-8" />
                          </div>
                          <div>
                              <h2 className="text-2xl font-serif text-white">{selectedOrder.customerName}</h2>
                              <p className="text-gold-500 font-mono text-sm">{selectedOrder.billNumber} • <span className="text-neutral-400">{selectedOrder.itemType}</span></p>
                          </div>
                      </div>

                      {/* TABS */}
                      <div className="flex bg-neutral-900 rounded-lg p-1 mb-6">
                          <button 
                            onClick={() => setActiveCategoryTab('UPPER')}
                            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${activeCategoryTab === 'UPPER' ? 'bg-gold-600 text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                          >
                              Upper Body
                          </button>
                          <button 
                            onClick={() => setActiveCategoryTab('LOWER')}
                            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${activeCategoryTab === 'LOWER' ? 'bg-gold-600 text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                          >
                              Lower Body
                          </button>
                      </div>

                      {/* INPUT FIELDS */}
                      <div className="mb-8">
                          {activeCategoryTab === 'UPPER' ? renderFields(UPPER_FIELDS) : renderFields(LOWER_FIELDS)}
                      </div>

                      {/* NOTES & VIP */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          <div>
                              <label className="text-xs text-neutral-500 uppercase font-bold block mb-2">Master Notes</label>
                              <textarea 
                                  value={measurementNotes}
                                  onChange={(e) => setMeasurementNotes(e.target.value)}
                                  className="w-full bg-neutral-900 border border-neutral-700 text-white p-3 rounded-xl focus:border-gold-500 focus:outline-none h-32 resize-none"
                                  placeholder="Special instructions for cutting..."
                              />
                          </div>
                          <div className="space-y-4">
                              <div>
                                  <label className="text-xs text-neutral-500 uppercase font-bold block mb-2">VIP Category</label>
                                  <select 
                                      value={selectedVipCategory}
                                      onChange={(e) => setSelectedVipCategory(e.target.value)}
                                      className="w-full bg-neutral-900 border border-neutral-700 text-white p-3 rounded-xl focus:border-gold-500 focus:outline-none"
                                  >
                                      <option value="">Standard Fit</option>
                                      {VIP_CATEGORIES.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
                                  </select>
                              </div>
                              <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
                                  <span className="text-neutral-400 text-sm font-bold">Priority Status</span>
                                  <span className="text-gold-500 font-bold text-sm uppercase">{selectedOrder.priority || 'Normal'}</span>
                              </div>
                          </div>
                      </div>

                      {/* ACTIONS */}
                      <button 
                          onClick={initiateHandover}
                          className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                      >
                          <Scissors className="h-5 w-5" /> Save & Send to Cutting
                      </button>

                  </div>
              </div>
          )}
      </div>

      {/* HANDOVER MODAL */}
      {isHandoverModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
              <div className="bg-neutral-900 border border-gold-600 rounded-2xl w-full max-w-md shadow-2xl p-6">
                  <h3 className="text-xl font-serif text-white mb-4">Select Cutting Master</h3>
                  <p className="text-neutral-400 text-sm mb-6">Who should cut this fabric?</p>
                  
                  <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                      {cuttingMasters.length === 0 ? (
                          <p className="text-red-500 text-sm">No Cutting Masters available.</p>
                      ) : (
                          cuttingMasters.map(master => (
                              <button
                                  key={master.id}
                                  onClick={() => setSelectedCuttingMaster(master.id)}
                                  className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${selectedCuttingMaster === master.id ? 'bg-gold-900/30 border-gold-500 text-white' : 'bg-black border-neutral-800 text-neutral-400 hover:border-gold-500/50'}`}
                              >
                                  <span className="font-bold">{master.name}</span>
                                  {selectedCuttingMaster === master.id && <CheckCircle2 className="h-5 w-5 text-gold-500" />}
                              </button>
                          ))
                      )}
                  </div>

                  <div className="flex gap-3">
                      <button onClick={() => setIsHandoverModalOpen(false)} className="flex-1 bg-neutral-800 text-white py-3 rounded-lg font-bold">Cancel</button>
                      <button 
                          onClick={confirmHandover}
                          disabled={!selectedCuttingMaster && cuttingMasters.length > 0}
                          className="flex-1 bg-gold-600 text-black py-3 rounded-lg font-bold disabled:opacity-50"
                      >
                          Confirm
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
