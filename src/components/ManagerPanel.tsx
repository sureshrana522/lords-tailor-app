
import React, { useEffect, useState } from 'react';
import { useData } from '../DataContext';
import { ManagerRank, WorkerRole } from '../types';
import { Crown, TrendingUp, Users, DollarSign, Target, Award, Star, Activity, ArrowRight, UserCheck } from 'lucide-react';
import { WalletSection } from './WalletSection';

export const ManagerPanel: React.FC = () => {
  const { currentUser, getManagerStats, allUsers } = useData();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (currentUser) {
      setStats(getManagerStats(currentUser.id));
    }
  }, [currentUser, allUsers]); // Refresh if users or orders change

  if (!currentUser || !stats) return <div className="text-white">Loading Manager Data...</div>;

  const { currentRank, nextRank, dailyBusiness, monthlyBusiness, totalShowrooms, progress, structureStatus } = stats;

  return (
    <div className="space-y-8 animate-fade-in perspective-[1000px]">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
           <div className="flex items-center gap-3">
               <h2 className="text-3xl font-serif text-white tracking-wide">Manager <span className="text-gold-500">Hub</span></h2>
               <span className="bg-gold-600 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                   <Crown className="h-3 w-3" /> {currentRank}
               </span>
           </div>
           <p className="text-neutral-400 text-sm mt-1">Network Performance & Rank Tracking</p>
        </div>
      </div>

      <WalletSection />

      {/* RANK PROGRESS CARD */}
      <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900 via-black to-neutral-900 border border-gold-600/30 p-8 rounded-2xl shadow-2xl card-3d">
          <div className="absolute top-0 right-0 p-6 opacity-10">
              <Award className="h-48 w-48 text-gold-500" />
          </div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                  <h3 className="text-gold-500 text-sm uppercase tracking-[0.3em] font-bold mb-2">Current Status</h3>
                  <h1 className="text-4xl md:text-5xl font-serif text-white mb-6 drop-shadow-lg">{currentRank}</h1>
                  
                  {nextRank ? (
                      <div>
                          <p className="text-neutral-400 text-sm mb-2 flex items-center gap-2">
                              <Target className="h-4 w-4 text-red-500" /> Next Target: <span className="text-white font-bold">{nextRank.rank}</span>
                          </p>
                          <div className="h-4 w-full bg-neutral-800 rounded-full overflow-hidden border border-neutral-700 relative">
                              <div 
                                className="h-full bg-gradient-to-r from-gold-600 via-gold-400 to-white rounded-full transition-all duration-1000 relative"
                                style={{ width: `${Math.min(100, progress)}%` }}
                              >
                                  <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>
                              </div>
                          </div>
                          <p className="text-right text-[10px] text-gold-500 mt-1 font-mono">{progress.toFixed(1)}% Achieved</p>
                      </div>
                  ) : (
                      <div className="text-green-500 font-bold flex items-center gap-2">
                          <Star className="h-5 w-5 fill-current" /> Maximum Rank Achieved!
                      </div>
                  )}
              </div>

              {nextRank && (
                  <div className="bg-black/40 p-6 rounded-xl border border-neutral-800 backdrop-blur-sm">
                      <h4 className="text-white font-bold mb-4 flex items-center gap-2 border-b border-neutral-800 pb-2">
                          <Activity className="h-4 w-4 text-blue-500" /> Requirements for {nextRank.rank}
                      </h4>
                      <div className="space-y-4 text-sm">
                          <div className="flex justify-between items-center">
                              <span className="text-neutral-400">Direct Showrooms</span>
                              <div className="flex items-center gap-2">
                                  <span className={`font-mono font-bold ${totalShowrooms >= nextRank.minShowrooms ? 'text-green-500' : 'text-red-500'}`}>
                                      {totalShowrooms} / {nextRank.minShowrooms}
                                  </span>
                                  {totalShowrooms >= nextRank.minShowrooms && <UserCheck className="h-4 w-4 text-green-500" />}
                              </div>
                          </div>
                          <div className="flex justify-between items-center">
                              <span className="text-neutral-400">Daily Business (Team)</span>
                              <div className="flex items-center gap-2">
                                  <span className={`font-mono font-bold ${dailyBusiness >= nextRank.dailyBusiness ? 'text-green-500' : 'text-neutral-300'}`}>
                                      ₹{dailyBusiness.toLocaleString()} / ₹{nextRank.dailyBusiness.toLocaleString()}
                                  </span>
                              </div>
                          </div>
                          <div className="flex justify-between items-center">
                              <span className="text-neutral-400">Monthly Business (Team)</span>
                              <div className="flex items-center gap-2">
                                  <span className={`font-mono font-bold ${monthlyBusiness >= nextRank.monthlyBusiness ? 'text-green-500' : 'text-neutral-300'}`}>
                                      ₹{monthlyBusiness.toLocaleString()} / ₹{nextRank.monthlyBusiness.toLocaleString()}
                                  </span>
                              </div>
                          </div>
                          
                          {structureStatus && structureStatus.length > 0 && (
                              <div className="border-t border-neutral-700 pt-3 mt-2">
                                  <div className="flex justify-between items-start mb-2">
                                      <span className="text-neutral-400 font-bold text-xs uppercase">Network Structure</span>
                                  </div>
                                  <div className="space-y-1">
                                      {structureStatus.map((statusLine: string, idx: number) => (
                                          <p key={idx} className="text-right font-mono font-bold text-[10px] text-blue-400 break-words">
                                              {statusLine}
                                          </p>
                                      ))}
                                  </div>
                              </div>
                          )}

                          <p className="text-[10px] text-neutral-500 mt-2 italic">* Rank upgrades automatically when requirements are met.</p>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* TEAM STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 border border-neutral-800 rounded-xl hover:border-blue-500/50 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-900/20 p-3 rounded-lg text-blue-500 group-hover:text-blue-400 transition-colors">
                      <Users className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold bg-neutral-800 px-2 py-1 rounded text-neutral-400">Direct</span>
              </div>
              <p className="text-neutral-400 text-xs uppercase tracking-wider">Active Showrooms</p>
              <p className="text-3xl font-bold text-white mt-1">{totalShowrooms}</p>
          </div>

          <div className="glass-panel p-6 border border-neutral-800 rounded-xl hover:border-green-500/50 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                  <div className="bg-green-900/20 p-3 rounded-lg text-green-500 group-hover:text-green-400 transition-colors">
                      <TrendingUp className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold bg-neutral-800 px-2 py-1 rounded text-neutral-400">Today</span>
              </div>
              <p className="text-neutral-400 text-xs uppercase tracking-wider">Team Business (Daily)</p>
              <p className="text-3xl font-bold text-white mt-1 font-mono">₹ {dailyBusiness.toLocaleString()}</p>
          </div>

          <div className="glass-panel p-6 border border-neutral-800 rounded-xl hover:border-purple-500/50 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                  <div className="bg-purple-900/20 p-3 rounded-lg text-purple-500 group-hover:text-purple-400 transition-colors">
                      <DollarSign className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold bg-neutral-800 px-2 py-1 rounded text-neutral-400">Monthly</span>
              </div>
              <p className="text-neutral-400 text-xs uppercase tracking-wider">Team Business (Month)</p>
              <p className="text-3xl font-bold text-white mt-1 font-mono">₹ {monthlyBusiness.toLocaleString()}</p>
          </div>
      </div>

      {/* TEAM LIST */}
      <div className="glass-panel border border-neutral-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-neutral-800 bg-neutral-900 flex justify-between items-center">
              <h4 className="text-white font-bold flex items-center gap-2"><Users className="h-5 w-5 text-gold-500"/> Direct Showroom Referrals</h4>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-400">
                  <thead className="bg-black text-neutral-500 uppercase text-xs font-bold tracking-wider">
                      <tr>
                          <th className="p-4">Showroom Name</th>
                          <th className="p-4">ID</th>
                          <th className="p-4 text-right">Total Income Generated (Lifetime)</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 bg-neutral-900/20">
                      {allUsers
                        .filter(u => u.referredBy === currentUser.id && u.role === WorkerRole.SHOWROOM)
                        .map(member => (
                          <tr key={member.id} className="hover:bg-neutral-800/30 transition-colors">
                              <td className="p-4 font-bold text-white flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold border border-neutral-700">{member.name.charAt(0)}</div>
                                  {member.name}
                              </td>
                              <td className="p-4 font-mono text-xs">{member.id}</td>
                              <td className="p-4 text-right font-mono text-green-500 font-bold">
                                  ₹ {(member.totalReferralEarnings || 0).toLocaleString()}
                              </td>
                          </tr>
                      ))}
                      {allUsers.filter(u => u.referredBy === currentUser.id && u.role === WorkerRole.SHOWROOM).length === 0 && (
                          <tr><td colSpan={3} className="p-8 text-center">No showrooms referred yet. Invite showrooms to start climbing ranks!</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

    </div>
  );
};
