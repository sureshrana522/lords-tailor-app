
import React, { useState } from 'react';
import { useData } from '../DataContext';
import { OrderStatus, Order, Customer, WorkerRole } from '../types';
import { Search, UserPlus, ShoppingBag, CheckCircle2, IndianRupee, Printer, Share2, Crown, Calendar, Scissors, Truck, Shirt, Package, User, Plus, Trash2, ArrowLeft, MapPin, Wallet, CreditCard, QrCode, FileText, Lock } from 'lucide-react';
import { VIP_CATEGORIES } from '../constants';
import { WalletSection } from './WalletSection';

interface CartItem {
  type: string;
  fabric: number;
  qty: number;
  rate: number;
}

export const ShowroomPanel: React.FC = () => {
  const { customers, addCustomer, generateCustomerId, getCustomerByMobile, addOrder, generateBillNumber, orders, settleOrderPayment, currentUser, processWorkerPayout } = useData();
  
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'NEW_ORDER' | 'BILL_VIEW'>('DASHBOARD');
  
  // Dashboard & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [showJobCard, setShowJobCard] = useState(false); // NEW for QR Card

  // New Customer State
  const [newCust, setNewCust] = useState<Partial<Customer>>({
    name: '', mobile: '', address: ''
  });

  // Order State
  const [selectedMobile, setSelectedMobile] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Cart State
  const [currentItemType, setCurrentItemType] = useState<string>('Pant');
  const [currentFabric, setCurrentFabric] = useState<string>('1.20');
  const [currentRate, setCurrentRate] = useState<string>('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  const [vipCat, setVipCat] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [trialDate, setTrialDate] = useState('');
  const [advance, setAdvance] = useState('');

  // Messages
  const [msg, setMsg] = useState('');

  // --- Logic ---

  // STRICT FILTERING: Only show orders created by THIS logged-in user
  const myOrders = orders.filter(o => {
    // 1. Basic Privacy Check: Order must belong to this staff member
    const isMyOrder = o.salesStaffId === currentUser?.id;
    
    // 2. Search Query Logic
    const matchesSearch = (
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        o.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.customerMobile && o.customerMobile.includes(searchQuery))
    );

    // 3. Exclude 'Direct Measurement' (Self-orders by Measurement Master) unless searched explicitly by admin
    const isNotDirect = o.showroomName !== 'Direct Measurement';

    // Allow Admin to see everything, but Showroom sees only theirs
    if (currentUser?.role === WorkerRole.ADMIN) {
        return matchesSearch; 
    }

    return isMyOrder && matchesSearch && isNotDirect;
  });

  const handleSearchCustomer = () => {
    const cust = getCustomerByMobile(selectedMobile);
    if (cust) {
      setSelectedCustomer(cust);
      setMsg('');
    } else {
      setMsg('Customer not found. Please create new customer first.');
      setSelectedCustomer(null);
    }
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name || !newCust.mobile) {
      setMsg('Name and Mobile are required');
      return;
    }
    const id = generateCustomerId();
    const customer: Customer = {
      id,
      name: newCust.name!,
      mobile: newCust.mobile!,
      address: newCust.address || '',
      isNewCustomer: true,
      measurements: {},
      createdAt: new Date().toISOString().split('T')[0]
    };
    addCustomer(customer);
    setMsg(`Customer Created! ID: ${id}`);
    setNewCust({ name: '', mobile: '', address: '' });
    
    setSelectedMobile(customer.mobile);
    setSelectedCustomer(customer);
    setActiveTab('NEW_ORDER');
  };

  const addItemToCart = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentRate) {
          alert("Please enter rate");
          return;
      }
      const newItem: CartItem = {
          type: currentItemType,
          fabric: parseFloat(currentFabric) || 0,
          qty: 1,
          rate: parseFloat(currentRate) || 0
      };
      setCartItems([...cartItems, newItem]);
      setCurrentFabric('');
      setCurrentRate('');
  };

  const removeFromCart = (index: number) => {
      const newCart = [...cartItems];
      newCart.splice(index, 1);
      setCartItems(newCart);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.rate * item.qty), 0);

  const handlePlaceOrder = () => {
    if (!selectedCustomer) {
      setMsg('Please select a customer first');
      return;
    }
    if (cartItems.length === 0) {
        setMsg('Please add items to the bill');
        return;
    }
    
    const baseBillNo = generateBillNumber();
    const total = cartTotal;
    const totalAdv = parseFloat(advance) || 0;

    // --- LOGIC CHANGE: Split Multi-Piece Items (Suits/Pairs) and Create Separate Orders ---
    // Using alphabetical index (A, B, C) to avoid "Quantity" confusion
    let orderIndex = 0; 

    cartItems.forEach((item) => {
        const itemTotal = item.rate * item.qty;
        const itemAdv = (itemTotal / total) * totalAdv; 
        
        let subItems = [{ type: item.type, suffix: item.type }];
        
        // AUTO-SPLIT LOGIC for Suits, Safaris, Pairs
        if (item.type === 'Suit') {
            subItems = [
                { type: 'Coat', suffix: 'Coat' }, 
                { type: 'Pant', suffix: 'Pant' }
            ];
        } else if (item.type === 'Safari') {
             subItems = [
                { type: 'Safari', suffix: 'Safari' }, 
                { type: 'Pant', suffix: 'Pant' }
            ];
        } else if (item.type === 'Shirt & Pant (Pair)') {
             subItems = [
                { type: 'Shirt', suffix: 'Shirt' }, 
                { type: 'Pant', suffix: 'Pant' }
            ];
        } else if (item.type === 'Kurta Pyjama (Set)') {
             subItems = [
                { type: 'Kurta', suffix: 'Kurta' }, 
                { type: 'Pyjama', suffix: 'Pyjama' }
            ];
        }

        subItems.forEach((sub) => {
            // FIX: Use A, B, C suffix instead of 1, 2, 3 so it doesn't look like Quantity
            const alphaSuffix = String.fromCharCode(65 + (orderIndex % 26)); // A, B, C...
            const uniqueBillNo = `${baseBillNo}-${sub.suffix.toUpperCase()}-${alphaSuffix}`;
            
            // Adjust Fabric/Rate for split items (approximate half split for suits/pairs)
            const adjustedFabric = subItems.length > 1 ? item.fabric / 2 : item.fabric;
            const adjustedTotal = subItems.length > 1 ? itemTotal / 2 : itemTotal;
            const adjustedAdv = subItems.length > 1 ? itemAdv / 2 : itemAdv;

            // Generate Unique PIN for each order part
            const secretPin = Math.floor(1000 + Math.random() * 9000).toString();

            const newOrder: Order = {
              billNumber: uniqueBillNo,
              customerId: selectedCustomer.id,
              customerName: selectedCustomer.name,
              customerMobile: selectedCustomer.mobile,
              customerAddress: selectedCustomer.address,
              isNewCustomer: selectedCustomer.isNewCustomer,
              showroomName: "Lord's Main Showroom",
              salesStaffId: currentUser?.id || 'MGR001', // Track who booked for Wallet Deduction later
              orderDate: new Date().toISOString().split('T')[0],
              deliveryDate: deliveryDate,
              trialDate: trialDate || deliveryDate,
              status: OrderStatus.MEASUREMENT,
              items: [`${item.qty} x ${sub.type}`], 
              itemType: sub.type as any, // This ensures it routes to correct karigar (Pant -> Pant Maker)
              fabricAmount: adjustedFabric,
              vipCategory: vipCat,
              payment: {
                totalAmount: adjustedTotal,
                advanceAmount: Math.floor(adjustedAdv),
                pendingAmount: adjustedTotal - Math.floor(adjustedAdv),
                status: adjustedTotal === Math.floor(adjustedAdv) ? 'Paid' : 'Partial'
              },
              history: [{
                status: OrderStatus.PENDING,
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString(),
                description: `Order Booked. Part of Bill ${baseBillNo}`
              }],
              handoverPin: secretPin // STORE THE UNIQUE PIN
            };

            addOrder(newOrder);
            
            // --- COMMISSION LOGIC (10% of Order Value) ---
            if (currentUser) {
                const commissionAmount = adjustedTotal * 0.10; // 10%
                processWorkerPayout(
                    currentUser.id,
                    commissionAmount,
                    `Booking Commission (10%) for ${uniqueBillNo}`,
                    uniqueBillNo
                );
            }

            if (orderIndex === 0) setViewOrder(newOrder); // Show first one
            orderIndex++;
        });
    });

    setMsg(`Order Placed! Commission Credited.`);
    setActiveTab('DASHBOARD'); 

    // Reset Form
    setAdvance('');
    setCartItems([]);
  };

  const handleSettleBalance = () => {
      if (!viewOrder) return;
      const amount = viewOrder.payment.pendingAmount;
      if (amount <= 0) return;

      if (window.confirm(`Confirm collection of remaining balance ₹${amount}?`)) {
          // Showroom collecting their own payment -> goes to their wallet (Credit) or Admin (Credit)?
          // Usually Showroom collects Cash -> Debit Showroom (they hold cash) or Credit Admin.
          // For simplicity in this logic: If Showroom collects, it marks as paid.
          settleOrderPayment(viewOrder.billNumber, amount, currentUser?.name || 'Showroom', currentUser?.id);
          setMsg('Payment Collected Successfully!');
          const updated = orders.find(o => o.billNumber === viewOrder.billNumber);
          if (updated) setViewOrder(updated); 
      }
  };

  const getWhatsAppLink = (order: Order) => {
     // Strip suffix for cleaner message if needed, or keep unique
     const showroom = order.showroomName || "Lord's Bespoke Tailor";
     const text = `*${showroom.toUpperCase()}*\n_Lords Tailor_\n\nHello ${order.customerName},\nThank you for choosing us!\n\n*Item:* ${order.itemType}\n*Tracking ID:* ${order.billNumber}\n*Balance:* ₹${order.payment.pendingAmount}\n\n*Trial:* ${order.trialDate}\n*Delivery:* ${order.deliveryDate}\n\nVisit us again!\n\n_Powered by Lords Tailor_`;
     return `https://wa.me/91${order.customerMobile}?text=${encodeURIComponent(text)}`;
  };

  const getStatusStep = (currentStatus: OrderStatus) => {
    const order = [
        OrderStatus.PENDING, 
        OrderStatus.MEASUREMENT, 
        OrderStatus.CUTTING, 
        OrderStatus.STITCHING, 
        OrderStatus.KAJ_BUTTON, 
        OrderStatus.FINISHING, 
        OrderStatus.READY, 
        OrderStatus.DELIVERED
    ];
    return order.indexOf(currentStatus);
  };

  React.useEffect(() => {
      if (viewOrder) {
          const fresh = orders.find(o => o.billNumber === viewOrder.billNumber);
          if (fresh) setViewOrder(fresh);
      }
  }, [orders]);

  return (
    <div className="space-y-6 animate-fade-in perspective-[1000px]">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif text-white tracking-wide">Showroom <span className="text-gold-500">Panel</span></h2>
          <p className="text-neutral-400 text-sm">Shop Orders, Billing & Status Tracking</p>
        </div>
        <div className="flex bg-neutral-900/50 rounded-xl p-1.5 border border-white/5 backdrop-blur-md">
          <button 
            onClick={() => setActiveTab('DASHBOARD')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'DASHBOARD' ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-black shadow-lg shadow-gold-900/20' : 'text-neutral-400 hover:text-white'}`}
          >
            My Orders
          </button>
          <button 
            onClick={() => { setActiveTab('NEW_ORDER'); setViewOrder(null); }}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'NEW_ORDER' ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-black shadow-lg shadow-gold-900/20' : 'text-neutral-400 hover:text-white'}`}
          >
            + New Bill
          </button>
          {viewOrder && (
             <button 
                onClick={() => setActiveTab('BILL_VIEW')}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'BILL_VIEW' ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-black shadow-lg shadow-gold-900/20' : 'text-neutral-400 hover:text-white'}`}
             >
                View Invoice
             </button>
          )}
        </div>
      </div>

      {msg && (
        <div className="bg-gold-900/20 border border-gold-600/50 p-4 rounded-xl flex items-center gap-3 text-gold-500 animate-fade-in shadow-lg">
          <CheckCircle2 className="h-5 w-5" />
          {msg}
        </div>
      )}

      <WalletSection />

      {/* --- DASHBOARD TAB --- */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
           <div className="relative group">
              <input 
                  type="text" 
                  placeholder="Search by Customer Name, Mobile or Bill No..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-neutral-700 text-white pl-12 pr-4 py-4 rounded-xl focus:border-gold-500 focus:outline-none uppercase transition-all shadow-inner focus:bg-black/60"
              />
              <Search className="absolute left-4 top-4.5 h-5 w-5 text-neutral-500 group-focus-within:text-gold-500 transition-colors" />
           </div>

           <div className="grid gap-6">
              {myOrders.length === 0 ? (
                 <div className="text-center py-20 text-neutral-600 glass-panel rounded-xl">
                    <p>No orders found. Only bookings made by you ({currentUser?.name}) appear here.</p>
                 </div>
              ) : (
                 myOrders.map(order => (
                    <div key={order.billNumber} className="glass-panel p-6 border border-neutral-800 rounded-xl hover:border-gold-600/50 transition-all card-3d">
                       <div className="flex justify-between items-start mb-6">
                          <div>
                             <h3 className="text-2xl font-bold text-white tracking-wide">{order.customerName}</h3>
                             <p className="text-gold-500 font-mono text-sm tracking-wider">{order.billNumber}</p>
                             <p className="text-neutral-500 text-xs mt-1">{order.itemType} • {order.items.join(', ')} • Delivery: {order.deliveryDate}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                              {order.payment.pendingAmount > 0 && (
                                  <span className="text-[10px] bg-red-900/30 text-red-500 px-2 py-1 rounded border border-red-900 font-bold">
                                      Due: ₹{order.payment.pendingAmount}
                                  </span>
                              )}
                              <button 
                                onClick={() => { setViewOrder(order); setActiveTab('BILL_VIEW'); }}
                                className="bg-neutral-800 hover:bg-neutral-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105 border border-white/5"
                              >
                                View Bill
                              </button>
                          </div>
                       </div>

                       {/* Status Progress Bar */}
                       <div className="relative pt-4">
                           <div className="h-1.5 bg-neutral-800 rounded-full mb-6 overflow-hidden">
                               <div 
                                 className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                                 style={{ width: `${(getStatusStep(order.status) / 7) * 100}%` }}
                               ></div>
                           </div>
                           <div className="flex justify-between text-[10px] uppercase text-neutral-500 font-bold tracking-widest">
                               <span className={getStatusStep(order.status) >= 1 ? 'text-gold-500 scale-110 transition-transform' : ''}>Measure</span>
                               <span className={getStatusStep(order.status) >= 2 ? 'text-gold-500 scale-110 transition-transform' : ''}>Cutting</span>
                               <span className={getStatusStep(order.status) >= 3 ? 'text-gold-500 scale-110 transition-transform' : ''}>Stitch</span>
                               <span className={getStatusStep(order.status) >= 6 ? 'text-gold-500 scale-110 transition-transform' : ''}>Finish</span>
                               <span className={getStatusStep(order.status) >= 7 ? 'text-green-500 scale-110 transition-transform' : ''}>Delivered</span>
                           </div>
                       </div>
                    </div>
                 ))
              )}
           </div>
        </div>
      )}

      {/* ... (Rest of the file remains same: NEW_ORDER, BILL_VIEW) ... */}
      {activeTab === 'NEW_ORDER' && (
        <div className="glass-panel p-8 border border-neutral-800 rounded-2xl card-3d">
           <button 
             onClick={() => setActiveTab('DASHBOARD')}
             className="mb-6 text-sm text-neutral-500 hover:text-white flex items-center gap-2 transition-colors"
           >
             <ArrowLeft className="h-4 w-4" /> Back to Dashboard
           </button>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Left Column: Customer Selection */}
              <div>
                  <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-3">
                      <div className="p-2 bg-gold-600/20 rounded-lg text-gold-500"><User className="h-5 w-5"/></div>
                      Customer Details
                  </h3>
                  
                  {/* Search Existing */}
                  <div className="mb-8 bg-black/40 p-6 rounded-xl border border-neutral-800 shadow-inner">
                     <label className="text-xs text-neutral-400 uppercase tracking-wider block mb-3 font-bold">Find Existing Customer</label>
                     <div className="flex gap-3">
                        <input 
                            value={selectedMobile}
                            onChange={(e) => setSelectedMobile(e.target.value)}
                            className="flex-1 bg-black border border-neutral-700 text-white p-3 rounded-lg focus:border-gold-500 focus:outline-none text-sm transition-colors"
                            placeholder="Enter Mobile Number"
                        />
                        <button onClick={handleSearchCustomer} className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 rounded-lg font-bold text-sm transition-colors border border-white/5">Find</button>
                     </div>
                     {selectedCustomer && (
                        <div className="mt-4 p-3 bg-green-900/10 text-green-500 text-sm rounded-lg border border-green-900/30 flex items-center gap-2 animate-fade-in">
                           <CheckCircle2 className="h-5 w-5" /> Selected: <span className="font-bold">{selectedCustomer.name}</span>
                        </div>
                     )}
                  </div>

                  {/* Or Create New */}
                  {!selectedCustomer && (
                     <div className="border-t border-neutral-800 pt-8">
                        <p className="text-xs text-gold-500 uppercase tracking-wider mb-5 font-bold flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Create New Customer
                        </p>
                        <div className="space-y-4">
                            <input value={newCust.name} onChange={e => setNewCust({...newCust, name: e.target.value})} className="w-full bg-black/50 border border-neutral-700 text-white p-4 rounded-xl focus:border-gold-500 focus:outline-none transition-all" placeholder="Full Name" />
                            <input value={newCust.mobile} onChange={e => setNewCust({...newCust, mobile: e.target.value})} className="w-full bg-black/50 border border-neutral-700 text-white p-4 rounded-xl focus:border-gold-500 focus:outline-none transition-all" placeholder="Mobile Number" />
                            <input value={newCust.address} onChange={e => setNewCust({...newCust, address: e.target.value})} className="w-full bg-black/50 border border-neutral-700 text-white p-4 rounded-xl focus:border-gold-500 focus:outline-none transition-all" placeholder="Address" />
                            <button onClick={handleCreateCustomer} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white p-4 rounded-xl font-bold text-sm transition-colors border border-white/5 shadow-lg">Save New Customer</button>
                        </div>
                     </div>
                  )}
              </div>

              {/* Right Column: Order Details */}
              <div className={!selectedCustomer ? 'opacity-50 pointer-events-none filter blur-sm transition-all' : 'transition-all'}>
                  <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-3">
                      <div className="p-2 bg-gold-600/20 rounded-lg text-gold-500"><ShoppingBag className="h-5 w-5"/></div> 
                      Order Booking
                  </h3>
                  
                  {/* Cart / Add Item System */}
                  <div className="bg-black/40 p-6 rounded-xl border border-neutral-800 mb-6 shadow-inner">
                     <p className="text-xs text-gold-500 uppercase tracking-wider font-bold mb-4">Add Items to Bill</p>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                         <div className="col-span-1">
                            <select value={currentItemType} onChange={(e) => setCurrentItemType(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 text-white p-2.5 rounded-lg text-sm focus:border-gold-500 outline-none">
                                <option value="Pant">Pant</option>
                                <option value="Shirt">Shirt</option>
                                <option value="Shirt & Pant (Pair)">Shirt & Pant (Pair)</option>
                                <option value="Suit">Suit (2-Piece)</option>
                                <option value="Kurta">Kurta</option>
                                <option value="Kurta Pyjama (Set)">Kurta Pyjama (Set)</option>
                                <option value="Safari">Safari</option>
                                <option value="Sherwani">Sherwani</option>
                                <option value="Coat">Coat Only</option>
                            </select>
                         </div>
                         <input type="number" step="0.1" value={currentFabric} onChange={(e) => setCurrentFabric(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 text-white p-2.5 rounded-lg text-sm outline-none focus:border-gold-500" placeholder="Fab(m)" />
                         <input type="number" value={currentRate} onChange={(e) => setCurrentRate(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 text-white p-2.5 rounded-lg text-sm outline-none focus:border-gold-500" placeholder="₹ Price" />
                         <button onClick={addItemToCart} className="bg-gold-600 hover:bg-gold-500 text-black rounded-lg p-2.5 text-sm font-bold flex items-center justify-center shadow-lg transition-colors">
                             <Plus className="h-5 w-5" />
                         </button>
                     </div>
                     
                     {/* Cart List */}
                     <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg mb-4 overflow-hidden">
                        {cartItems.length === 0 ? (
                            <p className="text-center text-xs text-neutral-600 py-4 italic">No items added to cart yet.</p>
                        ) : (
                            <table className="w-full text-xs text-neutral-300">
                                <thead className="bg-neutral-800/50">
                                    <tr className="text-neutral-500 uppercase tracking-wider">
                                        <th className="p-3 text-left">Item</th>
                                        <th className="p-3 text-right">Meters</th>
                                        <th className="p-3 text-right">Price</th>
                                        <th className="p-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cartItems.map((item, idx) => (
                                        <tr key={idx} className="border-b border-neutral-800 last:border-0 hover:bg-neutral-800/30 transition-colors">
                                            <td className="p-3 font-bold">{item.type}</td>
                                            <td className="p-3 text-right">{item.fabric}</td>
                                            <td className="p-3 text-right text-gold-500 font-mono">₹{item.rate}</td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => removeFromCart(idx)} className="text-red-500 hover:text-red-400 p-1 hover:bg-red-900/20 rounded transition-colors">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                     </div>
                     <div className="flex justify-between items-center text-lg font-bold text-white pt-2 border-t border-neutral-800">
                         <span>Subtotal</span>
                         <span className="text-gold-500 font-mono">₹ {cartTotal}</span>
                     </div>
                  </div>

                  <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                           <div>
                              <label className="text-xs text-neutral-500 uppercase block mb-2 font-bold">Trial Date</label>
                              <input type="date" value={trialDate} onChange={(e) => setTrialDate(e.target.value)} className="w-full bg-black/50 border border-neutral-700 text-white p-3 rounded-lg focus:border-gold-500 focus:outline-none transition-all" />
                           </div>
                           <div>
                              <label className="text-xs text-neutral-500 uppercase block mb-2 font-bold">Delivery Date</label>
                              <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="w-full bg-black/50 border border-neutral-700 text-white p-3 rounded-lg focus:border-gold-500 focus:outline-none transition-all" />
                           </div>
                      </div>
                      
                      <div>
                          <label className="text-xs text-neutral-500 uppercase block mb-2 font-bold">VIP Category</label>
                          <select value={vipCat} onChange={(e) => setVipCat(e.target.value)} className="w-full bg-black/50 border border-neutral-700 text-white p-3 rounded-lg focus:border-gold-500 focus:outline-none transition-all">
                                <option value="">-- Standard --</option>
                                {VIP_CATEGORIES.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
                          </select>
                      </div>

                      <div className="bg-gradient-to-br from-neutral-900 to-black p-6 rounded-xl border border-gold-900/30 grid grid-cols-2 gap-6 shadow-lg">
                          <div>
                            <label className="text-xs text-gold-500 uppercase font-bold block mb-2">Total Amount</label>
                            <div className="text-2xl font-mono text-white font-bold">₹ {cartTotal}</div>
                          </div>
                          <div>
                            <label className="text-xs text-gold-500 uppercase font-bold block mb-2">Advance Paid (₹)</label>
                            <input type="number" value={advance} onChange={(e) => setAdvance(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 text-white p-3 rounded-lg focus:border-gold-500 focus:outline-none font-mono font-bold text-lg text-right" placeholder="0" />
                          </div>
                      </div>

                      <button onClick={handlePlaceOrder} className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-bold py-4 rounded-xl transition-all shadow-[0_10px_30px_-10px_rgba(234,179,8,0.4)] hover:scale-[1.02] active:scale-[0.98]">
                          Book Order & Generate Bill
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* --- BILL VIEW TAB (Same as previous) --- */}
      {activeTab === 'BILL_VIEW' && viewOrder && (
          <div className="flex flex-col items-center animate-fade-in">
              <div className="w-full max-w-md mb-4 flex justify-between">
                   <button 
                     onClick={() => setActiveTab('DASHBOARD')}
                     className="text-sm text-neutral-500 hover:text-white flex items-center gap-2 transition-colors"
                   >
                     <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                   </button>
                   <button
                        onClick={() => setShowJobCard(!showJobCard)}
                        className={`text-sm font-bold flex items-center gap-2 transition-colors ${showJobCard ? 'text-gold-500' : 'text-neutral-400 hover:text-white'}`}
                   >
                       {showJobCard ? <><FileText className="h-4 w-4"/> Show Bill</> : <><QrCode className="h-4 w-4"/> Show Job Card</>}
                   </button>
              </div>

              {showJobCard ? (
                  // Job Card
                  <div className="bg-white text-black p-6 max-w-md w-full shadow-2xl rounded-sm relative overflow-hidden mb-8 border-4 border-black" id="printable-job-card">
                        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
                            <div>
                                <h1 className="text-2xl font-black uppercase">JOB CARD</h1>
                                <p className="text-xs font-bold mt-1">Lords Bespoke Tailor</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-3xl font-mono font-bold">{viewOrder.billNumber.split('-')[2]}</h2>
                                <p className="text-[10px] uppercase font-bold">Token No</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-6">
                            <div className="w-32 h-32 border-2 border-black p-1">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${viewOrder.billNumber}`} 
                                    alt="QR" 
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="text-right flex-1 pl-4">
                                <p className="text-sm font-bold uppercase mb-1">{viewOrder.customerName}</p>
                                <p className="text-xs mb-2">Del: {viewOrder.deliveryDate}</p>
                                <div className="text-xl font-black uppercase border-2 border-black inline-block px-2 py-1">
                                    {viewOrder.itemType}
                                </div>
                            </div>
                        </div>

                        <div className="border-t-2 border-black pt-4">
                            <p className="text-xs font-bold uppercase mb-2">Instructions:</p>
                            <div className="border border-dashed border-gray-400 p-2 min-h-[80px] text-xs leading-relaxed">
                                {viewOrder.items.join(', ')} <br/>
                                Note: {viewOrder.notes || 'No special notes.'}
                            </div>
                        </div>
                  </div>
              ) : (
                  // Bill
                  <div className="bg-white text-black p-10 max-w-md w-full shadow-2xl rounded-sm relative overflow-hidden mb-8 transform-style-3d hover:scale-[1.01] transition-transform duration-500" id="printable-bill">
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                          <Crown className="h-72 w-72 text-black" />
                      </div>
                      <div className="absolute inset-0 border-4 border-double border-neutral-200 pointer-events-none m-3"></div>

                      <div className="text-center pb-6 mb-6 border-b-2 border-black relative z-10">
                          <h1 className="text-3xl font-serif font-bold tracking-wide uppercase">{viewOrder.showroomName || "LORD'S BESPOKE TAILOR"}</h1>
                          <div className="flex items-center justify-center gap-2 mt-2">
                            <Crown className="h-4 w-4 text-neutral-800" />
                            <p className="text-sm tracking-[0.2em] uppercase font-bold text-black">Lords Tailor</p>
                            <Crown className="h-4 w-4 text-neutral-800" />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 text-xs mb-8 font-mono relative z-10">
                          <div>
                              <p className="font-bold uppercase text-neutral-500 mb-1">Bill To:</p>
                              <p className="font-bold text-sm uppercase">{viewOrder.customerName}</p>
                              <p>{viewOrder.customerMobile}</p>
                              {viewOrder.customerAddress && (
                                  <p className="mt-1 flex items-start gap-1">
                                    <MapPin className="h-3 w-3 mt-0.5" /> {viewOrder.customerAddress}
                                  </p>
                              )}
                          </div>
                          <div className="text-right">
                              <p className="font-bold uppercase text-neutral-500 mb-1">Invoice No:</p>
                              <p className="font-bold text-sm">{viewOrder.billNumber}</p>
                              <p>{viewOrder.orderDate}</p>
                          </div>
                      </div>

                      <table className="w-full text-xs mb-8 border-collapse relative z-10">
                          <thead className="border-b-2 border-black">
                              <tr>
                                  <th className="text-left py-2 font-bold uppercase tracking-wider">Description</th>
                                  <th className="text-right py-2 font-bold uppercase tracking-wider">Qty</th>
                                  <th className="text-right py-2 font-bold uppercase tracking-wider">Amount</th>
                              </tr>
                          </thead>
                          <tbody>
                              {viewOrder.items.map((item, idx) => (
                                  <tr key={idx} className="border-b border-neutral-100">
                                      <td className="py-3">
                                          <span className="font-bold block text-sm">{item}</span>
                                          {idx === 0 && <span className="text-neutral-500 text-[9px] uppercase tracking-wide">{viewOrder.vipCategory || 'Bespoke Fit'}</span>}
                                      </td>
                                      <td className="text-right py-3">1</td>
                                      <td className="text-right py-3">{viewOrder.payment.totalAmount}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>

                      <div className="border-t-2 border-black pt-4 mb-8 relative z-10">
                          <div className="flex justify-between mb-2">
                              <span className="text-sm font-bold uppercase">Total Amount</span>
                              <span className="text-sm font-bold">₹{viewOrder.payment.totalAmount}</span>
                          </div>
                          <div className="flex justify-between mb-2 text-xs text-neutral-600">
                              <span className="uppercase">Advance Paid</span>
                              <span className="">₹{viewOrder.payment.advanceAmount}</span>
                          </div>
                          <div className="flex justify-between text-xl font-bold mt-4 pt-4 border-t border-dashed border-neutral-400">
                              <span className="uppercase">Balance Due</span>
                              <span>₹{viewOrder.payment.pendingAmount}</span>
                          </div>
                      </div>
                      
                      {/* SECRET PIN DISPLAY - RESTRICTED */}
                      {viewOrder.payment.pendingAmount > 0 && viewOrder.handoverPin && (currentUser?.id === viewOrder.salesStaffId) && (
                          <div className="bg-gray-100 border-2 border-dashed border-gray-400 p-4 text-center mb-6 relative z-10">
                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 flex items-center justify-center gap-1">
                                  <Lock className="h-3 w-3" /> Secret Delivery PIN
                              </p>
                              <p className="text-2xl font-mono font-bold tracking-[0.3em]">{viewOrder.handoverPin}</p>
                              <p className="text-[9px] text-gray-400 italic mt-1">(Only visible to you. Share upon cash collection.)</p>
                          </div>
                      )}

                      <div className="text-center pt-4 relative z-10">
                          <p className="text-[12px] text-black font-serif italic font-bold mb-2">" Lords Tailor "</p>
                          <p className="text-[10px] text-neutral-400 uppercase tracking-[0.2em] border-t border-black pt-4">Bespoke Elegance</p>
                      </div>
                  </div>
              )}

              <div className="flex gap-4 mb-8">
                  <a 
                    href={getWhatsAppLink(viewOrder)}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-900/30 transition-all hover:-translate-y-1"
                  >
                      <Share2 className="h-5 w-5" /> Share on WhatsApp
                  </a>
                  <button 
                    onClick={() => window.print()} 
                    className="bg-neutral-800 hover:bg-neutral-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:-translate-y-1 border border-white/10"
                  >
                      <Printer className="h-5 w-5" /> Print {showJobCard ? 'Card' : 'Bill'}
                  </button>
              </div>
          </div>
      )}

    </div>
  );
};
