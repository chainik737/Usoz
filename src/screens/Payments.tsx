import { TopAppBar, BottomNavBar } from "@/src/components/Navigation";
import { CreditCard, Wallet, ArrowUpRight, ArrowDownLeft, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function PaymentsScreen() {
  const navigate = useNavigate();
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);

  const transactions = [
    { id: 1, type: 'out', label: 'Payment to Elena S.', amount: '15,000', currency: '₸', date: 'May 3, 2026', method: 'Kaspi QR' },
    { id: 2, type: 'out', label: 'Payment to Alisher B.', amount: '8,500', currency: '₸', date: 'May 1, 2026', method: 'Cash' },
    { id: 3, type: 'in', label: 'Wallet Top Up', amount: '20,000', currency: '₸', date: 'April 28, 2026', method: 'Card' },
    { id: 4, type: 'out', label: 'Payment to Sarah M.', amount: '12,000', currency: '₸', date: 'April 25, 2026', method: 'Kaspi QR' },
    { id: 5, type: 'out', label: 'Subscription Fee', amount: '2,500', currency: '₸', date: 'April 20, 2026', method: 'Wallet' },
    { id: 6, type: 'in', label: 'Refund for Session', amount: '5,000', currency: '₸', date: 'April 15, 2026', method: 'Kaspi QR' },
  ];

  const displayedTransactions = showAllTransactions ? transactions : transactions.slice(0, 3);

  return (
    <div className="min-h-screen pb-24 bg-surface transition-all">
      <TopAppBar 
        title={showAddCard ? "Add New Card" : showAllTransactions ? "All Transactions" : "Wallet & Payments"} 
        showBack={showAllTransactions || showAddCard} 
        onBack={() => {
          if (showAddCard) setShowAddCard(false);
          else if (showAllTransactions) setShowAllTransactions(false);
          else navigate(-1);
        }} 
      />
      <main className="mt-20 px-5 max-w-2xl mx-auto space-y-8">
        <AnimatePresence mode="wait">
          {showAddCard ? (
            <motion.div 
              key="add-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-slate-900 aspect-[1.6/1] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32" />
                 <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start">
                       <div className="w-12 h-10 bg-slate-800 rounded-lg" />
                       <div className="text-xl font-bold italic tracking-tighter">VISA</div>
                    </div>
                    <div className="space-y-4">
                       <p className="text-xl font-mono tracking-[0.2em]">•••• •••• •••• ••••</p>
                       <div className="flex justify-between items-end">
                          <div>
                             <p className="text-[8px] uppercase tracking-widest opacity-50 mb-1">Card Holder</p>
                             <p className="text-xs font-bold uppercase">Your Name</p>
                          </div>
                          <div>
                             <p className="text-[8px] uppercase tracking-widest opacity-50 mb-1">Expires</p>
                             <p className="text-xs font-bold">MM/YY</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Card Number</label>
                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full h-14 bg-white rounded-2xl px-5 border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-medium" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Expiry Date</label>
                       <input type="text" placeholder="MM/YY" className="w-full h-14 bg-white rounded-2xl px-5 border border-outline-variant/30 focus:border-primary outline-none font-medium text-center" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">CVV</label>
                       <input type="password" placeholder="•••" className="w-full h-14 bg-white rounded-2xl px-5 border border-outline-variant/30 focus:border-primary outline-none font-medium text-center" />
                    </div>
                 </div>
                 <button onClick={() => setShowAddCard(false)} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all mt-4">
                    Verify & Add Card
                 </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="main-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {!showAllTransactions && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-primary-container p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <Wallet size={120} />
                  </div>
                  <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Current Balance</p>
                        <h2 className="text-4xl font-black mt-1 tracking-tight">45,750₸</h2>
                      </div>
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                        <Wallet size={24} />
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button className="w-full bg-white text-primary-container h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                        <Plus size={18} /> Top Up
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Activity */}
              <section className="space-y-4">
                <h3 className="text-sm font-black text-on-surface uppercase tracking-widest px-1">
                  {showAllTransactions ? "Transaction History" : "Recent Activity"}
                </h3>
                <div className="space-y-3">
                  {displayedTransactions.map((tx, i) => (
                    <motion.div 
                      key={tx.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between shadow-sm group hover:border-primary-container/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                          tx.type === 'in' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        )}>
                          {tx.type === 'in' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-on-surface">{tx.label}</p>
                          <p className="text-[10px] text-outline font-bold uppercase tracking-widest">{tx.date} • {tx.method}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "font-black text-sm",
                        tx.type === 'in' ? "text-emerald-600" : "text-on-surface"
                      )}>
                        {tx.type === 'in' ? '+' : '-'}{tx.amount}{tx.currency}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {!showAllTransactions && (
                <button 
                  onClick={() => setShowAllTransactions(true)}
                  className="w-full py-4 border-2 border-dashed border-outline-variant rounded-2xl text-[10px] font-black text-outline uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  View All Transactions
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <BottomNavBar />
    </div>
  );
}
