
import React, { useState, useEffect } from 'react';
import { useData } from '../DataContext';
import { Crown, ArrowRight, Loader2, KeyRound, User, AlertCircle, HelpCircle, X, Shield, Lock, Eye, EyeOff, UserPlus, Link as LinkIcon, Check, Database, Settings, CloudOff, WifiOff } from 'lucide-react';
import { WorkerRole } from '../types';
import { DatabaseConfigModal } from './DatabaseConfigModal';

export const Login: React.FC = () => {
  const { login, resetPassword, addNewUser, isOfflineMode } = useData();
  const [view, setView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  
  // Login State
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register State
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regRole, setRegRole] = useState<WorkerRole>(WorkerRole.STITCHING);
  const [regPassword, setRegPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  // Modals
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false); // New DB Modal State
  const [resetId, setResetId] = useState('');
  const [resetStatus, setResetStatus] = useState<{success: boolean, message: string} | null>(null);

  // Check for Referral Code & SYNC Config in URL
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      
      // 1. Referral Handler
      const ref = params.get('ref');
      if (ref) {
          setReferralCode(ref.replace('REF-', '')); 
          setView('REGISTER');
      }

      // 2. MAGIC SYNC HANDLER (Auto-Connect Database)
      const syncCode = params.get('sync');
      if (syncCode) {
          try {
              const jsonStr = atob(syncCode);
              const config = JSON.parse(jsonStr);
              if (config.apiKey && config.projectId) {
                  localStorage.setItem('LB_FIREBASE_CONFIG', JSON.stringify(config));
                  alert("🚀 System Connected Successfully!\n\nReloading to sync data...");
                  // Clear query param to clean URL
                  window.history.replaceState({}, document.title, window.location.pathname);
                  window.location.reload();
              }
          } catch (e) {
              console.error("Sync failed", e);
          }
      }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !password) {
        setError('Please enter both User ID and Password');
        return;
    }
    setLoading(true);
    setError('');
    
    try {
        const success = await login(userId, password);
        if (!success) {
            if (isOfflineMode) {
                // If ID is one of the Demo IDs, it should have worked via INITIAL_USERS.
                // If it failed, it means user entered something else.
                setError('ID not found locally. To sync with other phones, click "Offline Mode" above and connect Database.');
            } else {
                setError('Invalid Credentials. Please try again.');
            }
        }
    } catch (e: any) {
        console.error("Login Error:", e);
        setError('Login failed. Please try again.');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!regName || !regMobile || !regPassword) {
          setError('Please fill all required fields.');
          return;
      }
      setLoading(true);
      
      // Determine ID based on Role (Simple Logic)
      let prefix = 'USR';
      if(regRole === WorkerRole.SHOWROOM) prefix = 'MGR';
      if(regRole === WorkerRole.CUTTING) prefix = 'CUT';
      if(regRole === WorkerRole.MEASUREMENT) prefix = 'MST';
      if(regRole === WorkerRole.BOOKING_MASTER) prefix = 'AGT';
      if(regRole === WorkerRole.INVESTOR) prefix = 'INV';
      
      // Generate a simpler ID for manual entry
      const randomId = `${prefix}${Math.floor(100 + Math.random() * 900)}`; 
      
      const newUser = {
          id: randomId, 
          name: regName,
          mobile: regMobile,
          role: regRole,
          password: regPassword,
          referredBy: referralCode ? (referralCode.startsWith('REF') ? referralCode.replace('REF-','') : referralCode) : undefined,
          referralCode: `REF-${randomId}`, // Their new code
          totalReferralEarnings: 0
      };

      await addNewUser(newUser);
      
      setRegSuccess(true);
      setLoading(false);
      
      // Auto-switch to login after 2s
      setTimeout(() => {
          setUserId(newUser.id);
          setPassword(newUser.password);
          setView('LOGIN');
          setRegSuccess(false);
          setError(''); // Clear any errors
          alert(`Registration Successful! Your ID is: ${newUser.id}`);
      }, 1500);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      const res = await resetPassword(resetId);
      setResetStatus(res);
      setLoading(false);
  };

  const copyCredential = (id: string, pass: string) => {
      setUserId(id);
      setPassword(pass);
      setShowDemoModal(false);
      setError('');
  };

  // Expanded Demo Data List with All Karigar Types
  const DEMO_CREDENTIALS = [
      { role: WorkerRole.ADMIN, id: 'ADM001', pass: '123456', label: 'Admin (Owner)' },
      { role: WorkerRole.SHOWROOM, id: 'MGR001', pass: '123456', label: 'Showroom Manager' },
      { role: WorkerRole.INVESTOR, id: 'INV001', pass: '123456', label: 'Investor (Partner)' }, // ADDED HERE
      { role: WorkerRole.BOOKING_MASTER, id: 'AGT001', pass: '123456', label: 'Booking Master (Referral Agent)' },
      { role: WorkerRole.MEASUREMENT, id: 'MST001', pass: '123456', label: 'Measurement Master' },
      { role: WorkerRole.CUTTING, id: 'CUT001', pass: '123456', label: 'Cutting Master' },
      { role: WorkerRole.MATERIAL, id: 'MAT001', pass: '123456', label: 'Material Manager' }, 
      
      // Specific Makers
      { role: WorkerRole.SHIRT_MAKER, id: 'SHIRT_A', pass: '123456', label: 'Shirt Maker (A-Grade)' },
      { role: WorkerRole.PANT_MAKER, id: 'PANT_A', pass: '123456', label: 'Pant Maker (A-Grade)' },
      { role: WorkerRole.COAT_MAKER, id: 'COAT_A', pass: '123456', label: 'Coat Maker' },
      { role: WorkerRole.SAFARI_MAKER, id: 'SAFARI_A', pass: '123456', label: 'Safari Maker' },
      { role: WorkerRole.SHERWANI_MAKER, id: 'SHERWANI_A', pass: '123456', label: 'Sherwani Maker' },
      
      { role: WorkerRole.STITCHING, id: 'STC001', pass: '123456', label: 'Stitching Head' },
      { role: WorkerRole.KAJ_BUTTON, id: 'K_BTN', pass: '123456', label: 'Kaj Button Wala' },
      { role: WorkerRole.FINISHING, id: 'FIN001', pass: '123456', label: 'Finishing (Paresh)' },
      { role: WorkerRole.DELIVERY, id: 'DEL001', pass: '123456', label: 'Delivery Boy' },
  ];

  return (
    <>
      <DatabaseConfigModal isOpen={showDbModal} onClose={() => setShowDbModal(false)} />

      {/* --- OFFLINE WARNING BANNER --- */}
      {isOfflineMode && (
        <div 
            onClick={() => setShowDbModal(true)}
            className="fixed top-0 left-0 right-0 bg-red-600/90 backdrop-blur text-white font-bold p-4 text-center cursor-pointer hover:bg-red-700 z-[120] flex flex-col md:flex-row items-center justify-center gap-2 shadow-xl animate-fade-in border-b border-red-400"
        >
            <div className="flex items-center gap-2">
                <CloudOff className="h-6 w-6" />
                <span className="uppercase tracking-wider">OFFLINE MODE ACTIVE</span>
            </div>
            <span className="text-xs md:text-sm font-normal opacity-90">
                Tap here to sync with other devices via Magic Link.
            </span>
        </div>
      )}

      {/* --- DEMO CREDENTIALS MODAL --- */}
      {showDemoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in">
            <div className="bg-neutral-900 border border-gold-600 rounded-2xl w-full max-w-lg shadow-[0_0_50px_-10px_rgba(234,179,8,0.5)] max-h-[85vh] flex flex-col">
                <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-gold-900/20 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                            <div className="bg-gold-500 p-1.5 rounded text-black">
                                <Shield className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-serif text-white font-bold">Demo Access IDs</h3>
                                <p className="text-[10px] text-gold-500 uppercase tracking-widest">Select to Login</p>
                            </div>
                    </div>
                    <button onClick={() => setShowDemoModal(false)} className="p-2 bg-neutral-800 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"><X className="h-5 w-5" /></button>
                </div>
                <div className="p-4 overflow-y-auto custom-scrollbar flex-1 bg-black/50">
                    <div className="grid gap-3">
                        {DEMO_CREDENTIALS.map((cred) => (
                            <button 
                                key={cred.id}
                                onClick={() => copyCredential(cred.id, cred.pass)}
                                className="flex items-center justify-between p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-gold-500 hover:bg-neutral-800 hover:shadow-lg transition-all group text-left relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-neutral-800 group-hover:bg-gold-500 transition-colors"></div>
                                <div>
                                    <p className="text-white text-base font-bold group-hover:text-gold-400 mb-1">{cred.label}</p>
                                    <div className="flex items-center gap-3 text-xs font-mono">
                                        <span className="bg-neutral-800 text-gold-500 px-2 py-0.5 rounded border border-neutral-700">ID: {cred.id}</span>
                                        <span className="text-neutral-500">Pass: {cred.pass}</span>
                                    </div>
                                </div>
                                <div className="bg-gold-600/10 p-2 rounded-full group-hover:bg-gold-600 group-hover:text-black transition-colors text-gold-600">
                                    <ArrowRight className="h-5 w-5" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- FORGOT PASSWORD MODAL --- */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in">
            <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Lock className="h-5 w-5 text-gold-500" /> Recover Password
                        </h3>
                        <button onClick={() => { setShowForgotModal(false); setResetStatus(null); }} className="text-neutral-500 hover:text-white"><X className="h-5 w-5" /></button>
                    </div>
                    
                    {!resetStatus ? (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="text-xs text-neutral-500 uppercase font-bold block mb-1">Staff ID</label>
                                <input 
                                    type="text" 
                                    value={resetId}
                                    onChange={(e) => setResetId(e.target.value)}
                                    className="w-full bg-black border border-neutral-700 text-white p-3 rounded-lg focus:border-gold-500 focus:outline-none"
                                    placeholder="e.g. ADM001"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setShowForgotModal(false); setResetStatus(null); }} className="flex-1 bg-neutral-800 text-white py-3 rounded-lg font-bold text-sm">Cancel</button>
                                <button type="submit" disabled={loading} className="flex-1 bg-gold-600 text-black py-3 rounded-lg font-bold text-sm hover:bg-gold-500">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Send Reset Link'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="text-center py-4">
                            <div className={`inline-block p-3 rounded-full mb-3 ${resetStatus.success ? 'bg-green-900/20 text-green-500' : 'bg-red-900/20 text-red-500'}`}>
                                {resetStatus.success ? <Shield className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
                            </div>
                            <p className={`font-bold mb-6 ${resetStatus.success ? 'text-green-500' : 'text-red-500'}`}>{resetStatus.message}</p>
                            <button onClick={() => { setShowForgotModal(false); setResetStatus(null); setResetId(''); }} className="w-full bg-neutral-800 text-white py-3 rounded-lg font-bold text-sm">Close</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* --- MAIN SCREEN --- */}
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500 perspective-[2000px]">
          {/* Background FX */}
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-20 pointer-events-none"></div>
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gold-600/10 rounded-full blur-[120px] transition-colors duration-500 animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-gold-900/10 rounded-full blur-[100px] transition-colors duration-500"></div>

          <div className="w-full max-w-md bg-neutral-900/80 border-t border-l border-white/10 backdrop-blur-2xl p-8 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)] relative z-10 animate-float transform-style-3d">
              
              {/* TOP RIGHT ACTIONS */}
              <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => setShowDbModal(true)}
                    className={`p-2 rounded-full transition-colors border ${isOfflineMode ? 'bg-red-900/20 text-red-500 border-red-500 animate-pulse' : 'bg-neutral-800 text-neutral-400 hover:text-white border-transparent'}`}
                    title="Database Setup"
                  >
                      {isOfflineMode ? <WifiOff className="h-5 w-5"/> : <Settings className="h-5 w-5" />}
                  </button>
              </div>

              <div className="text-center mb-8 transform translate-z-10">
                  <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-700 mb-4 shadow-lg shadow-gold-500/30 transition-colors duration-500">
                      <Crown className="h-10 w-10 text-black drop-shadow-md" />
                  </div>
                  <h1 className="text-4xl font-serif text-white tracking-wide drop-shadow-lg">LORD'S <span className="gold-gradient-text font-bold">BESPOKE</span></h1>
                  <p className="text-neutral-400 text-[10px] uppercase tracking-[0.4em] mt-2 font-bold">
                      {view === 'LOGIN' ? 'Secure Staff Access' : 'New Member Registration'}
                  </p>
              </div>

              {/* TABS */}
              <div className="flex bg-neutral-800/50 p-1 rounded-xl mb-6">
                  <button 
                    onClick={() => setView('LOGIN')}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${view === 'LOGIN' ? 'bg-gold-600 text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                  >
                      Login
                  </button>
                  <button 
                    onClick={() => setView('REGISTER')}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${view === 'REGISTER' ? 'bg-gold-600 text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                  >
                      Register / Join
                  </button>
              </div>

              {error && (
                  <div className="mb-4 bg-red-900/20 border border-red-500/30 text-red-400 p-3 rounded-lg text-center text-xs font-bold animate-pulse flex flex-col items-center justify-center gap-2">
                      <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</div>
                      {error.includes('locally') && (
                          <button onClick={() => setShowDbModal(true)} className="mt-1 text-[10px] underline hover:text-white">Click to Connect & Sync Database</button>
                      )}
                  </div>
              )}

              {/* LOGIN FORM */}
              {view === 'LOGIN' && (
                  <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
                      <div className="space-y-2">
                          <label className="text-[10px] text-gold-500 uppercase font-bold tracking-wider ml-1">User ID / Email</label>
                          <div className="relative group">
                              <User className="absolute left-4 top-3.5 h-5 w-5 text-neutral-500 group-focus-within:text-gold-500 transition-colors" />
                              <input 
                                  type="text" 
                                  value={userId}
                                  onChange={(e) => setUserId(e.target.value)}
                                  placeholder="e.g. ADM001"
                                  className="w-full bg-black/60 border border-neutral-700 text-white pl-12 pr-4 py-4 rounded-xl focus:border-gold-500 focus:bg-black focus:outline-none transition-all text-sm font-mono tracking-wider shadow-inner"
                              />
                          </div>
                      </div>

                      <div className="space-y-2">
                          <div className="flex justify-between items-center">
                              <label className="text-[10px] text-gold-500 uppercase font-bold tracking-wider ml-1">Password</label>
                              <button type="button" onClick={() => setShowForgotModal(true)} className="text-[10px] text-neutral-500 hover:text-white transition-colors">Forgot Password?</button>
                          </div>
                          <div className="relative group">
                              <KeyRound className="absolute left-4 top-3.5 h-5 w-5 text-neutral-500 group-focus-within:text-gold-500 transition-colors" />
                              <input 
                                  type={showPassword ? "text" : "password"}
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="••••••"
                                  className="w-full bg-black/60 border border-neutral-700 text-white pl-12 pr-12 py-4 rounded-xl focus:border-gold-500 focus:bg-black focus:outline-none transition-all text-lg tracking-widest shadow-inner"
                              />
                              <button 
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-4 top-3.5 text-neutral-500 hover:text-white"
                              >
                                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                          </div>
                      </div>
                      
                      <button 
                          type="submit" 
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black font-bold py-4 rounded-xl shadow-[0_10px_20px_-5px_rgba(234,179,8,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(234,179,8,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                          {loading ? <Loader2 className="animate-spin" /> : <>Access System <ArrowRight className="h-4 w-4" /></>}
                      </button>
                  </form>
              )}

              {/* REGISTER FORM */}
              {view === 'REGISTER' && (
                  <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
                      {referralCode && (
                          <div className="bg-gold-900/20 text-gold-500 p-3 rounded-lg border border-gold-900/50 flex items-center gap-2 text-xs font-bold mb-4">
                              <LinkIcon className="h-4 w-4" /> Joining via Referral: {referralCode}
                          </div>
                      )}
                      
                      {regSuccess ? (
                          <div className="py-8 text-center">
                              <div className="bg-green-500/20 text-green-500 p-4 rounded-full inline-block mb-4">
                                  <Check className="h-8 w-8" />
                              </div>
                              <h3 className="text-white font-bold text-xl">Welcome Aboard!</h3>
                              <p className="text-neutral-400 text-sm">Account created successfully.</p>
                          </div>
                      ) : (
                      <>
                          <div>
                              <input 
                                  value={regName}
                                  onChange={e => setRegName(e.target.value)}
                                  placeholder="Full Name"
                                  className="w-full bg-black/60 border border-neutral-700 text-white p-3 rounded-lg focus:border-gold-500 outline-none text-sm"
                              />
                          </div>
                          <div>
                              <input 
                                  value={regMobile}
                                  onChange={e => setRegMobile(e.target.value)}
                                  placeholder="Mobile Number (Your Login ID)"
                                  className="w-full bg-black/60 border border-neutral-700 text-white p-3 rounded-lg focus:border-gold-500 outline-none text-sm font-mono"
                              />
                          </div>
                          <div>
                              <input 
                                  value={regPassword}
                                  onChange={e => setRegPassword(e.target.value)}
                                  placeholder="Create Password"
                                  type="password"
                                  className="w-full bg-black/60 border border-neutral-700 text-white p-3 rounded-lg focus:border-gold-500 outline-none text-sm"
                              />
                          </div>
                          <div>
                              <select 
                                  value={regRole}
                                  onChange={e => setRegRole(e.target.value as WorkerRole)}
                                  className="w-full bg-black/60 border border-neutral-700 text-white p-3 rounded-lg focus:border-gold-500 outline-none text-sm appearance-none"
                              >
                                  {Object.values(WorkerRole).filter(r => r !== WorkerRole.ADMIN).map(role => (
                                      <option key={role} value={role}>{role}</option>
                                  ))}
                              </select>
                          </div>
                          {!referralCode && (
                              <div>
                                  <input 
                                      value={referralCode}
                                      onChange={e => setReferralCode(e.target.value)}
                                      placeholder="Referral Code (Optional)"
                                      className="w-full bg-black/60 border border-neutral-700 text-white p-3 rounded-lg focus:border-gold-500 outline-none text-sm font-mono"
                                  />
                              </div>
                          )}
                          
                          <button 
                              type="submit" 
                              disabled={loading}
                              className="w-full bg-white hover:bg-neutral-200 text-black font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider text-sm mt-4 disabled:opacity-70"
                          >
                              {loading ? <Loader2 className="animate-spin" /> : <>Join Team <UserPlus className="h-4 w-4" /></>}
                          </button>
                      </>
                      )}
                  </form>
              )}

              <div className="mt-8 text-center">
                  <button 
                      onClick={() => setShowDemoModal(true)}
                      className="text-xs font-bold text-gold-500 hover:text-black border border-gold-900/50 hover:border-gold-500 hover:bg-gold-500 px-6 py-3 rounded-full transition-all flex items-center gap-2 mx-auto animate-pulse shadow-[0_0_15px_-5px_rgba(234,179,8,0.5)]"
                  >
                      <HelpCircle className="h-4 w-4" /> View Demo IDs & Passwords
                  </button>
              </div>
              
              <p className="text-center text-neutral-600 text-[10px] mt-6">
                  Authorized Personnel Only. <br/> System Access is Monitored.
              </p>
          </div>
      </div>
    </>
  );
};
