import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const servicesCatalog = [
  {
    id: 'auth',
    title: 'Authentication & Profile',
    icon: 'A',
    accent: 'from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    roles: ['patient', 'doctor', 'pharmacy', 'admin'],
    description: 'Secure sign-in, role-based identity, and profile management.',
    actionLabel: 'Open Login',
    actionTo: '/login',
  },
  {
    id: 'symptoms',
    title: 'Symptom Assessment',
    icon: 'S',
    accent: 'from-emerald-50 to-cyan-50',
    border: 'border-emerald-200',
    roles: ['patient', 'admin'],
    description: 'Guided symptom intake with severity, lifestyle context, and AI/rule triage.',
    actionLabel: 'Start Assessment',
    actionTo: '/symptoms',
    actionToByRole: {
      admin: '/admin-dashboard',
    },
  },
  {
    id: 'chat',
    title: 'AI Chat Assistant',
    icon: 'C',
    accent: 'from-violet-50 to-fuchsia-50',
    border: 'border-violet-200',
    roles: ['patient', 'admin'],
    description: 'Natural language guidance, upload analysis, and longitudinal symptom memory.',
    actionLabel: 'Open Dashboard',
    actionTo: '/dashboard',
    actionToByRole: {
      admin: '/admin-dashboard',
    },
  },
  {
    id: 'doctors',
    title: 'Doctor Discovery',
    icon: 'D',
    accent: 'from-sky-50 to-blue-50',
    border: 'border-sky-200',
    roles: ['patient', 'admin'],
    description: 'Browse doctor profiles, specialties, and availability slots.',
    actionLabel: 'Find Doctors',
    actionTo: '/doctors',
    actionToByRole: {
      admin: '/admin-dashboard',
    },
  },
  {
    id: 'appointments',
    title: 'Appointments & Video Consult',
    icon: 'V',
    accent: 'from-orange-50 to-amber-50',
    border: 'border-orange-200',
    roles: ['patient', 'doctor', 'admin'],
    description: 'Slot-based booking and time-window validated consultation rooms.',
    actionLabel: 'Go to Dashboard',
    actionTo: '/dashboard',
    actionToByRole: {
      doctor: '/doctor-dashboard',
      admin: '/admin-dashboard',
    },
  },
  {
    id: 'prescriptions',
    title: 'Digital Prescriptions',
    icon: 'P',
    accent: 'from-rose-50 to-pink-50',
    border: 'border-rose-200',
    roles: ['patient', 'doctor', 'admin', 'pharmacy'],
    description: 'Prescription generation, retrieval, and QR-based pharmacy lookup.',
    actionLabel: 'Patient Records',
    actionTo: '/dashboard',
    actionToByRole: {
      doctor: '/doctor-dashboard',
      admin: '/admin-dashboard',
    },
  },
  {
    id: 'therapy',
    title: 'Therapy Planning',
    icon: 'T',
    accent: 'from-lime-50 to-emerald-50',
    border: 'border-lime-200',
    roles: ['patient', 'doctor', 'admin'],
    description: 'Panchakarma/therapy plan lifecycle and session status tracking.',
    actionLabel: 'Open Care View',
    actionTo: '/dashboard',
    actionToByRole: {
      doctor: '/doctor-dashboard',
      admin: '/admin-dashboard',
    },
  },
  {
    id: 'pharmacy',
    title: 'Pharmacy Services',
    icon: 'M',
    accent: 'from-cyan-50 to-blue-50',
    border: 'border-cyan-200',
    roles: ['pharmacy', 'admin', 'patient', 'doctor'],
    description: 'Inventory management and medicine search across available stock.',
    actionLabel: 'Knowledge Base',
    actionTo: '/knowledge',
    actionToByRole: {
      admin: '/admin-dashboard',
    },
  },
  {
    id: 'admin',
    title: 'Admin Operations',
    icon: 'O',
    accent: 'from-slate-100 to-slate-50',
    border: 'border-slate-200',
    roles: ['admin'],
    description: 'Doctor verification queues, system health monitoring, and governance controls.',
    actionLabel: 'Admin Console',
    actionTo: '/admin-dashboard',
  },
  {
    id: 'analytics',
    title: 'Analytics & Trends',
    icon: 'N',
    accent: 'from-indigo-50 to-blue-50',
    border: 'border-indigo-200',
    roles: ['admin', 'doctor', 'patient'],
    description: 'Symptom trends, district insights, and platform utilization metrics.',
    actionLabel: 'Open Insights',
    actionTo: '/knowledge',
    actionToByRole: {
      admin: '/admin-dashboard',
    },
  },
];

export default function Services() {
  const { user } = useAuth();

  const visibleCards = useMemo(
    () =>
      servicesCatalog.map((service) => ({
        ...service,
        accessible: service.roles.includes(user?.role),
        resolvedActionTo: service.actionToByRole?.[user?.role] || service.actionTo,
      })),
    [user]
  );

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-blue-100 shadow-sm mb-5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Service Hub</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-4 font-serif">
            All Platform Services
          </h1>
          <p className="max-w-3xl mx-auto text-slate-600 text-lg">
            One beautifully organized view of every AyuSetu service module and what is available for your role.
          </p>
        </div>

        <div className="mb-8 bg-white border border-blue-200 rounded-2xl px-5 py-4 text-blue-900 shadow-sm">
          <p className="font-semibold">
            Admin-only control: every service module is visible here for governance and monitoring.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {visibleCards.map((service) => {
            const accessible = Boolean(service.accessible);
            return (
              <article
                key={service.id}
                className={`bg-gradient-to-br ${service.accent} border ${service.border} rounded-[1.75rem] p-6 shadow-sm hover:shadow-lg transition-all`}
              >
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center shadow-sm">
                      {service.icon}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 font-serif leading-tight">{service.title}</h2>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      accessible
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {accessible ? 'Available' : 'Restricted'}
                  </span>
                </div>

                <p className="text-slate-700 leading-relaxed min-h-[72px]">{service.description}</p>

                <div className="mt-5 mb-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Allowed Roles</p>
                  <div className="flex flex-wrap gap-2">
                    {service.roles.map((role) => (
                      <span key={`${service.id}-${role}`} className="text-xs px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                {accessible ? (
                  <Link
                    to={service.resolvedActionTo || service.actionTo}
                    className="inline-block px-4 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition"
                  >
                    {service.actionLabel}
                  </Link>
                ) : (
                  <Link
                    to="/admin-dashboard"
                    className="inline-block px-4 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition"
                  >
                    Open Admin Center
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
