import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  adminAPI,
  analyticsAPI,
  appointmentsAPI,
  chatsAPI,
  prescriptionsAPI,
  therapyAPI,
} from '../utils/api';

const formatNumber = (value) => new Intl.NumberFormat('en-IN').format(Number(value || 0));
const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [topTrends, setTopTrends] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [fallbackCounts, setFallbackCounts] = useState({
    appointments: 0,
    chats: 0,
    therapy: 0,
    prescriptions: 0,
  });
  const [actionMessage, setActionMessage] = useState('');
  const [approvingDoctorId, setApprovingDoctorId] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    setError('');

    const settled = await Promise.allSettled([
      adminAPI.overview(),
      adminAPI.pendingDoctors(),
      analyticsAPI.trends(),
      appointmentsAPI.mine(),
      chatsAPI.mine(),
      therapyAPI.mine(),
      prescriptionsAPI.mine(),
      adminAPI.systemHealth(),
    ]);

    const [
      overviewRes,
      pendingDoctorsRes,
      trendsRes,
      appointmentsRes,
      chatsRes,
      therapyRes,
      prescriptionsRes,
      healthRes,
    ] = settled;

    if (overviewRes.status === 'fulfilled') {
      setOverview(overviewRes.value?.data?.overview || null);
    } else {
      setOverview(null);
      setError('Could not load admin overview right now. Please refresh.');
    }

    if (pendingDoctorsRes.status === 'fulfilled') {
      setPendingDoctors(pendingDoctorsRes.value?.data?.doctors || []);
    } else {
      setPendingDoctors([]);
    }

    if (trendsRes.status === 'fulfilled') {
      setTopTrends((trendsRes.value?.data?.trends || []).slice(0, 6));
    } else {
      setTopTrends([]);
    }

    setFallbackCounts({
      appointments:
        appointmentsRes.status === 'fulfilled'
          ? Number(appointmentsRes.value?.data?.count || 0)
          : 0,
      chats:
        chatsRes.status === 'fulfilled'
          ? Number(chatsRes.value?.data?.count || 0)
          : 0,
      therapy:
        therapyRes.status === 'fulfilled'
          ? Number(therapyRes.value?.data?.count || 0)
          : 0,
      prescriptions:
        prescriptionsRes.status === 'fulfilled'
          ? Number(prescriptionsRes.value?.data?.count || 0)
          : 0,
    });

    if (healthRes.status === 'fulfilled') {
      setSystemHealth(healthRes.value?.data?.health || null);
    } else {
      setSystemHealth(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const summary = overview?.summary || {};
  const kpiCards = useMemo(
    () => [
      {
        label: 'Total Users',
        value: summary.totalUsers,
        hint: `${formatNumber(summary.totalPatients)} patients`,
      },
      {
        label: 'Doctors',
        value: summary.totalDoctors,
        hint: `${formatNumber(summary.pendingDoctorVerifications)} pending verification`,
      },
      {
        label: 'Appointments',
        value: summary.totalAppointments || fallbackCounts.appointments,
        hint: `${formatNumber(summary.openAppointments)} open`,
      },
      {
        label: 'Symptom Reports',
        value: summary.totalAssessments,
        hint: 'Patient assessments submitted',
      },
      {
        label: 'Chat Sessions',
        value: summary.totalChats || fallbackCounts.chats,
        hint: `${formatNumber(summary.escalatedChats)} escalated`,
      },
      {
        label: 'Therapy Plans',
        value: summary.totalTherapyPlans || fallbackCounts.therapy,
        hint: `${formatNumber(summary.activeTherapyPlans)} active`,
      },
      {
        label: 'Prescriptions',
        value: summary.totalPrescriptions || fallbackCounts.prescriptions,
        hint: 'Issued records',
      },
      {
        label: 'Pharmacy Inventories',
        value: summary.totalInventories,
        hint: `${formatNumber(summary.totalPharmacies)} pharmacies`,
      },
    ],
    [summary, fallbackCounts]
  );

  const handleVerifyDoctor = async (doctorId) => {
    if (!doctorId) return;
    setApprovingDoctorId(doctorId);
    setActionMessage('');
    try {
      await adminAPI.verifyDoctor(doctorId);
      setPendingDoctors((prev) => prev.filter((doctor) => doctor._id !== doctorId));
      setActionMessage('Doctor verified successfully.');
      await loadAdminData();
    } catch (apiError) {
      setActionMessage(apiError?.response?.data?.message || 'Could not verify doctor right now.');
    } finally {
      setApprovingDoctorId('');
    }
  };

  const serviceCoverage = overview?.serviceCoverage || [];
  const recentAppointments = overview?.recent?.appointments || [];
  const recentAssessments = overview?.recent?.assessments || [];
  const recentChats = overview?.recent?.chats || [];

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white rounded-[2rem] p-7 md:p-9 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-200 font-bold mb-2">AyuSetu Governance</p>
              <h1 className="text-3xl md:text-4xl font-serif font-bold">Admin Control Center</h1>
              <p className="text-blue-100 mt-3 max-w-3xl">
                Monitor every service, verify practitioner access, and keep platform operations healthy from one secure console.
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/services" className="px-5 py-2.5 bg-white text-slate-900 font-bold rounded-xl hover:bg-blue-50 transition">
                Services
              </Link>
              <Link to="/knowledge" className="px-5 py-2.5 bg-white/10 border border-white/30 text-white font-bold rounded-xl hover:bg-white/20 transition">
                Knowledge
              </Link>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-500">
            Loading admin controls...
          </div>
        ) : (
          <>
            {error ? (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 font-semibold">{error}</div>
            ) : null}

            <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {kpiCards.map((card) => (
                <article key={card.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-500">{card.label}</p>
                  <h2 className="text-3xl font-bold text-slate-900 mt-2">{formatNumber(card.value)}</h2>
                  <p className="text-sm text-slate-500 mt-1">{card.hint}</p>
                </article>
              ))}
            </section>

            <section className="grid xl:grid-cols-3 gap-6">
              <article className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="text-2xl font-serif font-bold text-slate-900">Doctor Verification Queue</h3>
                  <span className="text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                    {formatNumber(pendingDoctors.length)} pending
                  </span>
                </div>

                {actionMessage ? (
                  <div className="mb-4 text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl px-4 py-2">
                    {actionMessage}
                  </div>
                ) : null}

                {pendingDoctors.length === 0 ? (
                  <div className="border border-dashed border-slate-300 rounded-2xl px-5 py-8 text-center text-slate-500">
                    No pending doctor verification requests.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingDoctors.slice(0, 8).map((doctor) => (
                      <div key={doctor._id} className="border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">{doctor.fullName}</h4>
                          <p className="text-sm text-slate-600">
                            {doctor.email || doctor.phone || 'No contact info'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Specialty: {doctor?.doctorProfile?.specialty || 'Not specified'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleVerifyDoctor(doctor._id)}
                          disabled={approvingDoctorId === doctor._id}
                          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50"
                        >
                          {approvingDoctorId === doctor._id ? 'Verifying...' : 'Verify Doctor'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-2xl font-serif font-bold text-slate-900 mb-4">System Health</h3>
                {systemHealth ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Status</span>
                      <span className="font-bold text-emerald-600 uppercase">{systemHealth.status || 'ok'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Users</span>
                      <span className="font-bold text-slate-800">{formatNumber(systemHealth.users)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Appointments</span>
                      <span className="font-bold text-slate-800">{formatNumber(systemHealth.appointments)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Assessments</span>
                      <span className="font-bold text-slate-800">{formatNumber(systemHealth.assessments)}</span>
                    </div>
                    <p className="text-xs text-slate-500 pt-3 border-t border-slate-200">
                      Last generated: {formatDateTime(systemHealth.timestamp)}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">Health metrics unavailable right now.</p>
                )}

                <div className="mt-6">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Top Symptom Trends</h4>
                  {topTrends.length === 0 ? (
                    <p className="text-slate-500 text-sm">No trends available.</p>
                  ) : (
                    <div className="space-y-2">
                      {topTrends.map((trend) => (
                        <div key={trend._id} className="bg-slate-50 rounded-xl px-3 py-2 flex items-center justify-between">
                          <span className="text-sm text-slate-700">{trend._id}</span>
                          <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                            {formatNumber(trend.count)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            </section>

            <section className="grid xl:grid-cols-3 gap-6">
              <article className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-xl font-serif font-bold text-slate-900 mb-4">Recent Appointments</h3>
                {recentAppointments.length === 0 ? (
                  <p className="text-slate-500 text-sm">No appointment activity yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentAppointments.map((item) => (
                      <div key={item._id} className="bg-slate-50 rounded-xl p-3">
                        <p className="text-sm font-bold text-slate-800">{item?.appointmentCode || 'Appointment'}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          {item?.patientId?.fullName || 'Patient'} with {item?.doctorId?.fullName || 'Doctor'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{item.slotDate} {item.slotTime} | {item.status}</p>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-xl font-serif font-bold text-slate-900 mb-4">Recent Assessments</h3>
                {recentAssessments.length === 0 ? (
                  <p className="text-slate-500 text-sm">No assessment activity yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentAssessments.map((item) => (
                      <div key={item._id} className="bg-slate-50 rounded-xl p-3">
                        <p className="text-sm font-bold text-slate-800">{item?.userId?.fullName || 'Patient'}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          {(item?.symptoms || []).map((sym) => sym.name).slice(0, 3).join(', ') || 'No symptom tags'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Severity: {item?.triage?.severityLevel || 'N/A'} | {formatDateTime(item.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-xl font-serif font-bold text-slate-900 mb-4">Recent Chat Escalations</h3>
                {recentChats.length === 0 ? (
                  <p className="text-slate-500 text-sm">No chat activity yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentChats.map((chat) => (
                      <div key={chat._id} className="bg-slate-50 rounded-xl p-3">
                        <p className="text-sm font-bold text-slate-800">
                          {chat.assistantName || 'AyuBot'} | {chat.channel}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          Patient: {chat?.patientId?.fullName || 'Unknown'} | Status: {chat.status}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {chat.lastMessage || 'No recent message'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h3 className="text-2xl font-serif font-bold text-slate-900">Service Governance Matrix</h3>
                <div className="flex gap-3">
                  <Link to="/services" className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800">
                    Open Services
                  </Link>
                </div>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                {serviceCoverage.map((service) => (
                  <article key={service.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wider font-bold text-slate-500">{service.monitoredBy}</p>
                    <h4 className="text-lg font-bold text-slate-900 mt-1">{service.label}</h4>
                    <p className="text-sm text-slate-600 mt-2">
                      Records tracked: <span className="font-bold text-slate-900">{formatNumber(service.total)}</span>
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
