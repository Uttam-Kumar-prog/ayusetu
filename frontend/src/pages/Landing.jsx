import React from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      
      {/* ===== BACKGROUND GRAPHICS ===== */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        
        {/* 1. Base Background */}
        <div className="absolute inset-0 bg-white" />

        {/* 2. High-Visibility Dot Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-70" />

        {/* 3. Vibrant Gradient Orbs */}
        <div className="absolute -top-[10%] -right-[10%] w-[700px] h-[700px] rounded-full bg-blue-100 mix-blend-multiply filter blur-[80px] opacity-70 animate-pulse" />
        <div className="absolute top-[10%] -left-[10%] w-[600px] h-[600px] rounded-full bg-indigo-100 mix-blend-multiply filter blur-[80px] opacity-70" />
        <div className="absolute bottom-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-emerald-50 mix-blend-multiply filter blur-[80px] opacity-60" />
      </div>

      {/* ===== HERO SECTION ===== */}
      <section className="relative z-10 pt-32 pb-24 text-center max-w-6xl mx-auto px-6">
        
        {/* Floating Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-blue-200 shadow-sm mb-10 ring-1 ring-blue-50">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          <span className="text-blue-800 font-semibold text-xs uppercase tracking-wider">
            Trusted Digital Health Platform
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.1]">
          Personalized Healthcare <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Powered by Ayurveda
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 leading-relaxed mb-12">
          A modern HealthTech platform blending ancient wisdom with data science
          to provide safe, explainable, and personalized wellness guidance.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-24">
          <Link
            to="/symptoms"
            className="group relative px-8 py-4 bg-blue-600 text-white rounded-full font-semibold shadow-[0_10px_20px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_20px_30px_-10px_rgba(37,99,235,0.4)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 overflow-hidden"
          >
            <span className="relative z-10">Start Health Assessment</span>
            <div className="absolute inset-0 h-full w-full scale-0 rounded-full transition-all duration-300 group-hover:scale-100 group-hover:bg-blue-700/50" />
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 bg-white/60 backdrop-blur-md text-slate-700 font-semibold rounded-full border border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 shadow-sm"
          >
            View Dashboard
          </Link>
        </div>

        {/* ===== MOCK DASHBOARD UI ===== */}
        <div className="relative mx-auto max-w-5xl rounded-2xl p-2 bg-gradient-to-b from-white/60 to-white/20 shadow-2xl backdrop-blur-sm border border-white/50">
           
           <div className="aspect-[16/9] rounded-xl overflow-hidden bg-slate-50 shadow-inner border border-slate-200 relative group flex text-left">
              
              {/* Sidebar */}
              <div className="w-64 bg-white border-r border-slate-100 flex flex-col p-5 hidden md:flex z-10">
                 <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">A</div>
                    <span className="font-bold text-slate-800 tracking-tight">AyuSetu</span>
                 </div>
                 
                 <div className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                       Overview
                    </div>
                    {['Assessments', 'My Plans', 'Diet Chart', 'Consultations'].map((item) => (
                       <div key={item} className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-medium text-sm transition-colors">
                          <div className="w-5 h-5 bg-slate-200 rounded-full opacity-50" /> 
                          {item}
                       </div>
                    ))}
                 </div>
                 
                 <div className="mt-auto pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-indigo-100 rounded-full" />
                       <div className="text-xs">
                          <div className="font-bold text-slate-700">Abhay Dogra</div>
                          <div className="text-slate-400">Premium Plan</div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-8 overflow-hidden relative">
                 <div className="flex justify-between items-center mb-8">
                    <div>
                       <h3 className="text-2xl font-bold text-slate-800">Health Overview</h3>
                       <p className="text-slate-500 text-sm">Welcome back, your Kapha is improving.</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-full border border-slate-200 text-sm font-medium text-slate-600 shadow-sm">
                       Today
                    </div>
                 </div>

                 {/* Stats */}
                 <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                       <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Wellness Score</div>
                       <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-slate-900">86</span>
                          <span className="text-green-500 text-sm font-medium">↑ 12%</span>
                       </div>
                       <div className="w-full bg-slate-100 h-1.5 mt-3 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full w-[86%]" />
                       </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                       <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Dominant Dosha</div>
                       <div className="text-3xl font-bold text-indigo-600">Pitta</div>
                       <div className="text-slate-400 text-xs mt-2">Balanced with cooling diet</div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                       <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Next Remedy</div>
                       <div className="text-lg font-bold text-slate-800 leading-tight">Triphala Tea</div>
                       <div className="text-slate-400 text-xs mt-1">Tonight at 9:00 PM</div>
                    </div>
                 </div>

                 {/* Charts */}
                 <div className="grid grid-cols-3 gap-6 h-48">
                    <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col relative overflow-hidden">
                       <h4 className="font-semibold text-slate-700 text-sm mb-4">Recovery Trend</h4>
                       <div className="flex-1 relative">
                          <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                             <line x1="0" y1="25" x2="300" y2="25" stroke="#f1f5f9" strokeWidth="1" />
                             <line x1="0" y1="50" x2="300" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                             <line x1="0" y1="75" x2="300" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                             <path d="M0,100 L0,60 Q50,40 100,50 T200,30 T300,10 V100 Z" fill="rgba(37,99,235,0.05)" />
                             <path d="M0,60 Q50,40 100,50 T200,30 T300,10" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
                             <circle cx="100" cy="50" r="4" fill="white" stroke="#2563EB" strokeWidth="2" />
                             <circle cx="200" cy="30" r="4" fill="white" stroke="#2563EB" strokeWidth="2" />
                          </svg>
                       </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col items-center justify-center">
                       <h4 className="font-semibold text-slate-700 text-sm w-full text-left mb-2">Dosha Balance</h4>
                       <div className="relative w-24 h-24">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                             <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                             <path className="text-blue-500" strokeDasharray="70, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                             <path className="text-indigo-500" strokeDasharray="20, 100" strokeDashoffset="-70" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center flex-col">
                             <span className="text-xs text-slate-400">Pitta</span>
                             <span className="font-bold text-slate-700">High</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

           </div>
        </div>
      </section>

      {/* ===== FEATURES WITH CARDS ===== */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Choose This Platform?</h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto rounded-full opacity-20" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🧠", 
                title: "Explainable Guidance",
                desc: "Transparent recommendations based on clear Ayurvedic principles, not black-box algorithms.",
                color: "bg-blue-50 text-blue-600"
              },
              {
                icon: "🌿",
                title: "Preventive Care",
                desc: "Focus on lifestyle, diet, and home remedies to prevent illness before it starts.",
                color: "bg-emerald-50 text-emerald-600"
              },
              {
                icon: "📊",
                title: "Health Tracking",
                desc: "Monitor your wellness journey with intuitive charts and regular health assessments.",
                color: "bg-indigo-50 text-indigo-600"
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                <div className={`w-14 h-14 mb-6 flex items-center justify-center rounded-2xl ${item.color} text-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STEPS & SCANNER SECTION ===== */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            
            {/* Left Side: Text Steps */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Your Journey to Wellness
              </h2>
              <p className="text-slate-600 mb-10 text-lg">
                Three simple steps to unlock a healthier, more balanced life through the power of data.
              </p>

              <div className="space-y-8 relative">
                {/* Vertical Line Connector */}
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-100 -z-10" />

                {[
                  { step: "01", title: "Assess Symptoms", desc: "Complete our detailed questionnaire." },
                  { step: "02", title: "Get Insights", desc: "Receive your personalized Dosha analysis." },
                  { step: "03", title: "Track Progress", desc: "Update your stats and watch your health improve." },
                ].map((s) => (
                  <div key={s.step} className="flex gap-6 group p-4 rounded-2xl bg-white hover:bg-blue-50/50 border border-transparent hover:border-blue-100 transition-all duration-300">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300 relative z-10">
                      {s.step}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 mb-1">{s.title}</h4>
                      <p className="text-slate-600 text-sm">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side: Visual Abstract (Digital Health Scanner) */}
            <div className="relative h-[600px] w-full flex items-center justify-center">
              
              {/* 1. Background Glows */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl animate-pulse" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-50/60 rounded-full blur-2xl" />

              {/* 2. Main Glass Container */}
              <div className="relative w-full max-w-lg aspect-square bg-white/40 backdrop-blur-xl border border-white/60 rounded-[3rem] shadow-2xl flex items-center justify-center overflow-hidden z-10 group">
                
                {/* Grid Pattern inside the glass */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

                {/* 3. Central "Digital Self" Core */}
                <div className="relative z-20">
                  {/* Spinning Outer Ring */}
                  <div className="absolute inset-[-20px] border border-blue-200/50 rounded-full animate-[spin_10s_linear_infinite]" />
                  <div className="absolute inset-[-40px] border border-dashed border-blue-300/30 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                  
                  {/* Center Circle */}
                  <div className="w-32 h-32 bg-gradient-to-br from-white to-blue-50 rounded-full shadow-[0_0_40px_rgba(37,99,235,0.15)] border border-white flex items-center justify-center relative">
                    <span className="text-6xl filter drop-shadow-md transform group-hover:scale-110 transition-transform duration-500">🧘</span>
                    
                    {/* Radar Scan Effect */}
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-400/20 to-transparent animate-[spin_2s_linear_infinite]" />
                    </div>
                  </div>
                </div>

                {/* 4. Floating Data Cards */}
                
                {/* Top Left: Vata Analysis */}
                <div className="absolute top-24 left-10 bg-white/80 backdrop-blur-md p-3 pr-6 rounded-2xl shadow-lg border border-white/50 flex items-center gap-3 animate-bounce" style={{animationDuration: '3s'}}>
                   <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">⚡</div>
                   <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Analysis</div>
                      <div className="text-sm font-bold text-slate-800">Vata Balanced</div>
                   </div>
                </div>

                {/* Bottom Right: Vitality Graph */}
                <div className="absolute bottom-28 right-10 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50 w-40 animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}>
                    <div className="flex justify-between items-end mb-2">
                       <span className="text-xs font-semibold text-slate-600">Vitality</span>
                       <span className="text-xs text-green-500 font-bold">↑ 98%</span>
                    </div>
                    <div className="flex items-end gap-1 h-10">
                       {[30, 50, 40, 70, 60, 80, 50, 90].map((h, i) => (
                          <div key={i} style={{height: `${h}%`}} className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-[2px] opacity-80" />
                       ))}
                    </div>
                </div>

                {/* Top Right: Status Chip */}
                <div className="absolute top-32 right-8 bg-green-50/90 backdrop-blur-md px-4 py-2 rounded-full border border-green-100 shadow-md flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                    <span className="text-xs font-bold text-green-700">Health Optimized</span>
                </div>

                {/* Bottom Left: Sleep/Calm Data */}
                <div className="absolute bottom-20 left-12 bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/50 flex flex-col items-center animate-bounce" style={{animationDuration: '5s', animationDelay: '0.5s'}}>
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                           <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                           <path className="text-indigo-500" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-[10px] font-bold text-slate-600">75%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold mt-1">Calmness</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-900">
           <svg className="absolute top-0 left-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M0 50 Q 25 30 50 50 T 100 50 V 100 H 0 Z" fill="white" />
           </svg>
        </div>
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Ready to Transform Your Health?
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of others discovering the balance of Ayurveda through data-driven insights.
          </p>
          <Link
            to="/symptoms"
            className="inline-block px-12 py-5 bg-white text-blue-900 rounded-full font-bold text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300"
          >
            Start Your Journey
          </Link>
        </div>
      </section>
    </div>
  );
}
