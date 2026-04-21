import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-6 bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-blue-100 shadow-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Our Mission</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-8 font-serif tracking-tight leading-tight">
            Bridging Ancient Wisdom <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              & Modern Science
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-xl text-slate-600 leading-relaxed">
            AyuSetu is a data-driven health platform that demystifies Ayurveda, making personalized holistic
            wellness accessible, explainable, and actionable for everyone.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-28">
          <div className="order-2 md:order-1 space-y-8">
            <div className="bg-white/60 backdrop-blur-md border-l-4 border-blue-600 pl-6 py-2">
              <h3 className="text-2xl font-bold text-slate-800 font-serif mb-2">The Problem</h3>
              <p className="text-slate-600 leading-relaxed">
                Modern healthcare often treats symptoms, not root causes. Traditional Ayurveda has answers, but
                it can feel complex or inaccessible to the digital generation.
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur-md border-l-4 border-emerald-500 pl-6 py-2">
              <h3 className="text-2xl font-bold text-slate-800 font-serif mb-2">Our Solution</h3>
              <p className="text-slate-600 leading-relaxed">
                We use NLP and algorithmic analysis to digitize Ayurvedic diagnosis. By analyzing symptom and
                lifestyle data, we generate an explainable dosha profile and practical wellness roadmap.
              </p>
            </div>
          </div>

          <div className="order-1 md:order-2 relative h-[400px] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2.5rem] border border-white shadow-xl overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,white_0%,transparent_70%)] opacity-50" />
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center text-4xl mb-6">
                🌿
              </div>
              <div className="flex gap-4">
                <div className="bg-white/80 backdrop-blur px-6 py-3 rounded-xl shadow-sm border border-white">
                  <span className="font-bold text-blue-900">Data</span>
                </div>
                <div className="bg-white/80 backdrop-blur px-6 py-3 rounded-xl shadow-sm border border-white">
                  <span className="font-bold text-emerald-800">Nature</span>
                </div>
                <div className="bg-white/80 backdrop-blur px-6 py-3 rounded-xl shadow-sm border border-white">
                  <span className="font-bold text-indigo-900">Balance</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mb-36">
          <div className="absolute inset-0 bg-slate-900 rounded-[3rem] shadow-2xl"></div>
          <div className="relative bg-white rounded-[3rem] p-10 md:p-14 shadow-xl border border-slate-100 overflow-hidden">
            <div className="text-center mb-10">
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 font-bold text-xs rounded-lg mb-4 uppercase tracking-wider">
                Meet the Creators
              </div>
              <h2 className="text-4xl font-bold text-slate-900 font-serif">Built by Vision & Code</h2>
              <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
                The people behind AyuSetu, focused on making Ayurvedic care more intelligent, accessible, and
                practical.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  name: "Kundan Kumar",
                  role: "Co-Creator",
                  summary:
                    "Focused on product engineering, patient-centric UX, and building reliable healthcare experiences end-to-end.",
                  gradient: "from-blue-50 to-indigo-50",
                },
                {
                  name: "Uttam Kumar",
                  role: "Co-Creator",
                  summary:
                    "Focused on platform architecture, intelligent reporting workflows, and scalable backend integrations.",
                  gradient: "from-emerald-50 to-cyan-50",
                },
                {
                  name: "Shashak Kumar",
                  role: "Co-Creator",
                  summary:
                    "Focused on solution design, healthcare domain understanding, and shaping practical user journeys for better clinical outcomes.",
                  gradient: "from-violet-50 to-blue-50",
                },
              ].map((creator) => (
                <article
                  key={creator.name}
                  className={`rounded-[2rem] border border-slate-200 bg-gradient-to-br ${creator.gradient} p-8 shadow-sm hover:shadow-lg transition-all`}
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-xl font-bold text-slate-700">
                      {creator.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 font-serif">{creator.name}</h3>
                      <p className="text-sm font-bold uppercase tracking-wider text-blue-700">{creator.role}</p>
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{creator.summary}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
          {[
            { label: "Algorithms", value: "15+", icon: "⚡" },
            { label: "Herbs Indexed", value: "200+", icon: "🌿" },
            { label: "Accuracy", value: "94%", icon: "🎯" },
            { label: "Users", value: "Growing", icon: "🚀" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="text-center bg-blue-900 rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
            </svg>
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-serif">
              Ready to find your balance?
            </h2>
            <p className="text-blue-200 text-lg mb-10 max-w-2xl mx-auto">
              Join the movement towards personalized, preventative healthcare. It starts with a simple
              assessment.
            </p>
            <Link
              to="/symptoms"
              className="inline-block px-10 py-4 bg-white text-blue-900 font-bold rounded-xl shadow-xl hover:scale-105 hover:bg-blue-50 transition-transform"
            >
              Start Assessment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
