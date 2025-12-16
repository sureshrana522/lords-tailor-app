
import React, { useState, useMemo } from 'react';
import { useData } from '../DataContext';
import { WorkerRole, OrderStatus, User, Order, ManagerRank } from '../types';
import { Trash2, UserPlus, Search, Crown, Shield, Settings, Users, ShoppingBag, DollarSign, Activity, Save, X, AlertTriangle, RefreshCw, Pencil, Filter, ClipboardList, Calendar, CheckCircle2, Clock, Percent, Edit, Download, AlertOctagon, Megaphone, Image as ImageIcon, Wallet, Send, IndianRupee, TrendingUp, ArrowUpRight, ArrowDownLeft, Landmark, AlertCircle, ArrowRightLeft, ArrowLeftRight, Check, Ruler, Database, Eye, Copy, LogIn, PieChart } from 'lucide-react';
import { DatabaseConfigModal } from './DatabaseConfigModal'; // Import modal

export const AdminDashboard: React.FC = () => {
  const { 
      allUsers, orders, transactions, customers, inventory, userBalances, transferFunds,
      addNewUser, editUser, deleteUser, deleteOrder, updateOrderStatus, 
      referralLevels, updateReferralLevels, payoutRates, updatePayoutRates,
      activeAnnouncement, publishAnnouncement, clearAnnouncement,
      resetSystemData, isOfflineMode, login, distributeDailyDividends
  } = useData();
  
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'USERS' | 'ORDERS' | 'WORK_HISTORY' | 'FINANCE' | 'SETTINGS' | 'BROADCAST'>('DASHBOARD');

  // --- Broadcast State ---
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastImage, setBroadcastImage] = useState('');

  // --- User Management State ---
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<Partial<User>>({
     name: '', mobile: '', role: WorkerRole.STITCHING, referralCode: '', referredBy: ''
  });
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [viewHistoryUserId, setViewHistoryUserId] = useState<string | null>(null); // For individual staff history
  
  // NEW: Rank Filter for Managers
  const [rankFilter, setRankFilter] = useState<string>('ALL');

  // --- Order Management State ---
  const [orderSearch, setOrderSearch] = useState('');

  // --- Work History & Report State ---
  const [historyView, setHistoryView] = useState<'JOURNEY' | 'WORKER_REPORT'>('JOURNEY');
  const [selectedWorkerForReport, setSelectedWorkerForReport] = useState<string>('');
  const [historyTimeFilter, setHistoryTimeFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | '1_MONTH' | '6_MONTHS' | 'CUSTOM'>('6_MONTHS');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // --- Finance State ---
  const [distributeAmount, setDistributeAmount] = useState('');
  const [distributeRecipient, setDistributeRecipient] = useState('');
  const [distributeMsg, setDistributeMsg] = useState('');
  const [financeSearch, setFinanceSearch] = useState('');
  const [financeLogFilter, setFinanceLogFilter] = useState<'ALL' | 'WITHDRAWAL' | 'TRANSFER'>('ALL');
  const [dailyCompanyProfit, setDailyCompanyProfit] = useState(''); // NEW

  // --- Settings Edit State ---
  const [editReferral, setEditReferral] = useState(false);
  const [localReferralLevels, setLocalReferralLevels] = useState(referralLevels);
  const [editRates, setEditRates] = useState(false);
  const [localPayoutRates, setLocalPayoutRates] = useState(payoutRates);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false); // Added for settings

  // --- Handlers ---
  
  const handleBroadcast = () => {
      if (!broadcastText) return alert("Please enter announcement text.");
      publishAnnouncement(broadcastText, broadcastImage);
      alert("Broadcast Sent! Every user will see it now.");
      setBroadcastText('');
      setBroadcastImage('');
  };

  const handleCopyDbCode = async () => {
    const code = localStorage.getItem('LB_FIREBASE_CONFIG');
    if (code) {
        try {
            await navigator.clipboard.writeText(code);
            alert("✅ Database Code Copied!");
        } catch (e) {
            alert("Failed to copy");
        }
    } else {
        alert("⚠️ No Database Code found. Please configure it first.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBroadcastImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (!userData.name || !userData.mobile || !userData.role) return;
      
      if (editingUserId) {
        // Edit Mode
        editUser(editingUserId, userData);
      } else {
        // Add Mode
        const id = userData.role === WorkerRole.ADMIN ? `ADM${Date.now().toString().slice(-3)}` : 
                   userData.role === WorkerRole.SHOWROOM ? `MGR${Date.now().toString().slice(-3)}` :
                   `USR${Date.now().toString().slice(-3)}`;
        
        const userToAdd: User = {
            id: id,
            name: userData.name!,
            mobile: userData.mobile!,
            role: userData.role!,
            referralCode: userData.referralCode || `REF${id}`,
            referredBy: userData.referredBy
        };
        addNewUser(userToAdd);
      }
      
      setIsUserFormOpen(false);
      setEditingUserId(null);
      setUserData({ name: '', mobile: '', role: WorkerRole.STITCHING, referralCode: '', referredBy: '' });
  };

  const handleEditUserClick = (user: User) => {
      setUserData({
          name: user.name,
          mobile: user.mobile,
          role: user.role,
          referralCode: user.referralCode,
          referredBy: user.referredBy || ''
      });
      setEditingUserId(user.id);
      setIsUserFormOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
      if (window.confirm('Are you sure you want to delete this user? This cannot be undone.')) {
          deleteUser(userId);
      }
  };

  const handleDirectLogin = (user: User) => {
      if(window.confirm(`⚠️ SWITCH USER\n\nLogin as ${user.name} (${user.role})?\n\nYou will be logged out of Admin.`)) {
          login(user.id, user.password || '123456');
          window.scrollTo(0,0);
      }
  };

  const handleDeleteOrder = (billNo: string) => {
      if (window.confirm('Delete this order?')) {
          deleteOrder(billNo);
      }
  };

  const handleForceStatus = (billNo: string, newStatus: string) => {
      if (window.confirm(`Force update status to ${newStatus}?`)) {
          updateOrderStatus(billNo, newStatus as OrderStatus, 'Admin Forced Update');
      }
  };

  const handleDistributeFunds = () => {
      const amt = parseFloat(distributeAmount);
      if(!distributeRecipient || isNaN(amt) || amt <= 0) {
          alert("Invalid Amount or Recipient");
          return;
      }
      
      // Assume current user is Admin for this logic
      const result = transferFunds('ADM001', distributeRecipient, amt);
      if(result.success) {
          setDistributeMsg(`Success: ₹${amt} sent to ${distributeRecipient}`);
          setDistributeAmount('');
          setDistributeRecipient('');
      } else {
          setDistributeMsg("Error: " + result.message);
      }
      setTimeout(() => setDistributeMsg(''), 3000);
  };

  const handleApproveMeasurement = (userId: string) => {
      if(window.confirm("Confirm approval? Ensure this agent has passed the measurement test with 2 Masters.")) {
          editUser(userId, { measurementApprovalStatus: 'APPROVED' });
      }
  };

  const handleRejectMeasurement = (userId: string) => {
      if(window.confirm("Reject request?")) {
          editUser(userId, { measurementApprovalStatus: 'REJECTED' });
      }
  };

  // --- INVESTOR DIVIDEND HANDLER ---
  const handleDistributeDividends = () => {
      const profit = parseFloat(dailyCompanyProfit);
      if (isNaN(profit) || profit <= 0) {
          alert("Please enter a valid profit amount.");
          return;
      }

      if(window.confirm(`CONFIRM: Declare Daily Profit of ₹${profit.toLocaleString()}?\n\n1% (₹${(profit*0.01).toLocaleString()}) will be distributed to active investors immediately.`)) {
          const result = distributeDailyDividends(profit);
          if (result.success) {
              alert(result.message);
              setDailyCompanyProfit('');
          } else {
              alert("Error: " + result.message);
          }
      }
  };

  // --- EXPORT DATABASE FUNCTION ---
  const handleExportData = () => {
      const backupData = {
          timestamp: new Date().toLocaleString(),
          systemVersion: "2.5.0",
          users: allUsers,
          orders: orders,
          customers: customers,
          inventory: inventory,
          transactions: transactions,
          settings: {
              referralLevels: referralLevels,
              payoutRates: payoutRates
          }
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `LORDS_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- DANGER ZONE: DATA RESET ---
  const handleResetData = () => {
      const confirmText = prompt("⚠️ CRITICAL WARNING ⚠️\n\nThis will PERMANENTLY DELETE all:\n- Active Orders\n- Transaction History\n- Customer Data\n- Notifications\n\nThis action CANNOT be undone.\n\nType 'DELETE' to confirm.");
      
      if (confirmText === 'DELETE') {
          resetSystemData();
          alert("✅ System Reset Successful.\nAll business data has been cleared.\nUser accounts remain active.");
      } else if (confirmText !== null) {
          alert("❌ Reset Cancelled. Incorrect confirmation code.");
      }
  };

  // ... (Rest of logic: checkDateFilter, filteredUsers, getStaffWorkHistory, etc.) ...
  const checkDateFilter = (dateStr: string) => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (historyTimeFilter === 'ALL') return true;
      if (historyTimeFilter === 'TODAY') return dateStr === todayStr;
      if (historyTimeFilter === 'YESTERDAY') return dateStr === yesterdayStr;
      
      if (historyTimeFilter === '1_MONTH') {
          const oneMonthAgo = new Date(now);
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          return date >= oneMonthAgo;
      }
      if (historyTimeFilter === '6_MONTHS') {
          const sixMonthsAgo = new Date(now);
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          return date >= sixMonthsAgo;
      }
      if (historyTimeFilter === 'CUSTOM') {
          if (!customStartDate && !customEndDate) return true;
          const targetDate = new Date(dateStr);
          // Set to start of day for start date
          let start = customStartDate ? new Date(customStartDate) : new Date('1970-01-01');
          start.setHours(0,0,0,0);
          
          // Set to end of day for end date
          let end = customEndDate ? new Date(customEndDate) : new Date();
          end.setHours(23, 59, 59, 999);
          
          return targetDate >= start && targetDate <= end;
      }
      return true;
  };

  const filteredUsers = allUsers.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.role.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
      return matchesSearch && matchesRole;
  });

  const getStaffWorkHistory = (userId: string) => {
      return orders.filter(o => 
          (o.history || []).some(h => h.updatedBy === allUsers.find(u => u.id === userId)?.name) ||
          o.assignedWorkerId === userId
      ).map(o => {
          const log = o.history?.find(h => h.updatedBy === allUsers.find(u => u.id === userId)?.name);
          return {
              billNumber: o.billNumber,
              date: log?.date || o.orderDate,
              action: log?.description || 'Assigned',
              item: o.itemType
          };
      });
  };

  const handleSaveReferral = () => {
      updateReferralLevels(localReferralLevels);
      setEditReferral(false);
      alert('Referral Levels Updated!');
  };

  const handleSaveRates = () => {
      updatePayoutRates(localPayoutRates);
      setEditRates(false);
      alert('Payout Rates Updated!');
  };

  const handleRateChange = (key: string, value: string) => {
      const numVal = parseFloat(value) || 0;
      setLocalPayoutRates(prev => ({ ...prev, [key]: numVal }));
  };

  const groupRates = () => {
      const groups: Record<string, string[]> = {
          'Measurement': [], 'Cutting': [], 'Stitching': [], 'Kaj Button': [], 'Finishing / Others': []
      };
      Object.keys(localPayoutRates).forEach(key => {
          if (key.startsWith('MEASUREMENT')) groups['Measurement'].push(key);
          else if (key.startsWith('CUTTING')) groups['Cutting'].push(key);
          else if (key.startsWith('STITCHING')) groups['Stitching'].push(key);
          else if (key.startsWith('KAJ_BUTTON')) groups['Kaj Button'].push(key);
          else groups['Finishing / Others'].push(key);
      });
      return groups;
  };

  return (
    <div className="space-y-8 animate-fade-in perspective-[1000px]">
       <DatabaseConfigModal isOpen={isDbModalOpen} onClose={() => setIsDbModalOpen(false)} />

       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h2 className="text-3xl font-serif text-white tracking-wide">Command <span className="text-gold-500">Center</span></h2>
            <p className="text-neutral-400 text-sm">System Control & Oversight</p>
          </div>
          
          <div className="flex bg-neutral-900/50 p-1.5 rounded-xl border border-white/5 backdrop-blur-md overflow-x-auto max-w-full">
             <button onClick={() => setActiveTab('DASHBOARD')} className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'DASHBOARD' ? 'bg-gold-600 text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}>
                <Activity className="h-4 w-4" /> Overview
             </button>
             <button onClick={() => setActiveTab('USERS')} className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'USERS' ? 'bg-gold-600 text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}>
                <Users className="h-4 w-4" /> Staff List
             </button>
             <button onClick={() => setActiveTab('FINANCE')} className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'FINANCE' ? 'bg-gold-600 text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}>
                <IndianRupee className="h-4 w-4" /> Finance
             </button>
             <button onClick={() => setActiveTab('SETTINGS')} className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'SETTINGS' ? 'bg-gold-600 text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}>
                <Settings className="h-4 w-4" /> Settings
             </button>
          </div>
       </div>

       {/* --- DASHBOARD TAB --- */}
       {activeTab === 'DASHBOARD' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
             <div className="glass-panel p-6 border border-neutral-800 rounded-xl card-3d">
                <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider mb-2">Total Staff</p>
                <div className="text-3xl font-bold text-white flex items-center gap-2">
                    {allUsers.length} <Users className="h-5 w-5 text-gold-500" />
                </div>
             </div>
             <div className="glass-panel p-6 border border-neutral-800 rounded-xl card-3d">
                <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider mb-2">Active Orders</p>
                <div className="text-3xl font-bold text-white flex items-center gap-2">
                    {orders.length} <ShoppingBag className="h-5 w-5 text-green-500" />
                </div>
             </div>
             <div className="glass-panel p-6 border border-neutral-800 rounded-xl card-3d">
                <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider mb-2">Total Admin Funds</p>
                <div className="text-3xl font-bold text-gold-500 font-mono">
                    ₹ {userBalances['ADM001']?.toLocaleString() || 0}
                </div>
             </div>
          </div>
       )}

       {/* --- USERS TAB --- */}
       {activeTab === 'USERS' && (
           <div className="space-y-6 animate-fade-in">
               <div className="flex justify-between items-center">
                   <div className="flex gap-4">
                       <input 
                           placeholder="Search Staff..." 
                           value={userSearch}
                           onChange={e => setUserSearch(e.target.value)}
                           className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:border-gold-500 outline-none"
                       />
                       <select 
                           value={userRoleFilter} 
                           onChange={e => setUserRoleFilter(e.target.value)}
                           className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white outline-none"
                       >
                           <option value="ALL">All Roles</option>
                           {Object.values(WorkerRole).map(r => <option key={r} value={r}>{r}</option>)}
                       </select>
                   </div>
                   <button 
                       onClick={() => { setEditingUserId(null); setUserData({name:'', mobile:'', role: WorkerRole.STITCHING, referralCode:'', referredBy:''}); setIsUserFormOpen(true); }}
                       className="bg-gold-600 hover:bg-gold-500 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                   >
                       <UserPlus className="h-4 w-4" /> Add Staff
                   </button>
               </div>

               {isUserFormOpen && (
                   <div className="bg-neutral-900 border border-gold-600 p-6 rounded-xl animate-fade-in">
                       <h3 className="text-white font-bold mb-4">{editingUserId ? 'Edit Staff' : 'Add New Staff'}</h3>
                       <form onSubmit={handleSaveUser} className="grid grid-cols-2 gap-4">
                           <input placeholder="Name" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} className="bg-black border border-neutral-700 text-white p-3 rounded-lg" required />
                           <input placeholder="Mobile (Login ID)" value={userData.mobile} onChange={e => setUserData({...userData, mobile: e.target.value})} className="bg-black border border-neutral-700 text-white p-3 rounded-lg" required />
                           <select value={userData.role} onChange={e => setUserData({...userData, role: e.target.value as WorkerRole})} className="bg-black border border-neutral-700 text-white p-3 rounded-lg">
                               {Object.values(WorkerRole).map(r => <option key={r} value={r}>{r}</option>)}
                           </select>
                           <input placeholder="Referred By (Admin ID)" value={userData.referredBy} onChange={e => setUserData({...userData, referredBy: e.target.value})} className="bg-black border border-neutral-700 text-white p-3 rounded-lg" />
                           <div className="col-span-2 flex gap-3 pt-2">
                               <button type="button" onClick={() => setIsUserFormOpen(false)} className="px-4 py-2 text-white bg-neutral-800 rounded-lg">Cancel</button>
                               <button type="submit" className="px-4 py-2 bg-gold-600 text-black font-bold rounded-lg">Save User</button>
                           </div>
                       </form>
                   </div>
               )}

               {viewHistoryUserId ? (
                   <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                       <div className="flex justify-between items-center mb-4">
                           <h3 className="text-white font-bold">Work History: {allUsers.find(u => u.id === viewHistoryUserId)?.name}</h3>
                           <button onClick={() => setViewHistoryUserId(null)} className="text-red-500 hover:text-white"><X className="h-5 w-5"/></button>
                       </div>
                       <div className="max-h-96 overflow-y-auto">
                           {getStaffWorkHistory(viewHistoryUserId).length === 0 ? (
                               <p className="text-neutral-500">No work history found.</p>
                           ) : (
                               <table className="w-full text-left text-sm text-neutral-400">
                                   <thead className="text-xs uppercase bg-black text-neutral-500">
                                       <tr>
                                           <th className="p-3">Date</th>
                                           <th className="p-3">Bill No</th>
                                           <th className="p-3">Item</th>
                                           <th className="p-3">Action</th>
                                       </tr>
                                   </thead>
                                   <tbody>
                                       {getStaffWorkHistory(viewHistoryUserId).map((log, idx) => (
                                           <tr key={idx} className="border-b border-neutral-800">
                                               <td className="p-3">{log.date}</td>
                                               <td className="p-3 text-gold-500">{log.billNumber}</td>
                                               <td className="p-3">{log.item}</td>
                                               <td className="p-3 text-white">{log.action}</td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           )}
                       </div>
                   </div>
               ) : (
                   <div className="border border-neutral-800 rounded-xl overflow-hidden">
                       <table className="w-full text-left text-sm text-neutral-400">
                           <thead className="bg-neutral-900 text-neutral-500 uppercase text-xs font-bold">
                               <tr>
                                   <th className="p-4">Name / ID</th>
                                   <th className="p-4">Role</th>
                                   <th className="p-4">Referred By</th>
                                   <th className="p-4">Team Count</th>
                                   <th className="p-4 text-right">Actions</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-neutral-800 bg-neutral-900/20">
                               {filteredUsers.map(user => (
                                   <tr key={user.id} className="hover:bg-neutral-800/30 transition-colors">
                                       <td className="p-4">
                                           <p className="text-white font-bold">{user.name}</p>
                                           <p className="text-xs font-mono text-gold-600">{user.id}</p>
                                       </td>
                                       <td className="p-4">
                                           <span className="bg-neutral-800 px-2 py-1 rounded text-xs border border-neutral-700">{user.role}</span>
                                       </td>
                                       <td className="p-4 text-neutral-300">
                                           {user.referredBy || '-'}
                                       </td>
                                       <td className="p-4 text-white font-bold">
                                           {allUsers.filter(u => u.referredBy === user.id).length}
                                       </td>
                                       <td className="p-4 text-right flex items-center justify-end gap-2">
                                           <button 
                                                onClick={() => handleDirectLogin(user)} 
                                                className="p-2 bg-neutral-800 hover:bg-gold-600 hover:text-black rounded text-gold-500 transition-colors"
                                                title="Direct Login (Impersonate)"
                                           >
                                               <LogIn className="h-4 w-4" />
                                           </button>
                                           <button onClick={() => setViewHistoryUserId(user.id)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded text-blue-400" title="View History">
                                               <Clock className="h-4 w-4" />
                                           </button>
                                           <button onClick={() => handleEditUserClick(user)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded text-gold-500" title="Edit">
                                               <Edit className="h-4 w-4" />
                                           </button>
                                           <button onClick={() => handleDeleteUser(user.id)} className="p-2 bg-neutral-800 hover:bg-red-900/30 rounded text-red-500" title="Delete">
                                               <Trash2 className="h-4 w-4" />
                                           </button>
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
               )}
           </div>
       )}

       {/* --- FINANCE TAB --- */}
       {activeTab === 'FINANCE' && (
           <div className="space-y-6 animate-fade-in">
               
               {/* INVESTOR DIVIDEND CONTROL */}
               <div className="bg-gradient-to-br from-neutral-900 to-black p-6 rounded-xl border border-gold-600/30">
                   <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                       <PieChart className="h-5 w-5 text-gold-500" /> Daily Investor Dividend
                   </h3>
                   <div className="flex flex-col md:flex-row gap-4 items-end">
                       <div className="w-full">
                           <label className="text-xs text-neutral-400 uppercase font-bold block mb-2">Total Company Profit (Today)</label>
                           <div className="relative">
                               <input 
                                   type="number" 
                                   value={dailyCompanyProfit}
                                   onChange={e => setDailyCompanyProfit(e.target.value)}
                                   className="w-full bg-black border border-neutral-700 text-white pl-10 p-3 rounded-lg focus:border-gold-500 focus:outline-none text-lg font-mono placeholder-neutral-700"
                                   placeholder="0.00" 
                               />
                               <span className="absolute left-4 top-4 text-neutral-500">₹</span>
                           </div>
                       </div>
                       <button 
                           onClick={handleDistributeDividends}
                           className="bg-gold-600 hover:bg-gold-500 text-black font-bold px-6 py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 w-full md:w-auto whitespace-nowrap"
                       >
                           <Send className="h-4 w-4" /> Distribute 1%
                       </button>
                   </div>
                   <p className="text-xs text-neutral-500 mt-2">
                       Action: This will take <b>1% of the amount</b> entered above and distribute it among all active investors based on their investment ratio.
                   </p>
               </div>

               {/* ADMIN TRANSFER */}
               <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
                   <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                       <Wallet className="h-5 w-5 text-blue-500" /> Direct Fund Transfer
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                       <input 
                           type="text" 
                           value={distributeRecipient} 
                           onChange={e => setDistributeRecipient(e.target.value)}
                           className="bg-black border border-neutral-700 text-white p-3 rounded-lg"
                           placeholder="Recipient ID" 
                       />
                       <input 
                           type="number" 
                           value={distributeAmount} 
                           onChange={e => setDistributeAmount(e.target.value)}
                           className="bg-black border border-neutral-700 text-white p-3 rounded-lg"
                           placeholder="Amount (₹)" 
                       />
                       <button onClick={handleDistributeFunds} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 rounded-lg flex items-center justify-center gap-2">
                           <Send className="h-4 w-4" /> Send
                       </button>
                   </div>
                   {distributeMsg && <p className="text-sm text-green-500 font-bold">{distributeMsg}</p>}
               </div>
           </div>
       )}

       {/* --- SETTINGS TAB --- */}
       {activeTab === 'SETTINGS' && (
           <div className="space-y-6 animate-fade-in">
               
               {/* NEW: DATABASE CONNECTION SETTINGS */}
               <div className="bg-neutral-900 border border-gold-600/30 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                   <div className="flex items-center gap-4">
                       <div className="bg-gold-600 p-3 rounded-full text-black">
                           <Database className="h-6 w-6" />
                       </div>
                       <div>
                           <h3 className="text-white font-bold text-lg">Cloud Database</h3>
                           <p className="text-neutral-400 text-sm">Sync Status: {isOfflineMode ? 'Offline' : 'Connected'}</p>
                       </div>
                   </div>
                   <div className="flex gap-3">
                       <button 
                           onClick={handleCopyDbCode}
                           className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 border border-neutral-600"
                           title="Copy Code to Share"
                       >
                           <Copy className="h-4 w-4" /> Copy Code
                       </button>
                       <button 
                           onClick={() => setIsDbModalOpen(true)} 
                           className="bg-gold-600 hover:bg-gold-500 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-transform hover:scale-105"
                       >
                           <Settings className="h-4 w-4" /> Configure
                       </button>
                   </div>
               </div>

               <div className="bg-yellow-900/20 border border-yellow-900/50 p-4 rounded-xl flex items-start gap-3">
                   <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                   <div>
                       <h4 className="text-yellow-500 font-bold text-sm">System Configuration</h4>
                       <p className="text-xs text-neutral-400 mt-1">Changes here affect global payouts immediately. Use caution.</p>
                   </div>
               </div>

               {/* REFERRAL LEVELS */}
               <div className="glass-panel p-6 border border-neutral-800 rounded-xl">
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="text-white font-bold">Referral Commission Levels</h3>
                       {!editReferral ? (
                           <button onClick={() => setEditReferral(true)} className="text-blue-400 hover:text-white text-xs font-bold uppercase">Edit</button>
                       ) : (
                           <div className="flex gap-2">
                               <button onClick={handleSaveReferral} className="text-green-500 hover:text-white text-xs font-bold uppercase">Save</button>
                               <button onClick={() => { setEditReferral(false); setLocalReferralLevels(referralLevels); }} className="text-red-500 hover:text-white text-xs font-bold uppercase">Cancel</button>
                           </div>
                       )}
                   </div>
                   <div className="grid grid-cols-5 gap-2">
                       {localReferralLevels.map((lvl) => (
                           <div key={lvl.level} className="bg-neutral-900 p-2 rounded text-center border border-neutral-800">
                               <p className="text-[10px] text-neutral-500 uppercase">Level {lvl.level}</p>
                               {editReferral ? (
                                   <input 
                                       type="number" 
                                       value={lvl.percent} 
                                       onChange={(e) => {
                                           const val = parseFloat(e.target.value);
                                           setLocalReferralLevels(prev => prev.map(p => p.level === lvl.level ? { ...p, percent: val } : p));
                                       }}
                                       className="w-full bg-black text-white text-center font-bold border border-neutral-700 rounded mt-1"
                                   />
                               ) : (
                                   <p className="text-gold-500 font-bold">{lvl.percent}%</p>
                               )}
                           </div>
                       ))}
                   </div>
               </div>

               {/* PAYOUT RATES */}
               <div className="glass-panel p-6 border border-neutral-800 rounded-xl">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="text-white font-bold">Worker Payout Rates (₹)</h3>
                       {!editRates ? (
                           <button onClick={() => setEditRates(true)} className="text-blue-400 hover:text-white text-xs font-bold uppercase">Edit Rates</button>
                       ) : (
                           <div className="flex gap-2">
                               <button onClick={handleSaveRates} className="text-green-500 hover:text-white text-xs font-bold uppercase">Save Changes</button>
                               <button onClick={() => { setEditRates(false); setLocalPayoutRates(payoutRates); }} className="text-red-500 hover:text-white text-xs font-bold uppercase">Cancel</button>
                           </div>
                       )}
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {Object.entries(groupRates()).map(([groupName, keys]) => (
                           <div key={groupName} className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
                               <h4 className="text-gold-500 text-xs font-bold uppercase mb-3 border-b border-neutral-800 pb-2">{groupName}</h4>
                               <div className="space-y-2">
                                   {keys.map(key => (
                                       <div key={key} className="flex justify-between items-center">
                                           <span className="text-neutral-400 text-xs">{key.replace(/_/g, ' ')}</span>
                                           {editRates ? (
                                               <input 
                                                   type="number" 
                                                   value={(localPayoutRates as any)[key]} 
                                                   onChange={(e) => handleRateChange(key, e.target.value)}
                                                   className="w-16 bg-black text-white text-right font-mono text-sm border border-neutral-700 rounded p-1"
                                               />
                                           ) : (
                                               <span className="text-white font-mono text-sm">{(localPayoutRates as any)[key]}</span>
                                           )}
                                       </div>
                                   ))}
                               </div>
                           </div>
                       ))}
                   </div>
               </div>

               {/* DANGER ZONE */}
               <div className="border border-red-900/50 rounded-xl p-6 bg-red-900/5">
                   <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2">
                       <AlertOctagon className="h-5 w-5" /> Danger Zone
                   </h3>
                   <div className="flex gap-4">
                       <button onClick={handleExportData} className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                           <Download className="h-4 w-4" /> Backup Database (JSON)
                       </button>
                       <button onClick={handleResetData} className="bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                           <Trash2 className="h-4 w-4" /> Reset System Data
                       </button>
                   </div>
               </div>
           </div>
       )}

    </div>
  );
};
