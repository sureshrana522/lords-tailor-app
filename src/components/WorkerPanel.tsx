
import React, { useState, useEffect, useMemo } from 'react';
import { Order, OrderStatus, WorkerRole } from '../types';
import { Check, Clock, IndianRupee, Scissors, Search, Link as LinkIcon, BarChart3, ArrowRight, UserPlus, X, History, Printer, CheckCircle2, AlertCircle, FileText, Shirt, Truck, PackageCheck, User, Filter, Ruler, Crown, Calendar, Eye, ClipboardList, SortAsc, SortDesc, Flag, Zap, Briefcase, ListChecks, Wallet, Mic, PlayCircle, StopCircle, Volume2, Store, Lock, Activity } from 'lucide-react';
import { useData } from '../DataContext';
import { WalletSection } from './WalletSection';
import { ReferralDashboard } from './ReferralDashboard';

interface WorkerPanelProps {
  role: WorkerRole;
}

// Configuration for distinct Maker Panels
const MAKER_CONFIG: Record<string, { title: string, subtitle: string, icon: any, colorClass: string }> = {
    [WorkerRole.SHIRT_MAKER]: { 
        title: 'Shirt Atelier', 
        subtitle: 'Shirt & Kurta Production', 
        icon: Shirt,
        colorClass: 'text-blue-400' 
    },
    [WorkerRole.PANT_MAKER]: { 
        title: 'Trouser Department', 
        subtitle: 'Pant, Pyjama & Lower Garments', 
        icon: Scissors,
        colorClass: 'text-green-400'
    },
    [WorkerRole.COAT_MAKER]: { 
        title: 'Coat & Suit Executive', 
        subtitle: 'Blazers, Suits & Jodhpuris', 
        icon: Briefcase,
        colorClass: 'text-purple-400'
    },
    [WorkerRole.SAFARI_MAKER]: { 
        title: 'Safari Specialist', 
        subtitle: 'Safari Suit Production', 
        icon: User,
        colorClass: 'text-orange-400'
    },
    [WorkerRole.SHERWANI_MAKER]: { 
        title: 'Sherwani Royal Dept', 
        subtitle: 'Ceremonial Wear', 
        icon: Crown,
        colorClass: 'text-gold-500'
    },
    [WorkerRole.STITCHING]: { 
        title: 'Stitching Floor', 
        subtitle: 'General Stitching Tasks', 
        icon: Scissors,
        colorClass: 'text-white'
    },
    [WorkerRole.CUTTING]: {
        title: 'Master Cutting Panel',
        subtitle: 'Assign Material to Karigars',
        icon: Scissors,
        colorClass: 'text-red-400'
    },
    [WorkerRole.KAJ_BUTTON]: {
        title: 'Kaj Button & Finishing',
        subtitle: 'Detailing & Final Touches',
        icon: CheckCircle2,
        colorClass: 'text-pink-400'
    },
    [WorkerRole.DELIVERY]: {
        title: 'Delivery & Logistics',
        subtitle: 'Dispatch & Return',
        icon: Truck,
        colorClass: 'text-cyan-400'
    }
};

export const WorkerPanel: React.FC<WorkerPanelProps> = ({ role }) => {
  const { orders, customers, allUsers, updateOrderStatus, settleOrderPayment, processWorkerPayout, currentUser, updateOrderPriority, transactions, payoutRates, verifyCashHandover } = useData();

  const [activeTab, setActiveTab] = useState<'TASKS' | 'MY_HISTORY'>('TASKS');
  const [measurementTab, setMeasurementTab] = useState<'UPPER' | 'LOWER'>('UPPER');
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  
  // HANDOVER MODAL STATE (For Delivery)
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [handoverOrder, setHandoverOrder] = useState<Order | null>(null);
  const [handoverPin, setHandoverPin] = useState('');
  const [handoverLoading, setHandoverLoading] = useState(false);

  const getRelevantStatus = (role: WorkerRole): OrderStatus => {
    switch (role) {
        case WorkerRole.MEASUREMENT: return OrderStatus.MEASUREMENT;
        case WorkerRole.CUTTING: return OrderStatus.CUTTING;
        case WorkerRole.SHIRT_MAKER: 
        case WorkerRole.PANT_MAKER:
        case WorkerRole.COAT_MAKER:
        case WorkerRole.SAFARI_MAKER:
        case WorkerRole.SHERWANI_MAKER:
        case WorkerRole.STITCHING:
            return OrderStatus.STITCHING;
        case WorkerRole.KAJ_BUTTON: return OrderStatus.KAJ_BUTTON;
        case WorkerRole.FINISHING: return OrderStatus.FINISHING;
        case WorkerRole.DELIVERY: return OrderStatus.READY;
        default: return OrderStatus.PENDING;
    }
  };

  const isStitchingRole = (r: WorkerRole) => 
    [
        WorkerRole.STITCHING, 
        WorkerRole.SHIRT_MAKER, 
        WorkerRole.PANT_MAKER, 
        WorkerRole.COAT_MAKER, 
        WorkerRole.SAFARI_MAKER, 
        WorkerRole.SHERWANI_MAKER
    ].includes(r);

  const currentResponsibility = getRelevantStatus(role);
  
  const [tasks, setTasks] = useState<Order[]>([]);

  // --- MY HISTORY STATE ---
  const [historyTimeFilter, setHistoryTimeFilter] = useState<'TODAY' | 'YESTERDAY' | 'ALL' | 'CUSTOM'>('TODAY');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    let filtered = orders.filter(o => o.status === currentResponsibility);

    // 1. Role Based Filtering
    if (role === WorkerRole.SHIRT_MAKER) {
        filtered = filtered.filter(o => ['Shirt', 'Kurta'].includes(o.itemType));
    } else if (role === WorkerRole.PANT_MAKER) {
        filtered = filtered.filter(o => ['Pant', 'Pyjama', 'Trousers'].includes(o.itemType));
    } else if (role === WorkerRole.COAT_MAKER) {
        filtered = filtered.filter(o => ['Suit', 'Coat', 'Jodhpuri'].includes(o.itemType));
    } else if (role === WorkerRole.SAFARI_MAKER) {
        filtered = filtered.filter(o => o.itemType === 'Safari');
    } else if (role === WorkerRole.SHERWANI_MAKER) {
        filtered = filtered.filter(o => o.itemType === 'Sherwani');
    }
    else if (role === WorkerRole.KAJ_BUTTON) {
        filtered = filtered.filter(o => 
            ['Shirt', 'Kurta', 'Safari', 'Sherwani', 'Coat', 'Suit', 'Jodhpuri'].includes(o.itemType)
        );
    }

    if (isStitchingRole(role) && currentUser) {
        filtered = filtered.filter(o => o.assignedWorkerId === currentUser.id);
    }

    filtered.sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());
    setTasks(filtered);
  }, [orders, currentResponsibility, role, currentUser]);
  
  const [completedToday, setCompletedToday] = useState(0);
  const [billSearch, setBillSearch] = useState('');
  
  const [listSearch, setListSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'URGENT'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'High' | 'Medium' | 'Low'>('ALL');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<Order | null>(null);
  const [selectedKarigarId, setSelectedKarigarId] = useState('');
  const [manualKarigarId, setManualKarigarId] = useState('');
  const [manualKarigarName, setManualKarigarName] = useState('');
  
  const [assignWorkerFilter, setAssignWorkerFilter] = useState<string>('AUTO');
  const [stitchedByName, setStitchedByName] = useState('');
  const [stitchedById, setStitchedById] = useState('');
  const [workerSearch, setWorkerSearch] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [updateMessage, setUpdateMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrderForView, setSelectedOrderForView] = useState<Order | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const earnedToday = useMemo(() => {
      if (!currentUser) return 0;
      const today = new Date().toISOString().split('T')[0];
      return transactions
          .filter(t => t.userId === currentUser.id && t.type === 'CREDIT' && t.date === today)
          .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentUser]);

  const totalTasksForDay = tasks.length + completedToday;
  const progressPercentage = totalTasksForDay === 0 ? 0 : Math.round((completedToday / totalTasksForDay) * 100);

  const availableReceivers = useMemo(() => {
      if (role === WorkerRole.CUTTING) {
          return allUsers.filter(u => isStitchingRole(u.role));
      } else if (isStitchingRole(role)) {
          return allUsers.filter(u => [WorkerRole.KAJ_BUTTON, WorkerRole.FINISHING].includes(u.role));
      }
      return [];
  }, [allUsers, role]);

  const getFilteredReceivers = () => {
      if (!selectedOrderForAssign) return availableReceivers;
      
      if (assignWorkerFilter !== 'AUTO') {
          if (assignWorkerFilter === 'PANT_DEPT') return availableReceivers.filter(u => u.role === WorkerRole.PANT_MAKER);
          if (assignWorkerFilter === 'SHIRT_DEPT') return availableReceivers.filter(u => u.role === WorkerRole.SHIRT_MAKER);
          if (assignWorkerFilter === 'COAT_DEPT') return availableReceivers.filter(u => u.role === WorkerRole.COAT_MAKER);
          if (assignWorkerFilter === 'SAFARI_DEPT') return availableReceivers.filter(u => u.role === WorkerRole.SAFARI_MAKER);
          if (assignWorkerFilter === 'SHERWANI_DEPT') return availableReceivers.filter(u => u.role === WorkerRole.SHERWANI_MAKER);
          if (assignWorkerFilter === 'GENERAL') return availableReceivers.filter(u => u.role === WorkerRole.STITCHING);
      }

      const type = selectedOrderForAssign.itemType;
      
      if (role === WorkerRole.CUTTING) {
          if (['Shirt', 'Kurta'].includes(type)) return availableReceivers.filter(u => u.role === WorkerRole.SHIRT_MAKER || u.role === WorkerRole.STITCHING);
          if (['Pant', 'Pyjama', 'Trousers'].includes(type)) return availableReceivers.filter(u => u.role === WorkerRole.PANT_MAKER || u.role === WorkerRole.STITCHING);
          if (['Coat', 'Suit', 'Jodhpuri'].includes(type)) return availableReceivers.filter(u => u.role === WorkerRole.COAT_MAKER || u.role === WorkerRole.STITCHING);
          if (type === 'Safari') return availableReceivers.filter(u => u.role === WorkerRole.SAFARI_MAKER || u.role === WorkerRole.STITCHING);
          if (type === 'Sherwani') return availableReceivers.filter(u => u.role === WorkerRole.SHERWANI_MAKER || u.role === WorkerRole.STITCHING);
          return availableReceivers.filter(u => isStitchingRole(u.role));
      }
      
      if (isStitchingRole(role)) {
          if (['Pant', 'Pyjama', 'Trousers'].includes(type)) {
              return availableReceivers.filter(u => u.role === WorkerRole.FINISHING);
          } else {
              return availableReceivers.filter(u => u.role === WorkerRole.KAJ_BUTTON);
          }
      }
      
      return availableReceivers;
  };

  const getRateForOrder = (order: Order, role: WorkerRole): number => {
    if (role === WorkerRole.MEASUREMENT) {
        // New Logic: Check if customer is New or Old
        if (order.isNewCustomer) {
            if (['Shirt', 'Kurta'].includes(order.itemType)) return payoutRates.MEASUREMENT_SHIRT_NEW;
            if (['Pant', 'Pyjama'].includes(order.itemType)) return payoutRates.MEASUREMENT_PANT_NEW;
        } else {
            if (['Shirt', 'Kurta'].includes(order.itemType)) return payoutRates.MEASUREMENT_SHIRT_OLD;
            if (['Pant', 'Pyjama'].includes(order.itemType)) return payoutRates.MEASUREMENT_PANT_OLD;
        }
        return 25; // Fallback
    } 
    if (role === WorkerRole.CUTTING) {
        if (order.itemType === 'Pant') return payoutRates.CUTTING_PANT;
        if (order.itemType === 'Shirt') return payoutRates.CUTTING_SHIRT;
        if (order.itemType === 'Suit') return payoutRates.CUTTING_SUIT;
        if (order.itemType === 'Safari') return payoutRates.CUTTING_SAFARI;
        if (order.itemType === 'Pyjama') return payoutRates.CUTTING_PYJAMA;
        if (order.itemType === 'Coat') return payoutRates.CUTTING_COAT;
        return 50;
    }
    if (isStitchingRole(role)) {
        if (order.itemType === 'Pant') return payoutRates.STITCHING_PANT;
        if (order.itemType === 'Shirt') return payoutRates.STITCHING_SHIRT;
        if (order.itemType === 'Suit') return payoutRates.STITCHING_SUIT;
        if (order.itemType === 'Coat') return payoutRates.STITCHING_COAT;
        if (order.itemType === 'Sherwani') return payoutRates.STITCHING_SHERWANI;
        if (order.itemType === 'Safari') return payoutRates.STITCHING_SAFARI;
        if (order.itemType === 'Pyjama') return payoutRates.STITCHING_PYJAMA;
        return 150;
    }
    if (role === WorkerRole.KAJ_BUTTON) {
        if (order.itemType === 'Shirt') return payoutRates.KAJ_BUTTON_SHIRT;
        if (order.itemType === 'Coat') return payoutRates.KAJ_BUTTON_COAT;
        return 10;
    }
    if (role === WorkerRole.FINISHING) {
        return payoutRates.FINISHING;
    }
    return 0;
  };

  const handleViewDetails = (order: Order) => {
      setSelectedOrderForView(order);
      if (['Pant', 'Pyjama', 'Trousers'].includes(order.itemType)) {
          setMeasurementTab('LOWER');
      } else {
          setMeasurementTab('UPPER');
      }
      setIsViewModalOpen(true);
  };

  const handlePlayVoiceNote = (noteId: string) => {
      if (playingNoteId === noteId) {
          setPlayingNoteId(null);
      } else {
          setPlayingNoteId(noteId);
          setTimeout(() => setPlayingNoteId(null), 5000);
      }
  };

  const handleSecureDelivery = async () => {
      if (!handoverOrder || !currentUser) return;
      if (!handoverPin.trim()) {
          alert("Please enter the Showroom/Manager PIN.");
          return;
      }

      setHandoverLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); 

      const result = verifyCashHandover(
          handoverOrder.billNumber,
          handoverOrder.payment.pendingAmount,
          handoverPin,
          currentUser.id
      );

      setHandoverLoading(false);

      if (result.success) {
          setUpdateMessage({ type: 'success', text: result.message });
          setCompletedToday(prev => prev + 1);
          
          // Payout for Delivery/Return
          processWorkerPayout(
              currentUser.id,
              payoutRates.RETURN_TO_SHOWROOM,
              `Showroom Return Bonus for ${handoverOrder.billNumber}`,
              handoverOrder.billNumber
          );

          setIsHandoverModalOpen(false);
          setHandoverOrder(null);
          setHandoverPin('');
      } else {
          alert(result.message);
      }
      
      setTimeout(() => setUpdateMessage(null), 4000);
  };

  const initiateCompletion = (order: Order) => {
    if (role === WorkerRole.CUTTING || isStitchingRole(role)) {
      setSelectedOrderForAssign(order);
      setSelectedKarigarId(''); 
      setManualKarigarId('');
      setManualKarigarName('');
      setAssignmentNote('');
      setWorkerSearch('');
      setAssignWorkerFilter('AUTO'); 
      
      if (isStitchingRole(role)) {
          setStitchedByName(currentUser?.name || '');
          setStitchedById(currentUser?.id || '');
      }

      setIsAssignModalOpen(true);
      setUpdateMessage(null);
    } else if (role === WorkerRole.DELIVERY) {
      if (order.payment.pendingAmount > 0) {
          setHandoverOrder(order);
          setHandoverPin('');
          setIsHandoverModalOpen(true);
      } else {
          // No Payment, just complete return
          completeTask(order, 'Return to Showroom Completed (No Dues)');
          setUpdateMessage({ type: 'success', text: `Order Returned!` });
          
          // Payout for Delivery/Return
          if(currentUser) {
              processWorkerPayout(
                  currentUser.id,
                  payoutRates.RETURN_TO_SHOWROOM,
                  `Showroom Return for ${order.billNumber}`,
                  order.billNumber
              );
          }
          setTimeout(() => setUpdateMessage(null), 3000);
      }
    } else {
      completeTask(order, 'Standard Completion');
      const actionText = 'Status Updated';
      setUpdateMessage({ type: 'success', text: `Order ${order.billNumber} - ${actionText}` });
      setTimeout(() => setUpdateMessage(null), 3000);
    }
  };

  const confirmAssignment = () => {
    if (!selectedOrderForAssign || !selectedKarigarId) {
      alert("Please select a worker to proceed.");
      return;
    }

    let finalWorkerId = selectedKarigarId;
    let finalWorkerName = '';

    if (selectedKarigarId === 'MANUAL') {
        if (!manualKarigarId || !manualKarigarName) {
            alert("Please enter both Name and ID for manual entry.");
            return;
        }
        finalWorkerId = manualKarigarId;
        finalWorkerName = manualKarigarName;
    } else {
        const k = availableReceivers.find(k => k.id === selectedKarigarId);
        finalWorkerId = k?.id || '';
        finalWorkerName = k?.name || '';
    }
    
    let desc = '';
    if (role === WorkerRole.CUTTING) {
         desc = `Cutting Done. Assigned to ${finalWorkerName}. ${assignmentNote}`;
    } else if (isStitchingRole(role)) {
         const kName = stitchedByName || currentUser?.name || 'Unknown';
         const kId = stitchedById || currentUser?.id || 'Unknown';
         desc = `Stitching Completed by ${kName} (ID: ${kId}). Handover to ${finalWorkerName}. ${assignmentNote}`;
    }

    completeTask(selectedOrderForAssign, desc, finalWorkerId, finalWorkerName);
    
    setUpdateMessage({ type: 'success', text: 'Task Updated & Assigned!' });
    setTimeout(() => setUpdateMessage(null), 3000);

    setIsAssignModalOpen(false);
    setSelectedOrderForAssign(null);
    setSelectedKarigarId('');
  };

  const completeTask = (order: Order, description: string, workerId?: string, workerName?: string) => {
    let nextStatus = OrderStatus.PENDING;
    
    if (role === WorkerRole.MEASUREMENT) nextStatus = OrderStatus.CUTTING;
    else if (role === WorkerRole.CUTTING) nextStatus = OrderStatus.STITCHING;
    
    else if (isStitchingRole(role)) {
        if (['Pant', 'Pyjama', 'Trousers'].includes(order.itemType)) {
            nextStatus = OrderStatus.FINISHING; 
        } else {
            nextStatus = OrderStatus.KAJ_BUTTON;
        }
    }
    
    else if (role === WorkerRole.KAJ_BUTTON) nextStatus = OrderStatus.FINISHING;
    else if (role === WorkerRole.FINISHING) nextStatus = OrderStatus.READY;
    else if (role === WorkerRole.DELIVERY) nextStatus = OrderStatus.DELIVERED;

    updateOrderStatus(order.billNumber, nextStatus, description, workerId, workerName);
    setCompletedToday(prev => prev + 1);

    if (currentUser && role !== WorkerRole.DELIVERY) { 
        const rate = getRateForOrder(order, role);
        if (rate > 0) {
            processWorkerPayout(
                currentUser.id,
                rate,
                `${role} for ${order.itemType} (${order.billNumber})`,
                order.billNumber
            );
        }
    }
  };

  // ... (Rest of component UI logic same as before, updated to use getRateForOrder) ...
  // [Render logic simplified for brevity but includes new props]

  const panelConfig = MAKER_CONFIG[role] || MAKER_CONFIG[WorkerRole.STITCHING];
  const PanelIcon = panelConfig.icon;

  return (
    <div className="space-y-6 relative perspective-[1000px]">
      <ReferralDashboard isOpen={isReferralOpen} onClose={() => setIsReferralOpen(false)} />
      
      {/* ... Handover Modal UI ... */}
      {isHandoverModalOpen && handoverOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in">
              <div className="bg-neutral-900 border border-gold-600 rounded-2xl w-full max-w-md shadow-[0_0_50px_-10px_rgba(234,179,8,0.6)] overflow-hidden">
                  <div className="bg-gold-600 p-6 flex justify-between items-center text-black">
                      <div className="flex items-center gap-2">
                          <Lock className="h-6 w-6" />
                          <h3 className="text-xl font-bold font-serif uppercase tracking-wider">Showroom Return</h3>
                      </div>
                      <button onClick={() => setIsHandoverModalOpen(false)}><X className="h-6 w-6" /></button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      <div className="bg-black/50 p-4 rounded-xl border border-neutral-700 text-center">
                          <p className="text-neutral-400 text-xs uppercase tracking-widest mb-1">Cash to Return/Verify</p>
                          <p className="text-white text-3xl font-mono font-bold">₹ {handoverOrder.payment.pendingAmount}</p>
                          <div className="h-px w-full bg-neutral-800 my-3"></div>
                          <p className="text-xs text-neutral-400">Handover To</p>
                          <p className="text-gold-500 font-bold text-lg">{handoverOrder.showroomName || 'Showroom Manager'}</p>
                      </div>

                      <div>
                          <label className="text-xs text-neutral-500 uppercase font-bold block mb-2 text-center">Enter Showroom PIN to Confirm Return</label>
                          <div className="relative">
                              <input 
                                  type="password" 
                                  value={handoverPin}
                                  onChange={(e) => setHandoverPin(e.target.value)}
                                  className="w-full bg-neutral-800 border border-neutral-600 text-white text-center text-2xl tracking-[0.5em] p-4 rounded-xl focus:border-gold-500 focus:outline-none placeholder-neutral-600 font-mono"
                                  placeholder="••••"
                                  maxLength={4}
                              />
                          </div>
                      </div>

                      <button 
                          onClick={handleSecureDelivery}
                          disabled={handoverLoading || handoverPin.length < 4}
                          className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {handoverLoading ? 'Verifying...' : 'Verify PIN & Complete Return'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
           <h2 className="text-3xl font-serif text-white tracking-wide flex items-center gap-3">
              <PanelIcon className={`h-8 w-8 ${panelConfig.colorClass}`} />
              {panelConfig.title}
           </h2>
           <p className="text-neutral-400 text-sm mt-1 ml-11">
               {panelConfig.subtitle}
           </p>
        </div>
        
        {/* TABS SWITCHER */}
        <div className="flex gap-2">
            <div className="flex bg-neutral-900 rounded-xl p-1.5 border border-white/5 backdrop-blur-md">
                <button 
                    onClick={() => setActiveTab('TASKS')} 
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'TASKS' ? 'bg-gold-600 text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                >
                    <Briefcase className="h-4 w-4" /> Pending Tasks
                </button>
                <button 
                    onClick={() => setActiveTab('MY_HISTORY')} 
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'MY_HISTORY' ? 'bg-gold-600 text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                >
                    <ListChecks className="h-4 w-4" /> My Work History
                </button>
            </div>
        </div>
      </div>

      {activeTab === 'TASKS' && (
      <>
        {role !== WorkerRole.DELIVERY && (
        <div className="bg-gradient-to-br from-neutral-900 to-black border border-gold-800/30 p-5 rounded-2xl flex items-center gap-8 shadow-[0_10px_30px_-10px_rgba(234,179,8,0.2)] relative overflow-hidden card-3d">
            <div>
                <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1 font-bold">Completed (Today)</p>
                <div className="flex items-center text-green-400 font-mono text-3xl font-bold">
                    {completedToday} <span className="text-xs ml-1 text-neutral-500 font-sans font-normal">Pcs</span>
                </div>
            </div>
            <div className="h-10 w-px bg-neutral-800"></div>
            <div>
                 <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1 font-bold">Earned (Today)</p>
                 <div className="flex items-center text-gold-500 font-mono text-3xl font-bold">
                    ₹{earnedToday}
                </div>
            </div>
            <div className="h-10 w-px bg-neutral-800"></div>
            <div>
                 <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1 font-bold">Pending</p>
                 <div className="flex items-center text-white font-mono text-3xl font-bold">
                    {tasks.length} <span className="text-xs ml-1 text-neutral-500 font-sans font-normal">Pcs</span>
                </div>
            </div>
        </div>
        )}

        <WalletSection />

      {/* Task List */}
      <div className="grid gap-6 mt-8">
        {tasks.length === 0 ? (
          <div className="text-center py-20 bg-neutral-900/30 rounded-2xl border border-neutral-800 border-dashed animate-fade-in">
            <Check className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-50" />
            <p className="text-neutral-500">All caught up! No tasks match your search.</p>
          </div>
        ) : (
          tasks.map(order => {
            const rate = getRateForOrder(order, role);
            
            let nextStage = 'Next Stage';
            if (role === WorkerRole.CUTTING) nextStage = 'Cutting Complete > Assign';
            else if (isStitchingRole(role)) {
                if (['Pant', 'Pyjama', 'Trousers'].includes(order.itemType)) nextStage = 'Done > To Finishing';
                else nextStage = 'Done > To Kaj Button';
            }
            else if (role === WorkerRole.KAJ_BUTTON) nextStage = 'Done > Send to Finishing';
            else if (role === WorkerRole.FINISHING) nextStage = 'Ready for Delivery';
            else if (role === WorkerRole.DELIVERY) nextStage = 'Mark Delivered (Return)';

            if (role === WorkerRole.DELIVERY && order.payment.pendingAmount > 0) {
                nextStage = `Handover ₹${order.payment.pendingAmount} & Return`;
            }

            return (
              <div key={order.billNumber} className="glass-panel p-6 border border-neutral-800 rounded-2xl relative overflow-hidden card-3d hover:border-gold-800/50 transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                    {role === WorkerRole.FINISHING ? <PackageCheck className="h-24 w-24 text-gold-500" /> : <PanelIcon className="h-24 w-24 text-gold-500" />}
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                    <div className="flex-1 w-full">
                        <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-white tracking-wide">{order.billNumber}</h3>
                            <span className="bg-neutral-800 text-neutral-300 text-xs px-2 py-1 rounded border border-neutral-700 uppercase font-bold">{order.itemType}</span>
                            
                            {order.vipCategory && (
                            <span className="bg-gold-900/30 text-gold-500 text-xs px-2 py-1 rounded border border-gold-900 flex items-center gap-1">
                                <Crown className="h-3 w-3" /> VIP
                            </span>
                            )}
                        </div>
                        
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
                            <p className="text-neutral-400 text-sm flex items-center gap-1"><User className="h-3 w-3" /> {order.customerName}</p>
                            <p className="text-sm font-bold flex items-center gap-1 bg-neutral-900/50 text-neutral-300 px-2 py-0.5 rounded border border-neutral-700">
                                <Calendar className="h-3 w-3" /> Due: {order.deliveryDate}
                            </p>
                            <p className="text-indigo-400 text-xs flex items-center gap-1 bg-indigo-900/20 px-2 py-0.5 rounded border border-indigo-900/50 font-bold uppercase tracking-wider">
                                <Store className="h-3 w-3" /> {order.showroomName || "Main Showroom"}
                            </p>
                        </div>

                        {role === WorkerRole.DELIVERY && order.payment.pendingAmount > 0 && (
                            <div className="mb-4 bg-red-900/20 border border-red-600/50 p-3 rounded-xl flex items-center gap-3 animate-pulse">
                                <Wallet className="h-5 w-5 text-red-500" />
                                <div>
                                    <p className="text-xs text-red-400 uppercase font-bold">Pending Payment</p>
                                    <p className="text-white font-bold font-mono text-lg">₹ {order.payment.pendingAmount}</p>
                                </div>
                            </div>
                        )}

                        <div className="text-xs text-neutral-500">
                            Assigned By: <span className="text-white">{order.history?.[order.history.length-1]?.updatedBy || 'System'}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 w-full md:w-auto self-center md:self-start mt-2 md:mt-0">
                        <div className="text-right mb-2">
                            <p className="text-[10px] text-neutral-500 uppercase font-bold">Rate</p>
                            <p className="text-lg font-bold text-gold-500 font-mono">₹{rate}</p>
                        </div>
                        <div className="flex gap-2 relative">
                            <button 
                                onClick={() => handleViewDetails(order)}
                                className="bg-neutral-800 hover:bg-neutral-700 text-white p-3 rounded-xl transition-all shadow-lg border border-neutral-700 hover:border-white"
                                title="View Measurements & Notes"
                            >
                                <Eye className="h-5 w-5" />
                            </button>
                            
                            <button 
                                    onClick={() => initiateCompletion(order)}
                                    className={`font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-105 ${role === WorkerRole.DELIVERY && order.payment.pendingAmount > 0 ? 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 shadow-red-900/20' : 'bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black'}`}
                                >
                                    {nextStage} <ArrowRight className="h-4 w-4" />
                                </button>
                        </div>
                    </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      </>
      )}
      
      {/* ... Assign Modal etc ... */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-neutral-900 border border-gold-600 rounded-2xl w-full max-w-md shadow-[0_25px_50px_-12px_rgba(234,179,8,0.3)] transform-style-3d animate-float max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-gold-900/10 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-serif text-white">
                    {role === WorkerRole.CUTTING ? 'Mark Cutting Done' : 'Mark Stitching Done'}
                </h3>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-neutral-500 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700 shadow-inner">
                <div className="flex justify-between items-end mb-1">
                    <p className="text-gold-500 text-xl font-bold font-mono tracking-wide">{selectedOrderForAssign?.billNumber}</p>
                    <span className="bg-neutral-900 text-white text-[10px] px-2 py-1 rounded border border-neutral-700 font-bold uppercase">{selectedOrderForAssign?.itemType}</span>
                </div>
                <p className="text-sm text-neutral-300 border-t border-neutral-700 pt-2 mt-2">{selectedOrderForAssign?.customerName}</p>
              </div>

              {/* Department Filter for Cutting */}
              {role === WorkerRole.CUTTING && (
                  <div>
                      <label className="text-xs text-gold-500 uppercase font-bold block mb-2">Filter Worker Department</label>
                      <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-700 overflow-x-auto">
                          <button onClick={() => setAssignWorkerFilter('AUTO')} className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all whitespace-nowrap ${assignWorkerFilter === 'AUTO' ? 'bg-gold-600 text-black' : 'text-neutral-400 hover:text-white'}`}>Auto</button>
                          <button onClick={() => setAssignWorkerFilter('SHIRT_DEPT')} className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all whitespace-nowrap ${assignWorkerFilter === 'SHIRT_DEPT' ? 'bg-blue-900 text-white' : 'text-neutral-400 hover:text-white'}`}>Shirt</button>
                          <button onClick={() => setAssignWorkerFilter('PANT_DEPT')} className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all whitespace-nowrap ${assignWorkerFilter === 'PANT_DEPT' ? 'bg-green-900 text-white' : 'text-neutral-400 hover:text-white'}`}>Pant</button>
                          <button onClick={() => setAssignWorkerFilter('COAT_DEPT')} className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all whitespace-nowrap ${assignWorkerFilter === 'COAT_DEPT' ? 'bg-purple-900 text-white' : 'text-neutral-400 hover:text-white'}`}>Coat</button>
                      </div>
                  </div>
              )}

              {/* Karigar Selection */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2 font-bold">
                    Assign To
                </label>
                
                <div className="relative">
                    <select 
                    value={selectedKarigarId}
                    onChange={(e) => setSelectedKarigarId(e.target.value)}
                    className="w-full bg-black border border-neutral-700 text-white p-3 pl-2 rounded-xl focus:border-gold-500 focus:outline-none appearance-none transition-colors"
                    size={5} 
                    >
                    <option value="" disabled>-- Select Worker Below --</option>
                    {getFilteredReceivers()
                        .map(k => (
                        <option key={k.id} value={k.id} className="p-2 border-b border-neutral-800 last:border-0 hover:bg-neutral-800">
                            {k.name} ({k.role})
                        </option>
                    ))}
                    <option value="MANUAL" className="text-gold-500 font-bold p-2 bg-neutral-900">+ Other (Enter Manually)</option>
                    </select>
                </div>
                
                {selectedKarigarId === 'MANUAL' && (
                    <div className="grid grid-cols-2 gap-4 mt-3 animate-fade-in">
                        <div>
                            <input type="text" value={manualKarigarId} onChange={(e) => setManualKarigarId(e.target.value)} placeholder="Enter ID" className="w-full bg-neutral-900 border border-neutral-700 text-white p-3 rounded-lg text-sm" />
                        </div>
                        <div>
                             <input type="text" value={manualKarigarName} onChange={(e) => setManualKarigarName(e.target.value)} placeholder="Enter Name" className="w-full bg-neutral-900 border border-neutral-700 text-white p-3 rounded-lg text-sm" />
                        </div>
                    </div>
                )}
              </div>

              <button 
                onClick={confirmAssignment}
                disabled={!selectedKarigarId}
                className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-500 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {role === WorkerRole.CUTTING ? 'Confirm & Send to Stitching' : 'Confirm & Handover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
