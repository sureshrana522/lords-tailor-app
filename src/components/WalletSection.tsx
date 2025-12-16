
import React, { useState, useMemo } from 'react';
import { useData } from '../DataContext';
import { IndianRupee, Send, ArrowDownLeft, ArrowUpRight, History, Wallet, AlertCircle, CheckCircle2, PlusCircle, Smartphone, KeyRound, TrendingUp, RefreshCw } from 'lucide-react';
import { WorkerRole } from '../types';

export const WalletSection: React.FC = () => {
  const { currentUser, userBalances, transactions, withdrawFunds, transferFunds, addFunds } = useData();
  const balance = userBalances[currentUser?.id || ''] || 0;
  
  // Filter transactions for current user and sort by newest first
  const myTransactions = transactions
    .filter(t => t.userId === currentUser?.id)
    .sort((a, b) => new Date(b.date + ' ' + b.timestamp).getTime() - new Date(b.date + ' ' + a.timestamp).getTime());

  // --- CALCULATE WALLET STATS ---
  const totalIncome = myTransactions
    .filter(t => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawn = myTransactions
    .filter(t => t.type === 'DEBIT' && t.description.toLowerCase().includes('withdrawal'))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalTransferred = myTransactions
    .filter(t => t.type === 'DEBIT' && (t.description.toLowerCase().includes('transfer') || t.description.toLowerCase().includes('handover')))
    .reduce((sum, t) => sum + t.amount, 0);

  const [activeTab, setActiveTab] = useState<'HISTORY' | 'WITHDRAW' | 'TRANSFER' | 'ADD_MONEY'>('HISTORY');
  
  // Form States
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [recipientId, setRecipientId] = useState('');
  
  // Feedback State
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Show PIN logic
  const [showPin, setShowPin] = useState(false);

  // PERMISSIONS
  // 1. Only Showroom, Measurement, Admin, INVESTOR, BOOKING MASTER can ADD MONEY (Self Load)
  const canAddMoney = currentUser?.role === WorkerRole.SHOWROOM || 
                      currentUser?.role === WorkerRole.MEASUREMENT || 
                      currentUser?.role === WorkerRole.ADMIN || 
                      currentUser?.role === WorkerRole.INVESTOR || 
                      currentUser?.role === WorkerRole.BOOKING_MASTER;
  
  // 2. Only ADMIN can TRANSFER (ID to ID)
  const canTransfer = currentUser?.role === WorkerRole.ADMIN;

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!currentUser) return;
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
        setMsg({ type: 'error', text: 'Please enter a valid amount.' });
        return;
    }

    if (amount > balance) {
        setMsg({ type: 'error', text: 'Insufficient wallet balance.' });
        return;
    }

    const res = withdrawFunds(currentUser.id, amount);
    
    if (res.success) {
        setMsg({ type: 'success', text: `Withdrawal request of ₹${amount} successful!` });
        setWithdrawAmount('');
    } else {
        setMsg({ type: 'error', text: res.message });
    }
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!currentUser) return;

    if (!canTransfer) {
        setMsg({ type: 'error', text: 'Permission Denied. Only Admin can transfer funds.' });
        return;
    }

    const amount = parseFloat(transferAmount);
    if (!recipientId.trim()) {
        setMsg({ type: 'error', text: 'Please enter Recipient ID.' });
        return;
    }
    if (recipientId === currentUser.id) {
        setMsg({ type: 'error', text: 'Cannot transfer to yourself.' });
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        setMsg({ type: 'error', text: 'Please enter a valid amount.' });
        return;
    }
    if (amount > balance) {
        setMsg({ type: 'error', text: 'Insufficient wallet balance.' });
        return;
    }

    const res = transferFunds(currentUser.id, recipientId, amount);
    
    if (res.success) {
        setMsg({ type: 'success', text: `₹${amount} transferred to ${recipientId} successfully!` });
        setTransferAmount('');
        setRecipientId('');
    } else {
        setMsg({ type: 'error', text: res.message });
    }
  };

  const handleAddMoney = (source: string) => {
      setMsg(null);
      if (!currentUser) return;

      const amount = parseFloat(addAmount);
      if (isNaN(amount) || amount <= 0) {
          setMsg({ type: 'error', text: 'Please enter a valid amount.' });
          return;
      }

      addFunds(currentUser.id, amount, source);
      setMsg({ type: 'success', text: `₹${amount} added via ${source} successfully!` });
      setAddAmount('');
  };

  return (
    <div className="space-y-6 mt-8 animate-fade-in">
      
      {/* --- 4 WALLET CARDS GRID --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. MAIN WALLET (Current Balance) */}
          <div className="bg-gradient-to-br from-neutral-900 to-black p-5 rounded-xl border border-gold-600 shadow-[0_0_15px_rgba(234,179,8,0.2)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-30 transition-opacity">
                  <Wallet className="h-12 w-12 text-gold-500" />
              </div>
              <p className="text-[10px] text-gold-500 uppercase font-bold tracking-widest mb-1">Main Wallet</p>
              <p className="text-neutral-400 text-[10px] mb-2">Current Balance</p>
              <div className="flex items-center text-white font-mono text-2xl font-bold">
                  <IndianRupee className="h-5 w-5 mr-1 text-gold-500" />
                  {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
          </div>

          {/* 2. INCOME WALLET (Total Earnings) */}
          <div className="bg-neutral-900 p-5 rounded-xl border border-green-900/50 hover:border-green-600/50 transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="h-12 w-12 text-green-500" />
              </div>
              <p className="text-[10px] text-green-500 uppercase font-bold tracking-widest mb-1">Income Wallet</p>
              <p className="text-neutral-400 text-[10px] mb-2">Total Earnings (Lifetime)</p>
              <div className="flex items-center text-white font-mono text-xl font-bold">
                  <IndianRupee className="h-4 w-4 mr-1 text-green-500" />
                  {totalIncome.toLocaleString()}
              </div>
          </div>

          {/* 3. WITHDRAWAL WALLET (Total Cash Out) */}
          <div className="bg-neutral-900 p-5 rounded-xl border border-red-900/50 hover:border-red-600/50 transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ArrowDownLeft className="h-12 w-12 text-red-500" />
              </div>
              <p className="text-[10px] text-red-500 uppercase font-bold tracking-widest mb-1">Withdrawal Wallet</p>
              <p className="text-neutral-400 text-[10px] mb-2">Total Withdrawn</p>
              <div className="flex items-center text-white font-mono text-xl font-bold">
                  <IndianRupee className="h-4 w-4 mr-1 text-red-500" />
                  {totalWithdrawn.toLocaleString()}
              </div>
          </div>

          {/* 4. FUND TRANSFER WALLET (Total Sent) */}
          <div className="bg-neutral-900 p-5 rounded-xl border border-blue-900/50 hover:border-blue-600/50 transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Send className="h-12 w-12 text-blue-500" />
              </div>
              <p className="text-[10px] text-blue-500 uppercase font-bold tracking-widest mb-1">Transfer Wallet</p>
              <p className="text-neutral-400 text-[10px] mb-2">Total Fund Sent</p>
              <div className="flex items-center text-white font-mono text-xl font-bold">
                  <IndianRupee className="h-4 w-4 mr-1 text-blue-500" />
                  {totalTransferred.toLocaleString()}
              </div>
          </div>
      </div>

      {/* --- ACTIONS SECTION --- */}
      <div className="glass-panel p-6 border border-neutral-800 rounded-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
                <div className="bg-neutral-800 p-2 rounded-full">
                    <RefreshCw className="h-5 w-5 text-neutral-400" />
                </div>
                <h3 className="text-lg font-serif text-white">Wallet Actions</h3>
            </div>

            {/* PIN DISPLAY */}
            <div className="bg-black/50 p-2 px-4 rounded-lg border border-neutral-700 flex flex-col items-center cursor-pointer hover:border-gold-500 transition-colors self-end md:self-auto" onClick={() => setShowPin(!showPin)}>
                <p className="text-[9px] text-neutral-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                    <KeyRound className="h-3 w-3" /> Secret Cash PIN
                </p>
                <p className="text-white font-mono font-bold text-lg tracking-widest">
                    {showPin ? (currentUser?.walletPin || '****') : '••••'}
                </p>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-neutral-800 pb-1 overflow-x-auto">
            <button 
            onClick={() => { setActiveTab('HISTORY'); setMsg(null); }} 
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'HISTORY' ? 'text-gold-500 border-b-2 border-gold-500' : 'text-neutral-500 hover:text-white'}`}
            >
                <History className="h-3 w-3" /> History
            </button>
            
            {canAddMoney && (
                <button 
                    onClick={() => { setActiveTab('ADD_MONEY'); setMsg(null); }} 
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'ADD_MONEY' ? 'text-gold-500 border-b-2 border-gold-500' : 'text-neutral-500 hover:text-white'}`}
                >
                    <PlusCircle className="h-3 w-3" /> Add Funds
                </button>
            )}

            {canTransfer && (
                <button 
                onClick={() => { setActiveTab('TRANSFER'); setMsg(null); }} 
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'TRANSFER' ? 'text-gold-500 border-b-2 border-gold-500' : 'text-neutral-500 hover:text-white'}`}
                >
                    <Send className="h-3 w-3" /> Transfer (Admin)
                </button>
            )}

            <button 
            onClick={() => { setActiveTab('WITHDRAW'); setMsg(null); }} 
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'WITHDRAW' ? 'text-gold-500 border-b-2 border-gold-500' : 'text-neutral-500 hover:text-white'}`}
            >
                <ArrowDownLeft className="h-3 w-3" /> Withdraw
            </button>
        </div>
        
        {/* Messages */}
        {msg && (
            <div className={`mb-4 p-3 rounded text-sm font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-900/20 text-green-500 border border-green-900' : 'bg-red-900/20 text-red-500 border border-red-900'}`}>
                {msg.type === 'success' ? <CheckCircle2 className="h-4 w-4"/> : <AlertCircle className="h-4 w-4"/>}
                {msg.text}
            </div>
        )}

        {/* Content Area */}
        <div className="min-h-[200px]">
            
            {/* HISTORY TAB */}
            {activeTab === 'HISTORY' && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {myTransactions.length === 0 ? (
                    <div className="text-center py-10 bg-neutral-900/30 rounded-lg border border-neutral-800 border-dashed">
                        <History className="h-8 w-8 text-neutral-600 mx-auto mb-2" />
                        <p className="text-neutral-500 text-sm">No transactions yet.</p>
                    </div>
                ) : (
                    myTransactions.map(txn => (
                    <div key={txn.id} className="flex justify-between items-center p-3 bg-neutral-900/50 rounded border border-neutral-800 hover:border-gold-900 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${txn.type === 'CREDIT' ? 'bg-green-900/20 text-green-500' : 'bg-red-900/20 text-red-500'}`}>
                                {txn.type === 'CREDIT' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                            </div>
                            <div>
                                <p className="text-white text-sm font-bold group-hover:text-gold-500 transition-colors">{txn.description}</p>
                                <p className="text-[10px] text-neutral-500 font-mono">{txn.date} • {txn.timestamp}</p>
                            </div>
                        </div>
                        <div className={`font-mono font-bold ${txn.type === 'CREDIT' ? 'text-green-500' : 'text-red-500'}`}>
                            {txn.type === 'CREDIT' ? '+' : '-'} ₹{txn.amount.toFixed(2)}
                        </div>
                    </div>
                    ))
                )}
                </div>
            )}

            {/* ADD MONEY TAB (Restored for Showroom/Measurement/Investor) */}
            {activeTab === 'ADD_MONEY' && (
                <div className="flex flex-col md:flex-row gap-8 items-start animate-fade-in">
                    <div className="w-full md:w-1/2 space-y-4">
                        <div>
                            <label className="text-xs text-neutral-400 uppercase font-bold block mb-2">Amount to Add (₹)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={addAmount} 
                                    onChange={e => setAddAmount(e.target.value)} 
                                    className="w-full bg-black border border-neutral-700 text-white pl-10 p-3 rounded-lg focus:border-gold-500 focus:outline-none font-mono text-lg placeholder-neutral-700" 
                                    placeholder="0.00"
                                    min="1"
                                    step="0.01"
                                />
                                <IndianRupee className="absolute left-3 top-4 h-4 w-4 text-neutral-500" />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => handleAddMoney('PhonePe')}
                                disabled={!addAmount}
                                className="bg-[#5f259f] hover:bg-[#4a1d7c] text-white font-bold py-3 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Smartphone className="h-4 w-4" /> PhonePe
                            </button>
                            <button 
                                onClick={() => handleAddMoney('Google Pay')}
                                disabled={!addAmount}
                                className="bg-white hover:bg-gray-200 text-black font-bold py-3 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="text-blue-500 font-bold text-lg">G</span>Pay
                            </button>
                        </div>
                    </div>
                    
                    <div className="w-full md:w-1/2 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 text-sm text-neutral-400">
                        <h4 className="text-green-500 font-bold mb-2 uppercase text-xs">Digital Wallet Load</h4>
                        <p className="mb-2">For Showroom, Investors & Partners:</p>
                        <ul className="list-disc pl-4 space-y-2">
                            <li>Use this to add cash collected from customers into your digital wallet.</li>
                            <li>For Investors: Load funds here first, then invest via Investor Panel.</li>
                            <li>Select <b>PhonePe</b> or <b>Google Pay</b> to simulate the transfer source.</li>
                            <li>Funds are instantly available.</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* WITHDRAW TAB */}
            {activeTab === 'WITHDRAW' && (
                <div className="flex flex-col md:flex-row gap-8 items-start animate-fade-in">
                    <form onSubmit={handleWithdraw} className="w-full md:w-1/2 space-y-4">
                        <div>
                        <label className="text-xs text-neutral-400 uppercase font-bold block mb-2">Amount to Withdraw (₹)</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                value={withdrawAmount} 
                                onChange={e => setWithdrawAmount(e.target.value)} 
                                className="w-full bg-black border border-neutral-700 text-white pl-10 p-3 rounded-lg focus:border-gold-500 focus:outline-none font-mono text-lg placeholder-neutral-700" 
                                placeholder="0.00"
                                min="1"
                                step="0.01"
                            />
                            <IndianRupee className="absolute left-3 top-4 h-4 w-4 text-neutral-500" />
                        </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={!withdrawAmount}
                            className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowDownLeft className="h-4 w-4" /> Confirm Withdrawal
                        </button>
                    </form>
                    
                    <div className="w-full md:w-1/2 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 text-sm text-neutral-400">
                        <h4 className="text-gold-500 font-bold mb-2 uppercase text-xs">Withdrawal Rules</h4>
                        <ul className="list-disc pl-4 space-y-2">
                            <li>Minimum withdrawal amount is ₹1.00.</li>
                            <li>Requests are processed within 24 hours.</li>
                            <li>Ensure your bank details are updated in your Profile.</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* TRANSFER TAB (ADMIN ONLY) */}
            {activeTab === 'TRANSFER' && canTransfer && (
                <div className="flex flex-col md:flex-row gap-8 items-start animate-fade-in">
                    <form onSubmit={handleTransfer} className="w-full md:w-1/2 space-y-4">
                        <div>
                        <label className="text-xs text-neutral-400 uppercase font-bold block mb-2">Recipient User ID</label>
                        <input 
                            type="text" 
                            value={recipientId} 
                            onChange={e => setRecipientId(e.target.value)} 
                            className="w-full bg-black border border-neutral-700 text-white p-3 rounded-lg focus:border-gold-500 focus:outline-none font-mono" 
                            placeholder="e.g. STC001"
                        />
                        </div>
                        <div>
                        <label className="text-xs text-neutral-400 uppercase font-bold block mb-2">Amount to Transfer (₹)</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                value={transferAmount} 
                                onChange={e => setTransferAmount(e.target.value)} 
                                className="w-full bg-black border border-neutral-700 text-white pl-10 p-3 rounded-lg focus:border-gold-500 focus:outline-none font-mono text-lg placeholder-neutral-700" 
                                placeholder="0.00"
                                min="1"
                                step="0.01"
                            />
                            <IndianRupee className="absolute left-3 top-4 h-4 w-4 text-neutral-500" />
                        </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={!transferAmount || !recipientId}
                            className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-bold py-3 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="h-4 w-4" /> Send Funds (Admin)
                        </button>
                    </form>
                    
                    <div className="w-full md:w-1/2 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 text-sm text-neutral-400">
                        <h4 className="text-gold-500 font-bold mb-2 uppercase text-xs">Admin Transfer Policy</h4>
                        <ul className="list-disc pl-4 space-y-2">
                            <li>Transfers are instant and irreversible.</li>
                            <li>This feature is restricted to <b>Admin only</b>.</li>
                            <li>Use this to distribute salaries, bonuses, or expense reimbursements.</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
