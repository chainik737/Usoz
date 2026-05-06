import { useNavigate } from "react-router-dom";
import { ChevronLeft, HelpCircle, CheckCircle2, QrCode, Calendar, MapPin, Wallet } from "lucide-react";
import { motion } from "motion/react";

export default function BookingSummaryScreen() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen pb-32 bg-surface">
      <header className="fixed top-0 z-50 w-full h-16 flex justify-between items-center px-5 bg-slate-50/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
            <ChevronLeft size={24} className="text-primary-container" />
          </button>
          <h1 className="text-xl font-bold text-primary-container tracking-tight font-lexend uppercase">Usoz</h1>
        </div>
        <div className="flex items-center">
           <img className="w-8 h-8 rounded-full border border-primary-container/20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOvpNidXwmVHLeSI0n_AqN2fxfBoQjUCJb0UCnTr8da8sAh0h4w7bdfzRF3sv0DHsTF7h3qti9fHtt-j0IdWajHCgDoN13GYNG1Dy4N9i_-bfyRuWgXJKb2oUgJHJA7oQlOfIYUgFL4yBJALuv2HHYcN9dZf9XhpWlCoLN-LDpnUISTzoN-2yLpIvi-DUn7WQx7rraouB6mSSVLVd91Krga1K1MafH4uIXEW_B7ErbHt7BQRO8hAMaPZ-3yF4Ze8CyNKpFAy7f4wel" />
        </div>
      </header>

      <main className="pt-24 px-5 max-w-2xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold text-primary">Booking Summary</h2>

        <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(100,116,139,0.12)] border border-slate-100 p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img className="w-16 h-16 rounded-xl object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBz7ld7UbVDD7H6Yf7OKR9rZDTpwaEpquZX6e77ByrsZRFRCJJSaUM-l_pnbnX9kstL4er4Vqqx52FUNox0v0alA88g5tGYCT5wE4G50pdSiaLrf9Pe1TRF7n610Q4sQd91bgUEgBRrH0a03iKFF4d6H_ySkBuoMbPnxOxC6GlO2f6UpqRpSki5EeLKzf55Xlcam-imogOjNsRBPLA-_PpKv4VXF6adQnPW-Ybyq3q5xszlHifX1QtzENKwlTnMUhzyvrrz4ecJ6bxe" alt="Tutor" />
              <div className="absolute -top-1 -right-1 bg-[#22c087] rounded-full p-0.5 border-2 border-white">
                <CheckCircle2 size={12} className="text-white" fill="currentColor" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg text-on-surface leading-tight">Alexei Volkov</h3>
              <p className="text-sm text-on-surface-variant font-medium">Advanced Data Science</p>
              <div className="flex items-center gap-1 mt-1">
                 <span className="text-[10px] font-bold text-outline uppercase tracking-wider">4.9 (124 reviews)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
            <SummaryItem icon={<Calendar size={20}/>} title="DATE & TIME" value="Friday, Oct 27 • 14:00 - 15:30" />
            <SummaryItem 
              icon={<MapPin size={20}/>} 
              title="LOCATION" 
              value={<>Astana Hub, Floor 3<br/><span className="text-[9px] font-bold text-on-surface-variant border border-outline-variant px-2 py-0.5 rounded-full inline-block mt-1">0.8 km away</span></>} 
            />
          </div>
        </div>

        <h2 className="text-xl font-bold text-primary">Payment Details</h2>
        <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(100,116,139,0.12)] border border-slate-100 overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-on-surface-variant">Lesson Fee (1.5h)</span>
              <span className="font-bold">12,000 ₸</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-on-surface-variant flex items-center gap-1 font-medium">Platform Fee (5%) <HelpCircle size={14} className="text-outline"/></span>
              <span className="font-bold">600 ₸</span>
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xl font-bold text-primary">Total Amount</span>
              <span className="text-2xl font-bold text-primary">12,600 ₸</span>
            </div>
          </div>

          <div className="bg-surface-container-low p-8 flex flex-col items-center border-t border-slate-100">
            <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 border-2 border-primary-container/10">
              <div className="w-48 h-48 bg-slate-50 flex items-center justify-center relative overflow-hidden rounded-xl">
                <div className="w-40 h-40 border-4 border-slate-200 p-2 flex flex-wrap gap-1 opacity-20">
                  {Array.from({length: 16}).map((_, i) => <div key={i} className="w-8 h-8 bg-slate-800 rounded-sm"/>)}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="bg-[#F14635] text-white px-4 py-1.5 rounded-lg font-bold text-lg shadow-xl uppercase tracking-tighter">Kaspi.kz</div>
                </div>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant font-medium text-center mb-6">Scan with your Kaspi.kz app to pay securely</p>
            <button className="w-full bg-primary-container text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg hover:opacity-90">
              <QrCode size={20} />
              I've Paid via Kaspi
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button className="w-full bg-white border border-slate-200 text-on-surface font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
             <Wallet size={20} className="text-outline" />
             Pay with Cash on Arrival
          </button>
          <p className="text-xs text-on-surface-variant text-center px-10 font-medium leading-relaxed">
            Choosing cash requires tutor confirmation. Platform fee of 600 ₸ will still be charged to your account balance.
          </p>
        </div>
      </main>
    </div>
  );
}

function SummaryItem({ icon, title, value }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-primary-fixed p-2 rounded-xl text-primary-container">{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none mb-1">{title}</p>
        <div className="text-sm font-bold text-on-surface leading-tight">{value}</div>
      </div>
    </div>
  );
}
