
import React, { useState } from 'react';
import { Search, CheckCircle, Clock, Package, Scissors, Shirt, Ruler, Truck, Calendar, Instagram, Gift, XCircle } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { useData } from '../DataContext';

export const CustomerPortal: React.FC = () => {
  const { orders } = useData(); // Connect to real data
  const [billNumber, setBillNumber] = useState('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billNumber.trim()) {
        setError('Please enter a Bill Number.');
        return;
    }

    // Case-insensitive search for better UX
    const order = orders.find(o => o.billNumber.toLowerCase() === billNumber.trim().toLowerCase());
    
    if (order) {
      setActiveOrder(order);
      setError('');
    } else {
      setActiveOrder(null);
      setError('Order not found. Please check your Bill Number and try again.');
    }
  };

  const steps = [
    { status: OrderStatus.MEASUREMENT, icon: Ruler, label: "Measurement" },
    { status: OrderStatus.CUTTING, icon: Scissors, label: "Cutting" },
    { status: OrderStatus.STITCHING, icon: Shirt, label: "Stitching" },
    { status: OrderStatus.FINISHING, icon: Package, label: "Finishing" },
    { status: OrderStatus.DELIVERED, icon: Truck, label: "Delivered" },
  ];

  const getStepStatus = (stepStatus: string, currentStatus: string) => {
    const statusOrder = [
      OrderStatus.PENDING,
      OrderStatus.MEASUREMENT,
      OrderStatus.CUTTING,
      OrderStatus.STITCHING,
      OrderStatus.KAJ_BUTTON,
      OrderStatus.FINISHING,
      OrderStatus.READY,
      OrderStatus.DELIVERED
    ];
    
    const currentIndex = statusOrder.indexOf(currentStatus as OrderStatus);
    const stepIndex = statusOrder.indexOf(stepStatus as OrderStatus);

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-5xl font-serif text-white">Track Your <span className="text-gold-500">Masterpiece</span></h2>
        <p className="text-neutral-400 max-w-2xl mx-auto">
          Enter your Bill Number to see the real-time status of your bespoke garment creation.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <form onSubmit={handleTrack} className="relative">
          <input
            type="text"
            placeholder="Enter Bill Number (e.g., ORD-2025-001)"
            value={billNumber}
            onChange={(e) => setBillNumber(e.target.value)}
            className="w-full bg-luxury-card border border-gold-800 text-white placeholder-neutral-600 px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-gold-600 transition-all text-center uppercase tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.1)]"
            autoCapitalize="characters"
          />
          <button 
            type="submit"
            className="absolute right-2 top-2 bg-gold-600 hover:bg-gold-500 text-black p-2 rounded-full transition-colors shadow-lg"
          >
            <Search className="h-6 w-6" />
          </button>
        </form>
        {error && (
            <div className="flex items-center justify-center gap-2 mt-4 text-red-500 bg-red-900/10 p-2 rounded-lg border border-red-900/30 animate-pulse">
                <XCircle className="h-4 w-4" />
                <p className="text-sm">{error}</p>
            </div>
        )}
      </div>

      {activeOrder && (
        <div className="glass-panel border border-gold-800 rounded-2xl p-8 animate-fade-in card-3d">
          <div className="flex flex-col md:flex-row justify-between mb-12 border-b border-neutral-800 pb-6 items-end gap-6">
            <div>
              <div className="flex items-center gap-3">
                 <h3 className="text-2xl font-serif text-gold-500 mb-1">{activeOrder.vipCategory || "Bespoke Order"}</h3>
                 {activeOrder.isNewCustomer && <span className="text-[10px] bg-gold-500 text-black px-2 py-0.5 rounded uppercase font-bold tracking-wider">New Client</span>}
              </div>
              <p className="text-neutral-400 font-mono tracking-wide">Order #{activeOrder.billNumber}</p>
            </div>
            
            {/* Prominent Delivery Date Display */}
            <div className="w-full md:w-auto bg-gradient-to-br from-neutral-900 to-black border border-gold-700 p-5 rounded-xl text-center min-w-[200px] shadow-[0_0_25px_rgba(202,138,4,0.15)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Calendar className="h-12 w-12 text-gold-500" />
              </div>
              <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2 z-10 relative">Expected Delivery</p>
              <div className="flex items-center justify-center gap-2 z-10 relative">
                 <p className="text-3xl text-white font-serif font-bold tracking-wide">{activeOrder.deliveryDate}</p>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-green-900/20 px-2 py-0.5 rounded border border-green-900/30">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-[10px] text-green-500 uppercase font-bold tracking-wider">On Schedule</span>
              </div>
            </div>
          </div>

          <div className="relative mb-12">
            {/* Connecting Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-neutral-800 md:hidden"></div>
            <div className="hidden md:block absolute top-6 left-0 right-0 h-0.5 bg-neutral-800"></div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {steps.map((step, idx) => {
                const status = getStepStatus(step.status, activeOrder.status);
                const Icon = step.icon;
                
                let circleClass = "bg-neutral-900 border-neutral-800 text-neutral-600";
                let textClass = "text-neutral-600";
                
                if (status === 'completed') {
                  // Green for completed
                  circleClass = "bg-green-600 border-green-600 text-white shadow-[0_0_15px_rgba(22,163,74,0.5)] scale-105";
                  textClass = "text-green-500 font-bold";
                } else if (status === 'active') {
                  // Gold/Pulse for active
                  circleClass = "bg-black border-gold-500 text-gold-500 shadow-[0_0_20px_rgba(234,179,8,0.4)] ring-2 ring-gold-500/20 scale-110";
                  textClass = "text-gold-400 font-bold animate-pulse";
                } else {
                  // Pending
                  circleClass = "bg-neutral-900 border-neutral-800 text-neutral-600 opacity-80";
                  textClass = "text-neutral-600";
                }

                return (
                  <div key={idx} className="relative z-10 flex md:flex-col items-center gap-6 md:gap-4 pl-0 md:pl-0">
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${circleClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="md:text-center">
                      <p className={`text-sm uppercase tracking-wider transition-colors duration-300 ${textClass}`}>{step.label}</p>
                      {status === 'active' && <span className="text-[10px] text-gold-500 animate-pulse font-bold tracking-widest block mt-1">IN PROGRESS</span>}
                      {status === 'completed' && <span className="text-[10px] text-green-600 font-bold tracking-widest block mt-1 flex items-center gap-1 md:justify-center"><CheckCircle className="h-3 w-3"/> DONE</span>}
                      {status === 'pending' && <span className="text-[10px] text-neutral-600 font-mono tracking-widest block mt-1">PENDING</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-black/50 p-6 rounded-lg border border-neutral-800 hover:border-gold-900/50 transition-colors">
               <h4 className="text-gold-500 text-sm uppercase tracking-widest mb-4 border-b border-neutral-800 pb-2">Customer Information</h4>
               <div className="space-y-4">
                 <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Customer Name</p>
                        <p className="text-white font-serif text-xl tracking-wide">{activeOrder.customerName}</p>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 pt-2">
                    {activeOrder.customerIG && (
                        <div className="flex items-center gap-3">
                             <div className="p-2 bg-neutral-800 rounded-full"><Instagram className="h-4 w-4 text-gold-600" /></div>
                             <div>
                                <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Instagram</p>
                                <p className="text-neutral-300 text-sm">{activeOrder.customerIG}</p>
                             </div>
                        </div>
                    )}
                    {activeOrder.customerDOB && (
                        <div className="flex items-center gap-3">
                             <div className="p-2 bg-neutral-800 rounded-full"><Gift className="h-4 w-4 text-gold-600" /></div>
                             <div>
                                <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Birthday</p>
                                <p className="text-neutral-300 text-sm">{activeOrder.customerDOB}</p>
                             </div>
                        </div>
                    )}
                 </div>

                 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-800/50">
                    <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Order Date</p>
                        <p className="text-neutral-300 font-mono text-sm">{activeOrder.orderDate}</p>
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Trial Date</p>
                        <p className="text-gold-500 font-mono text-sm">{activeOrder.trialDate}</p>
                    </div>
                 </div>
               </div>
            </div>

            <div className="bg-black/50 p-6 rounded-lg border border-neutral-800 hover:border-gold-900/50 transition-colors">
               <h4 className="text-gold-500 text-sm uppercase tracking-widest mb-4 border-b border-neutral-800 pb-2">Garment Details</h4>
               <ul className="space-y-3 mb-6">
                  {activeOrder.items.map((item, i) => (
                      <li key={i} className="flex items-center text-neutral-300 justify-between">
                          <div className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-gold-600 rounded-full mr-3"></span>
                            <span className="font-medium">{item}</span>
                          </div>
                          {i === 0 && <span className="text-[10px] text-neutral-500 uppercase border border-neutral-800 px-2 py-0.5 rounded tracking-wider">{activeOrder.itemType}</span>}
                      </li>
                  ))}
               </ul>
               <div className="pt-4 border-t border-neutral-800 flex justify-between items-center">
                  <div>
                      <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Fabric Consumption</p>
                      <p className="text-white font-mono">{activeOrder.fabricAmount} Meters</p>
                  </div>
                  <div className="bg-neutral-800 p-2 rounded-full">
                     <Scissors className="h-6 w-6 text-neutral-500" />
                  </div>
               </div>
            </div>
          </div>

          {/* Activity Log */}
          {activeOrder.history && activeOrder.history.length > 0 && (
             <div className="bg-neutral-900/30 p-6 rounded-xl border border-neutral-800">
                <h4 className="text-gold-500 text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Production Activity Log
                </h4>
                <div className="space-y-0 relative">
                  <div className="absolute left-[5.5px] top-2 bottom-4 w-0.5 bg-neutral-800"></div>
                  {[...activeOrder.history].reverse().map((entry, index) => (
                    <div key={index} className="flex gap-6 group relative mb-6 last:mb-0">
                      <div className="flex flex-col items-center mt-1.5">
                        <div className={`w-3 h-3 rounded-full border-2 z-10 transition-all ${index === 0 ? 'bg-gold-600 border-gold-600 shadow-[0_0_10px_rgba(234,179,8,0.5)] scale-110' : 'bg-black border-neutral-700'}`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                             <p className={`font-serif text-lg leading-none ${index === 0 ? 'text-white' : 'text-neutral-500'}`}>{entry.status}</p>
                             <span className="text-[10px] text-neutral-600 font-mono bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">{entry.date} • {entry.time}</span>
                        </div>
                        {entry.description && (
                          <p className={`text-sm p-3 rounded-lg border ${index === 0 ? 'bg-neutral-800/80 text-neutral-300 border-neutral-700' : 'bg-transparent text-neutral-600 border-transparent'}`}>
                            {entry.description}
                          </p>
                        )}
                        {entry.updatedBy && (
                            <p className="text-[10px] text-neutral-600 mt-1 pl-1">Updated by: {entry.updatedBy}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};