
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { Customer, Order, OrderStatus, User, WorkerRole, InventoryItem, Measurements, Transaction, NetworkLevel, TeamMember, ReferralIncomeLog, Notification, Announcement, ManagerRank, Investment } from './types';
import { MOCK_ORDERS, MOCK_INVENTORY, REFERRAL_LEVELS as INITIAL_REFERRAL_LEVELS, REFERRAL_DEDUCTION_PERCENT, PAYOUT_RATES as INITIAL_PAYOUT_RATES, MANAGER_RANK_RULES } from './constants';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';

// Helper to remove undefined values recursively
const sanitize = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => sanitize(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      if (obj[key] !== undefined) {
        acc[key] = sanitize(obj[key]);
      }
      return acc;
    }, {} as any);
  }
  return obj;
};

// --- LOCAL STORAGE HELPERS ---
const saveToLocal = (key: string, data: any) => {
    try {
        localStorage.setItem(`LB_${key}`, JSON.stringify(data));
    } catch (e) {
        console.error("Local Save Error", e);
    }
};

const loadFromLocal = (key: string) => {
    try {
        const data = localStorage.getItem(`LB_${key}`);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
};

interface DataContextType {
  currentUser: User | null;
  allUsers: User[]; 
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  resetPassword: (identifier: string) => Promise<{success: boolean, message: string}>;
  orders: Order[];
  customers: Customer[];
  inventory: InventoryItem[];
  notifications: Notification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  
  addOrder: (order: Order) => void;
  deleteOrder: (billNumber: string) => void;
  updateOrderStatus: (billNumber: string, status: OrderStatus, description?: string, workerId?: string, workerName?: string) => void;
  addOrderLog: (billNumber: string, description: string) => void;
  updateOrderNotes: (billNumber: string, notes: string) => void;
  updateOrderVoiceNotes: (billNumber: string, voiceNote: string) => void; 
  updateOrderVipCategory: (billNumber: string, vipCategory: string) => void;
  updateOrderPriority: (billNumber: string, priority: 'High' | 'Medium' | 'Low') => void;
  settleOrderPayment: (billNumber: string, amount: number, collectedBy: string, deductFromUserId?: string) => void;
  verifyCashHandover: (billNumber: string, amount: number, pin: string, deliveryBoyId: string) => { success: boolean, message: string }; 

  addCustomer: (customer: Customer) => void;
  updateCustomerMeasurements: (customerId: string, measurements: Measurements) => void;
  updateCustomerPhoto: (customerId: string, photo: string) => void;
  generateCustomerId: () => string;
  generateBillNumber: () => string;
  getCustomerByMobile: (mobile: string) => Customer | undefined;
  updateUserProfile: (userId: string, data: Partial<User>) => void;
  addNewUser: (user: User) => Promise<void>;
  editUser: (userId: string, data: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  
  // Inventory
  addInventoryItem: (item: InventoryItem) => void;

  // Financials
  userBalances: { [userId: string]: number };
  transactions: Transaction[];
  addTransaction: (userId: string, amount: number, type: 'CREDIT' | 'DEBIT', description: string, relatedBillNumber?: string) => void;
  processWorkerPayout: (workerId: string, grossAmount: number, description: string, relatedBillNumber?: string) => void;
  transferFunds: (fromUserId: string, toUserId: string, amount: number) => { success: boolean, message: string };
  withdrawFunds: (userId: string, amount: number) => { success: boolean, message: string };
  addFunds: (userId: string, amount: number, source: string) => void;

  // Investment
  investments: Investment[];
  createInvestment: (userId: string, amount: number) => { success: boolean, message: string };
  distributeDailyDividends: (dailyCompanyProfit: number) => { success: boolean, message: string, distributed: number };

  // Network / Referral
  calculateNetworkStats: (userId: string) => NetworkLevel[];
  getTeamMembers: (userId: string) => TeamMember[];
  getReferralIncomeLogs: (userId: string) => ReferralIncomeLog[];
  getReferralCode: (userId: string) => string;
  claimReferralRewards: () => { success: boolean, amount: number, message: string };
  
  // Manager Stats
  getManagerStats: (managerId: string) => { currentRank: ManagerRank, nextRank: any, dailyBusiness: number, monthlyBusiness: number, totalShowrooms: number, progress: number, structureStatus?: string[] };

  // Admin Settings (Dynamic Rates)
  payoutRates: typeof INITIAL_PAYOUT_RATES;
  referralLevels: typeof INITIAL_REFERRAL_LEVELS;
  updatePayoutRates: (newRates: typeof INITIAL_PAYOUT_RATES) => void;
  updateReferralLevels: (newLevels: typeof INITIAL_REFERRAL_LEVELS) => void;

  // Broadcast System
  activeAnnouncement: Announcement | null;
  publishAnnouncement: (text: string, imageUrl?: string) => void;
  clearAnnouncement: () => void;

  // DANGER ZONE
  resetSystemData: () => void;

  loadingAuth: boolean;
  isOfflineMode: boolean; // Indicates if we are running on LocalStorage
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial Data with Default Password '123456'
const INITIAL_USERS: User[] = [
  // --- ADMIN ---
  { id: 'ADM001', name: 'Lord Admin', mobile: '9999999999', role: WorkerRole.ADMIN, password: '123456', email: 'admin@lords.com', referralCode: 'LORD001', totalReferralEarnings: 45000, walletPin: '9999' },
  { id: 'MGR001', name: 'Showroom Manager', mobile: '8888888888', role: WorkerRole.SHOWROOM, password: '123456', email: 'manager@lords.com', walletPin: '1234' },
  { id: 'CUT001', name: 'Masterji Cutting', mobile: '7777777777', role: WorkerRole.CUTTING, password: '123456', email: 'cutting@lords.com' },
  { id: 'DEL001', name: 'Raju Delivery', mobile: '5555555555', role: WorkerRole.DELIVERY, password: '123456', email: 'delivery@lords.com' },
  { id: 'STC001', name: 'Karigar Head', mobile: '6666666666', role: WorkerRole.STITCHING, password: '123456', email: 'stitching@lords.com' },
  { id: 'INV001', name: 'Golden Investor', mobile: '1111111111', role: WorkerRole.INVESTOR, password: '123456', email: 'invest@lords.com', walletPin: '1234' },
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  // Initialize State - GUARANTEE Demo Users are present
  const [allUsers, setAllUsers] = useState<User[]>(() => {
      const local = loadFromLocal('USERS');
      // If local storage is empty or corrupted, fallback to INITIAL_USERS
      return (local && local.length > 0) ? local : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  
  const [orders, setOrders] = useState<Order[]>(() => loadFromLocal('ORDERS') || []);
  const [customers, setCustomers] = useState<Customer[]>(() => loadFromLocal('CUSTOMERS') || []);
  const [inventory, setInventory] = useState<InventoryItem[]>(() => loadFromLocal('INVENTORY') || MOCK_INVENTORY);
  const [notifications, setNotifications] = useState<Notification[]>([]); 
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadFromLocal('TRANSACTIONS') || []);
  const [referralLogs, setReferralLogs] = useState<ReferralIncomeLog[]>(() => loadFromLocal('REF_LOGS') || []);
  const [investments, setInvestments] = useState<Investment[]>(() => loadFromLocal('INVESTMENTS') || []);

  const [userBalances, setUserBalances] = useState<{ [userId: string]: number }>(() => {
      const txns = loadFromLocal('TRANSACTIONS') || [];
      const balances: {[key:string]: number} = {};
      txns.forEach((t: Transaction) => {
          balances[t.userId] = (balances[t.userId] || 0) + (t.type === 'CREDIT' ? t.amount : -t.amount);
      });
      return balances;
  });

  const [payoutRates, setPayoutRates] = useState(INITIAL_PAYOUT_RATES);
  const [referralLevels, setReferralLevels] = useState(INITIAL_REFERRAL_LEVELS);
  const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null);

  // --- DATA LOADING & SYNC ---
  useEffect(() => {
    // Check if Config Exists BEFORE starting
    const hasConfig = localStorage.getItem('LB_FIREBASE_CONFIG');
    
    // Attempt to connect to Firestore
    let unsubUsers = () => {};
    let unsubOrders = () => {};
    let unsubCust = () => {};
    let unsubTxn = () => {};
    let unsubInv = () => {};
    let unsubRef = () => {};
    let unsubInvest = () => {};

    const startFirestoreSync = () => {
        if (!hasConfig) {
            console.log("No Firebase Config found. Starting in Offline Mode.");
            setIsOfflineMode(true);
            return;
        }

        try {
            unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
                if (!snapshot.empty) {
                    const loaded = snapshot.docs.map(doc => doc.data() as User);
                    setAllUsers(loaded.length > 0 ? loaded : INITIAL_USERS);
                } else {
                    // Seed if empty
                    INITIAL_USERS.forEach(u => setDoc(doc(db, 'users', u.id), sanitize(u)));
                }
                setIsOfflineMode(false); // Connection Successful
            }, (err) => {
                console.warn("Firestore Error (Users): Switching to Offline Mode", err);
                setIsOfflineMode(true);
            });

            unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
                const loaded = snapshot.docs.map(d => d.data() as Order);
                setOrders(loaded.sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
            }, () => setIsOfflineMode(true));

            unsubCust = onSnapshot(collection(db, "customers"), (snapshot) => {
                setCustomers(snapshot.docs.map(d => d.data() as Customer));
            }, () => setIsOfflineMode(true));

            unsubTxn = onSnapshot(collection(db, "transactions"), (snapshot) => {
                const txns = snapshot.docs.map(d => d.data() as Transaction);
                txns.sort((a,b) => new Date(b.date + ' ' + b.timestamp).getTime() - new Date(a.date + ' ' + a.timestamp).getTime());
                setTransactions(txns);
                const balances: {[key:string]: number} = {};
                txns.forEach(t => {
                    balances[t.userId] = (balances[t.userId] || 0) + (t.type === 'CREDIT' ? t.amount : -t.amount);
                });
                setUserBalances(balances);
            }, () => setIsOfflineMode(true));

            unsubInv = onSnapshot(collection(db, "inventory"), (s) => {
               if(!s.empty) setInventory(s.docs.map(d => d.data() as InventoryItem));
            }, () => setIsOfflineMode(true));

            unsubRef = onSnapshot(collection(db, "referralLogs"), (s) => {
               setReferralLogs(s.docs.map(d => d.data() as ReferralIncomeLog));
            }, () => setIsOfflineMode(true));

            unsubInvest = onSnapshot(collection(db, "investments"), (s) => {
               setInvestments(s.docs.map(d => d.data() as Investment));
            }, () => setIsOfflineMode(true));

        } catch (e) {
            console.error("Firestore Init Failed", e);
            setIsOfflineMode(true);
        }
    };

    startFirestoreSync();

    return () => {
        unsubUsers(); unsubOrders(); unsubCust(); unsubTxn(); unsubInv(); unsubRef(); unsubInvest();
    };
  }, []);

  // --- PERSIST TO LOCAL STORAGE (ALWAYS) ---
  useEffect(() => {
      saveToLocal('USERS', allUsers);
      saveToLocal('ORDERS', orders);
      saveToLocal('CUSTOMERS', customers);
      saveToLocal('TRANSACTIONS', transactions);
      saveToLocal('INVENTORY', inventory);
      saveToLocal('REF_LOGS', referralLogs);
      saveToLocal('INVESTMENTS', investments);
  }, [allUsers, orders, customers, transactions, inventory, referralLogs, investments]);

  // --- LOCAL STORAGE (Settings/Notifs) - Always Local ---
  useEffect(() => {
      const stored = localStorage.getItem('LB_NOTIFICATIONS');
      if (stored) { try { setNotifications(JSON.parse(stored)); } catch(e) {} }
      const storedAnnounce = localStorage.getItem('LB_ANNOUNCEMENT');
      if (storedAnnounce) { try { setActiveAnnouncement(JSON.parse(storedAnnounce)); } catch(e) {} }
  }, []);

  useEffect(() => {
      localStorage.setItem('LB_NOTIFICATIONS', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
      if (activeAnnouncement) localStorage.setItem('LB_ANNOUNCEMENT', JSON.stringify(activeAnnouncement));
      else localStorage.removeItem('LB_ANNOUNCEMENT');
  }, [activeAnnouncement]);


  // --- AUTH ---
  const login = async (identifier: string, password: string): Promise<boolean> => {
    setLoadingAuth(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const user = allUsers.find(u => (u.id === identifier || u.email === identifier || u.mobile === identifier) && u.password === password);
    setLoadingAuth(false);
    if (user) { setCurrentUser(user); return true; }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const resetPassword = async (identifier: string) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const user = allUsers.find(u => u.id === identifier || u.email === identifier);
      if (user) return { success: true, message: `Recovery link sent.` };
      return { success: false, message: "User ID not found." };
  };

  // --- GENERIC UPDATE HELPER ---
  const updateData = async (collectionName: string, id: string, data: any, isDelete = false) => {
      // If offline, we just return (State is already updated optimistically and saved to LS by useEffect)
      if (isOfflineMode) {
          return; 
      }
      // If Online, we also push to Firestore
      try {
          if (isDelete) await deleteDoc(doc(db, collectionName, id));
          else await setDoc(doc(db, collectionName, id), sanitize(data), { merge: true });
      } catch (e) {
          console.error(`DB Error (${collectionName}):`, e);
      }
  };

  // --- ACTIONS ---

  const addNewUser = async (user: User) => {
    const userData = {
        ...user,
        password: user.password || '123456',
        email: user.email || `${user.id.toLowerCase()}@lords.com`,
        walletPin: '1234',
        managerRank: user.role === WorkerRole.MANAGER ? ManagerRank.ASSOCIATE : undefined
    };
    
    // Optimistic Update
    setAllUsers(prev => [...prev, userData]);
    
    await updateData('users', userData.id, userData);
  };

  const editUser = async (userId: string, data: Partial<User>) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    await updateData('users', userId, data);
  };

  const deleteUser = async (userId: string) => {
      setAllUsers(prev => prev.filter(u => u.id !== userId));
      await updateData('users', userId, null, true);
  };

  const updateUserProfile = (userId: string, data: Partial<User>) => {
    editUser(userId, data);
    if (currentUser && currentUser.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, ...data } : null);
    }
  };

  const addOrder = async (order: Order) => {
    const orderWithShowroom = { ...order, showroomName: order.showroomName || "Lord's Main Showroom" };
    
    setOrders(prev => [orderWithShowroom, ...prev]);
    await updateData('orders', order.billNumber, orderWithShowroom);
    
    // Notifications & Logic
    const showroom = allUsers.find(u => u.id === order.salesStaffId);
    if (showroom && showroom.referredBy) checkManagerRankUpgrade(showroom.referredBy);
    if (currentUser?.role !== WorkerRole.MEASUREMENT) {
        sendNotification('New Order Booked', `Customer ${order.customerName} waiting for measurement.`, order.billNumber, WorkerRole.MEASUREMENT);
    }
  };
  
  const deleteOrder = async (billNumber: string) => {
      setOrders(prev => prev.filter(o => o.billNumber !== billNumber));
      await updateData('orders', billNumber, null, true);
  };
  
  const updateOrderStatus = async (billNumber: string, status: OrderStatus, description?: string, workerId?: string, workerName?: string) => {
    const order = orders.find(o => o.billNumber === billNumber);
    if (!order) return;

    const updatedOrder = {
        ...order,
        status,
        assignedWorkerId: workerId || order.assignedWorkerId,
        assignedWorkerName: workerName || order.assignedWorkerName,
        history: [...(order.history || []), {
            status, 
            date: new Date().toISOString().split('T')[0], 
            time: new Date().toLocaleTimeString(), 
            description, 
            updatedBy: currentUser?.name
        }]
    };

    setOrders(prev => prev.map(o => o.billNumber === billNumber ? updatedOrder : o));
    await updateData('orders', billNumber, updatedOrder);
        
    if (status === OrderStatus.CUTTING) {
        if (workerId) sendNotification('Ready for Cutting', `Assigned to you.`, billNumber, undefined, workerId);
        else sendNotification('Ready for Cutting', `Waiting for Cutting Master.`, billNumber, WorkerRole.CUTTING);
    }
  };

  const addOrderLog = async (billNumber: string, description: string) => {
    const order = orders.find(o => o.billNumber === billNumber);
    if(order) {
        const updated = {
            ...order,
            history: [...(order.history || []), {
                status: order.status,
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString(),
                description,
                updatedBy: currentUser?.name
            }]
        };
        setOrders(prev => prev.map(o => o.billNumber === billNumber ? updated : o));
        await updateData('orders', billNumber, updated);
    }
  };

  const updateOrderNotes = async (billNumber: string, notes: string) => {
    setOrders(prev => prev.map(o => o.billNumber === billNumber ? { ...o, notes } : o));
    await updateData('orders', billNumber, { notes });
  };

  const updateOrderVoiceNotes = async (billNumber: string, voiceNote: string) => {
      const order = orders.find(o => o.billNumber === billNumber);
      if(order) {
          const updated = { ...order, voiceNotes: [voiceNote, ...(order.voiceNotes || [])] };
          setOrders(prev => prev.map(o => o.billNumber === billNumber ? updated : o));
          await updateData('orders', billNumber, updated);
      }
  };

  const updateOrderVipCategory = async (billNumber: string, vipCategory: string) => {
      setOrders(prev => prev.map(o => o.billNumber === billNumber ? { ...o, vipCategory } : o));
      await updateData('orders', billNumber, { vipCategory });
  };
  
  const updateOrderPriority = async (billNumber: string, priority: 'High' | 'Medium' | 'Low') => {
      setOrders(prev => prev.map(o => o.billNumber === billNumber ? { ...o, priority } : o));
      await updateData('orders', billNumber, { priority });
  };

  const settleOrderPayment = async (billNumber: string, amount: number, collectedBy: string, deductFromUserId?: string) => {
      const order = orders.find(o => o.billNumber === billNumber);
      if(order) {
          const newTotalPaid = order.payment.advanceAmount + amount;
          const newPending = order.payment.totalAmount - newTotalPaid;
          const updated = {
              ...order,
              payment: {
                  ...order.payment,
                  advanceAmount: newTotalPaid,
                  pendingAmount: newPending,
                  status: newPending <= 0 ? 'Paid' : 'Partial'
              },
              history: [...(order.history || []), {
                  status: order.status,
                  date: new Date().toISOString().split('T')[0],
                  time: new Date().toLocaleTimeString(),
                  description: `Payment Collected: ₹${amount} by ${collectedBy}`,
                  updatedBy: collectedBy
              }]
          };
          
          setOrders(prev => prev.map(o => o.billNumber === billNumber ? updated : o));
          await updateData('orders', billNumber, updated);
          
          addTransaction('ADM001', amount, 'CREDIT', `Payment Collected for Bill ${billNumber} by ${collectedBy}`, billNumber);
          
          if (deductFromUserId) {
              const showroom = allUsers.find(u => u.id === deductFromUserId);
              if (showroom && showroom.referredBy) checkManagerRankUpgrade(showroom.referredBy);
          }
      }
  };

  const verifyCashHandover = (billNumber: string, amount: number, pin: string, deliveryBoyId: string) => {
      const order = orders.find(o => o.billNumber === billNumber);
      if (!order) return { success: false, message: 'Order not found' };

      const targetUserId = order.salesStaffId || 'MGR001'; 
      const targetUser = allUsers.find(u => u.id === targetUserId);
      if (!targetUser) return { success: false, message: 'Showroom Staff not found' };

      const correctPin = order.handoverPin || targetUser.walletPin || '1234'; 
      if (pin !== correctPin) return { success: false, message: 'Invalid Secret PIN.' };

      addTransaction(targetUserId, amount, 'DEBIT', `Cash Handover to Admin (via Delivery Boy ${deliveryBoyId})`, billNumber);
      addTransaction('ADM001', amount, 'CREDIT', `Funds Received from ${targetUser.name}`, billNumber);

      settleOrderPayment(billNumber, amount, 'Delivery Boy (Verified)', undefined);
      updateOrderStatus(billNumber, OrderStatus.DELIVERED, `Delivered & Cash Verified`);

      return { success: true, message: 'Handover Verified! Funds Transferred.' };
  };

  const addCustomer = async (customer: Customer) => {
      setCustomers(prev => [...prev, customer]);
      await updateData('customers', customer.id, customer);
  };
  
  const updateCustomerMeasurements = async (cid: string, m: Measurements) => {
      const cust = customers.find(c => c.id === cid);
      if(cust) {
          const updated = { ...cust, measurements: { ...cust.measurements, ...m } };
          setCustomers(prev => prev.map(c => c.id === cid ? updated : c));
          await updateData('customers', cid, updated);
      }
  };
  
  const updateCustomerPhoto = async (cid: string, p: string) => {
      const cust = customers.find(c => c.id === cid);
      if(cust) {
          const updated = { ...cust, measurementImage: p };
          setCustomers(prev => prev.map(c => c.id === cid ? updated : c));
          await updateData('customers', cid, updated);
      }
  };

  const generateCustomerId = () => `CUST-${new Date().getFullYear()}-${(customers.length + 1).toString().padStart(3, '0')}`;
  const generateBillNumber = () => `ORD-${new Date().getFullYear()}-${(orders.length + 1).toString().padStart(3, '0')}`;
  const getCustomerByMobile = (m: string) => customers.find(c => c.mobile === m);

  // --- FINANCIALS ---
  const addTransaction = async (userId: string, amount: number, type: 'CREDIT' | 'DEBIT', description: string, relatedBillNumber?: string) => {
    const newTxn: Transaction = {
      id: `TXN-${Date.now()}-${Math.floor(Math.random()*1000)}`, 
      userId, amount, type, description, 
      date: new Date().toISOString().split('T')[0], 
      timestamp: new Date().toLocaleTimeString(), 
      relatedBillNumber
    };
    
    setTransactions(prev => [newTxn, ...prev]);
    setUserBalances(prev => ({ ...prev, [userId]: (prev[userId] || 0) + (type === 'CREDIT' ? amount : -amount) }));
    
    await updateData('transactions', newTxn.id, newTxn);
  };

  const processWorkerPayout = (workerId: string, grossAmount: number, description: string, relatedBillNumber?: string) => {
      const deduction = grossAmount * REFERRAL_DEDUCTION_PERCENT;
      const netAmount = grossAmount - deduction;
      addTransaction(workerId, netAmount, 'CREDIT', `${description} (Net)`, relatedBillNumber);
      if (deduction > 0) distributeReferralRewards(workerId, deduction, description);
  };

  const distributeReferralRewards = async (sourceUserId: string, totalPot: number, action: string) => {
    let currentMember = allUsers.find(u => u.id === sourceUserId);
    if (!currentMember) return;

    let uplineId = currentMember.referredBy;
    let level = 1;
    
    while (uplineId && level <= 6) {
        const uplineUser = allUsers.find(u => u.id === uplineId);
        if (!uplineUser) break;

        const levelConfig = referralLevels.find(l => l.level === level);
        if (!levelConfig) break;

        const commission = totalPot * (levelConfig.percent / 100);
        
        if (commission > 0) {
            // Add Log
            const log: ReferralIncomeLog = {
                id: `REF-${Date.now()}-${level}`,
                recipientId: uplineId,
                fromUserName: currentMember.name,
                fromUserRole: currentMember.role,
                action: action,
                level: level,
                amount: commission,
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString()
            };
            
            // Optimistic update for logs
            setReferralLogs(prev => [...prev, log]);
            
            // Add funds to user earnings
            const newTotal = (uplineUser.totalReferralEarnings || 0) + commission;
            await editUser(uplineId, { totalReferralEarnings: newTotal });
            
            await updateData('referralLogs', log.id, log);
        }
        uplineId = uplineUser.referredBy;
        level++;
    }
  };

  const transferFunds = (from: string, to: string, amt: number) => {
    const sender = allUsers.find(u => u.id === from);
    if (!sender || sender.role !== WorkerRole.ADMIN) return { success: false, message: 'Permission Denied.' };
    if ((userBalances[from] || 0) < amt) return { success: false, message: 'Insufficient funds' };
    addTransaction(from, amt, 'DEBIT', `Transfer to ${to}`);
    addTransaction(to, amt, 'CREDIT', `Received from ${from}`);
    return { success: true, message: 'Transferred' };
  };
  
  const withdrawFunds = (uid: string, amt: number) => {
     if ((userBalances[uid] || 0) < amt) return { success: false, message: 'Insufficient funds' };
     addTransaction(uid, amt, 'DEBIT', 'Withdrawal');
     return { success: true, message: 'Withdrawn' };
  };

  const addFunds = (userId: string, amount: number, source: string) => {
      addTransaction(userId, amount, 'CREDIT', `Wallet Load (${source})`);
  };

  const addInventoryItem = async (item: InventoryItem) => {
      setInventory(prev => [item, ...prev]);
      await updateData('inventory', item.id, item);
  };

  // --- INVESTMENT LOGIC ---
  const createInvestment = (userId: string, amount: number) => {
      if ((userBalances[userId] || 0) < amount) return { success: false, message: 'Insufficient Wallet Balance' };
      
      // Deduct from Wallet
      addTransaction(userId, amount, 'DEBIT', `New Investment Plan Started`);

      const newInv: Investment = {
          id: `INV-${Date.now()}`,
          userId,
          principalAmount: amount,
          totalTargetReturn: amount * 3, // 3X RETURN
          returnedSoFar: 0,
          status: 'ACTIVE',
          startDate: new Date().toISOString().split('T')[0]
      };

      setInvestments(prev => [...prev, newInv]);
      updateData('investments', newInv.id, newInv);
      
      return { success: true, message: `Investment of ₹${amount} successful! Target: ₹${newInv.totalTargetReturn}` };
  };

  const distributeDailyDividends = (dailyCompanyProfit: number) => {
      const distributionPool = dailyCompanyProfit * 0.01; // 1% of Company Profit
      
      // Filter Active Investors
      const activeInvestments = investments.filter(inv => inv.status === 'ACTIVE');
      if (activeInvestments.length === 0) return { success: false, message: 'No active investors found.', distributed: 0 };

      const totalActivePrincipal = activeInvestments.reduce((sum, inv) => sum + inv.principalAmount, 0);
      
      if (totalActivePrincipal <= 0) return { success: false, message: 'Total active principal is zero.', distributed: 0 };

      let totalDistributed = 0;

      const updates = activeInvestments.map(inv => {
          // Share based on proportion of total investment pool
          const share = (inv.principalAmount / totalActivePrincipal) * distributionPool;
          
          // Check Cap
          let payout = share;
          const remainingCap = inv.totalTargetReturn - inv.returnedSoFar;
          
          if (payout > remainingCap) {
              payout = remainingCap;
          }

          if (payout > 0) {
              // Pay to Wallet
              addTransaction(inv.userId, payout, 'CREDIT', `Daily Dividend (1% Pool Share)`);
              
              const newReturned = inv.returnedSoFar + payout;
              const newStatus = newReturned >= inv.totalTargetReturn ? 'COMPLETED' : 'ACTIVE';
              
              totalDistributed += payout;

              return { ...inv, returnedSoFar: newReturned, status: newStatus, lastPayoutDate: new Date().toISOString().split('T')[0] };
          }
          return inv;
      });

      setInvestments(prev => {
          const updatedList = prev.map(p => {
              const found = updates.find(u => u.id === p.id);
              return found || p;
          });
          // Bulk update firestore ideally, here iterating
          updates.forEach(u => updateData('investments', u.id, u));
          return updatedList;
      });

      return { success: true, message: `Distributed ₹${totalDistributed.toFixed(2)} among investors.`, distributed: totalDistributed };
  };

  // --- MISC ---
  const sendNotification = (title: string, message: string, billNumber: string, recipientRole?: WorkerRole, recipientId?: string) => {
      const newNotif: Notification = {
          id: `NOTIF-${Date.now()}`,
          title, message, relatedBillNumber: billNumber, recipientRole, recipientId,
          timestamp: new Date().toLocaleTimeString(),
          isRead: false
      };
      setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  const markAllNotificationsAsRead = () => {
      if (!currentUser) return;
      setNotifications(prev => prev.map(n => (n.recipientId === currentUser.id || n.recipientRole === currentUser.role) ? { ...n, isRead: true } : n));
  };

  const checkManagerRankUpgrade = (managerId: string) => { /* Logic */ };
  const getManagerStats = (managerId: string) => { 
      // Simplified offline calc
      const directReferrals = allUsers.filter(u => u.referredBy === managerId && u.role === WorkerRole.SHOWROOM);
      return { currentRank: ManagerRank.ASSOCIATE, nextRank: null, dailyBusiness: 0, monthlyBusiness: 0, totalShowrooms: directReferrals.length, progress: 0 }; 
  }; 

  const getTeamMembers = (userId: string) => {
    const team: TeamMember[] = [];
    const queue: {id: string, level: number}[] = [{id: userId, level: 0}];
    const visited = new Set<string>(); // Prevent infinite loops
    visited.add(userId);

    while(queue.length > 0) {
        const current = queue.shift()!;
        if(current.level > 0) { // Don't add self
            const user = allUsers.find(u => u.id === current.id);
            if(user) {
                team.push({ id: user.id, name: user.name, role: user.role, level: current.level, joinDate: '2025' });
            }
        }
        
        if (current.level < 10) {
            // Find direct referrals of current node
            const reports = allUsers.filter(u => u.referredBy === current.id);
            reports.forEach(r => { 
                if(!visited.has(r.id)) { 
                    visited.add(r.id); 
                    queue.push({id: r.id, level: current.level + 1}); 
                } 
            });
        }
    }
    return team;
  };

  const getReferralIncomeLogs = (userId: string) => referralLogs.filter(l => l.recipientId === userId).sort((a,b) => b.id.localeCompare(a.id));
  const getReferralCode = (uid: string) => `REF-${uid}`;
  
  const calculateNetworkStats = (userId: string) => {
    const stats: NetworkLevel[] = [];
    let currentLevelIds = [userId];
    const visited = new Set<string>([userId]);

    for (let i = 1; i <= 6; i++) { // Calculate up to 6 levels for display
        let nextLevelIds: string[] = [];
        let memberCount = 0;

        // Find all users who were referred by anyone in the current level
        allUsers.forEach(user => {
            if (user.referredBy && currentLevelIds.includes(user.referredBy) && !visited.has(user.id)) {
                nextLevelIds.push(user.id);
                visited.add(user.id);
                memberCount++;
            }
        });

        // Calculate total earnings from logs for this level
        const levelLogs = referralLogs.filter(l => l.recipientId === userId && l.level === i);
        const levelEarnings = levelLogs.reduce((sum, l) => sum + l.amount, 0);

        stats.push({
            level: i,
            memberCount: memberCount,
            totalEarnings: levelEarnings,
            percentage: referralLevels.find(l => l.level === i)?.percent || 0
        });

        currentLevelIds = nextLevelIds;
    }
    
    // Ensure 6 levels are returned for UI consistency
    while(stats.length < 6) {
        const lvl = stats.length + 1;
        stats.push({ level: lvl, memberCount: 0, totalEarnings: 0, percentage: referralLevels.find(l => l.level === lvl)?.percent || 0 });
    }

    return stats;
  };

  const claimReferralRewards = () => { 
      if(!currentUser) return { success: false, amount: 0, message: 'Login required' };
      const total = currentUser.totalReferralEarnings || 0;
      const claimed = currentUser.claimedReferralEarnings || 0;
      const available = total - claimed;
      if(available <= 0) return { success: false, amount: 0, message: 'No funds' };
      
      updateUserProfile(currentUser.id, { claimedReferralEarnings: claimed + available });
      addTransaction(currentUser.id, available, 'CREDIT', 'Referral Payout');
      return {success: true, amount: available, message: 'Claimed!'}; 
  };

  const updatePayoutRates = (r: typeof INITIAL_PAYOUT_RATES) => setPayoutRates(r);
  const updateReferralLevels = (l: typeof INITIAL_REFERRAL_LEVELS) => setReferralLevels(l);
  const publishAnnouncement = (t: string, i?: string) => setActiveAnnouncement({id: `ANN-${Date.now()}`, text: t, imageUrl: i, date: new Date().toLocaleString(), active: true});
  const clearAnnouncement = () => setActiveAnnouncement(null);

  const resetSystemData = async () => {
      // 1. CAPTURE CONFIG (PROTECT IT)
      const savedConfig = localStorage.getItem('LB_FIREBASE_CONFIG');

      // 2. CLEAR STATE
      setOrders([]); setCustomers([]); setTransactions([]); setUserBalances({}); setNotifications([]); setReferralLogs([]); setInventory([]); setInvestments([]);
      
      // 3. CLEAR STORAGE
      localStorage.clear();

      // 4. RESTORE CONFIG IMMEDIATELY
      if (savedConfig) {
          localStorage.setItem('LB_FIREBASE_CONFIG', savedConfig);
      }
      
      // 5. CLEAR DB IF ONLINE
      if (!isOfflineMode) {
          const clearColl = async (name: string) => {
              const q = await getDocs(collection(db, name));
              q.forEach(d => deleteDoc(d.ref));
          };
          await clearColl('orders');
          await clearColl('customers');
          await clearColl('transactions');
          // ... others
      }

      // Reload to ensure state is clean but connected
      window.location.reload();
  };

  const unreadNotificationsCount = useMemo(() => {
      if (!currentUser) return 0;
      return notifications.filter(n => {
          const isForMe = n.recipientId === currentUser.id || n.recipientRole === currentUser.role;
          return !n.isRead && isForMe;
      }).length;
  }, [notifications, currentUser]);

  return (
    <DataContext.Provider value={{
      currentUser, allUsers, login, logout, resetPassword,
      orders, customers, inventory, notifications, unreadNotificationsCount, markNotificationAsRead, markAllNotificationsAsRead,
      addOrder, deleteOrder, updateOrderStatus, addOrderLog, updateOrderVipCategory, updateOrderNotes, updateOrderPriority, settleOrderPayment, updateOrderVoiceNotes, verifyCashHandover,
      addCustomer, updateCustomerMeasurements, updateCustomerPhoto,
      generateCustomerId, generateBillNumber, getCustomerByMobile,
      updateUserProfile, addNewUser, deleteUser, editUser,
      addInventoryItem, 
      userBalances, transactions, addTransaction, processWorkerPayout, transferFunds, withdrawFunds, addFunds,
      investments, createInvestment, distributeDailyDividends,
      calculateNetworkStats, getTeamMembers, getReferralIncomeLogs, getReferralCode, claimReferralRewards,
      getManagerStats,
      payoutRates, referralLevels, updatePayoutRates, updateReferralLevels,
      activeAnnouncement, publishAnnouncement, clearAnnouncement,
      resetSystemData,
      loadingAuth,
      isOfflineMode
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
