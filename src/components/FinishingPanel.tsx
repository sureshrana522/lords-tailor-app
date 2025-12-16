
import React, { useState, useEffect } from 'react';
import { useData } from '../DataContext';
import { Order, OrderStatus } from '../types';
import { PackageCheck, Truck, CheckCircle2, IndianRupee, Clock, Shirt, User, Crown, Calendar } from 'lucide-react';
import { WalletSection } from './WalletSection';

export const FinishingPanel: React.FC = () => {
  const { orders, updateOrderStatus, addTransaction, processWorkerPayout, currentUser, payoutRates } = useData();
  const [tasks, setTasks] = useState<Order[]>([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [earnedSession, setEarnedSession] = useState(0);

  useEffect(() => {
    // 1. Filter orders in FINISHING status
    let pending = orders.filter(o => o.status === OrderStatus.FINISHING);
    
    // 2. Sort by Delivery Date (Earliest date first)
    pending.sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());
    
    setTasks(pending);
  }, [orders]);

  const getRate = (itemType: string) => {
    if (itemType === 'Shirt' || itemType === 'Kurta') return payoutRates.FINISHING_SHIRT;
    return payoutRates.FINISHING;
  };

  const handleComplete = (order: Order) => {
    // Move to READY state
    updateOrderStatus(order.billNumber, OrderStatus.READY, 'Finishing (Ironing/Packing) Completed');
    setCompletedToday(prev => prev + 1);

    if (currentUser) {
        const rate = getRate(order.itemType);
        processWorkerPayout(
            currentUser.id,
            rate,
            `Finishing for ${order.itemType} (${order.billNumber})`,
            order.billNumber
        );
        
        setEarnedSession(prev => prev + (rate * 0.98));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
           <h2 className="text-2xl font-serif text-white">Finishing Department</h2>
           <p className="text-neutral-400 text-sm">Sorted by Priority (Delivery Date)</p>
        </div>
        
        <div className="bg-gradient-to-r from-neutral-900 to-black border border-green-900/30 p-4 rounded-xl flex items-center gap-6">
            <div>
                <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Today's Output</p>
                <div className="flex items-center text-green-400 font-mono text-2xl font-bold">
                    {completedToday} <span className="text-xs ml-1 text-neutral-500">Pcs</span>
                </div>
            </div>
            <div className="h-8 w-px bg-neutral-800"></div>
            <div>
                 <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Session Earned</p>
                 <div className="flex items-center text-gold-500 font-mono text-xl">
                    ₹ {earnedSession.toFixed(2)}
                </div>
            </div>
        </div>
      </div>

      <WalletSection />

      <h3 className="text-lg font-serif text-white mt-8 mb-4 flex items-center gap-2">
         <PackageCheck className="h-5 w-5 text-gold-500" /> Pending for Finishing
      </h3>

      <div className="grid gap-4">
        {tasks.length === 0 ? (
           <div className="text-center py-16 bg-neutral-900/30 rounded-xl border border-neutral-800 border-dashed">
             <Shirt className="h-12 w-12 text-neutral-700 mx-auto mb-4 opacity-50" />
             <p className="text-neutral-500">No clothes pending for ironing/packing.</p>
           </div>
        ) : (
           tasks.map(order => {
             const rate = getRate(order.itemType);
             return (
             <div key={order.billNumber} className="glass-panel p-6 border border-neutral-800 rounded-lg flex flex-col md:flex-row justify-between items-start gap-6 hover:border-gold-800 transition-colors group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <PackageCheck className="h-24 w-24 text-gold-500" />
                </div>

                <div className="flex-1 relative z-10 w-full">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl font-bold text-white tracking-wide">{order.billNumber}</span>
                        <span className="bg-neutral-800 text-neutral-300 text-xs px-2 py-1 rounded border border-neutral-700 uppercase font-bold">{order.itemType}</span>
                        {order.vipCategory && (
                            <span className="bg-gold-900/30 text-gold-500 text-xs px-2 py-1 rounded border border-gold-900 flex items-center gap-1">
                                <Crown className="h-3 w-3" /> VIP
                            </span>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mb-3">
                         <p className="text-neutral-400 text-sm flex items-center gap-1">
                            <User className="h-3 w-3" /> {order.customerName}
                         </p>
                         <p className="text-sm font-bold flex items-center gap-1 bg-red-900/20 text-red-500 px-2 py-0.5 rounded border border-red-900/30">
                             <Calendar className="h-3 w-3" /> Due: {order.deliveryDate}
                         </p>
                    </div>

                    <div className="text-xs text-neutral-500">
                         From: <span className="text-white">{order.history?.[order.history.length-1]?.updatedBy || 'Previous Step'}</span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3 w-full md:w-auto relative z-10 self-center md:self-start mt-2 md:mt-0">
                    <div className="text-right">
                        <p className="text-[10px] text-neutral-500 uppercase">Piece Rate</p>
                        <p className="text-gold-500 font-bold font-mono text-lg">₹ {rate}</p>
                    </div>
                    <button 
                        onClick={() => handleComplete(order)}
                        className="w-full md:w-auto bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(22,163,74,0.3)] whitespace-nowrap"
                    >
                        <Truck className="h-5 w-5" /> Ready for Delivery
                    </button>
                </div>
             </div>
             );
           })
        )}
      </div>
    </div>
  );
};
