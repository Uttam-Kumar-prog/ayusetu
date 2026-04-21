import React, { useEffect, useMemo, useState } from 'react';
import { appointmentsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('IN_PROGRESS');
  const [isSaving, setIsSaving] = useState(false);
  const [caseSummary, setCaseSummary] = useState(null);
  const [caseSummaryLoading, setCaseSummaryLoading] = useState(false);
  const [caseSummaryError, setCaseSummaryError] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError('');

      try {
        const { data } = await appointmentsAPI.mine();
        setAppointments(data?.appointments || []);
      } catch (apiError) {
        setAppointments([]);
        setError(apiError?.response?.data?.message || 'Could not load appointments.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const stats = useMemo(() => {
    const today = appointments.length;
    const pending = appointments.filter((item) => ['CONFIRMED', 'IN_PROGRESS'].includes(item.status)).length;
    const completed = appointments.filter((item) => item.status === 'COMPLETED').length;

    return {
      today,
      pending,
      completed,
      earnings: `₹${today * 800}`,
    };
  }, [appointments]);

  const openEditor = (appointment) => {
    setSelected(appointment);
    setNotes(appointment?.notesByDoctor || '');
    setStatus(appointment?.status || 'IN_PROGRESS');
  };

  const closeEditor = () => {
    setSelected(null);
    setNotes('');
    setStatus('IN_PROGRESS');
  };

  const handleJoinCall = (appointment) => {
    const link = appointment?.meeting?.joinUrl;
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
      return;
    }

    alert('No meeting link found for this appointment.');
  };

  const saveUpdate = async () => {
    if (!selected?._id) return;
    setIsSaving(true);

    try {
      const { data } = await appointmentsAPI.updateStatus(selected._id, {
        status,
        notesByDoctor: notes,
      });

      const updated = data?.appointment;
      setAppointments((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      closeEditor();
    } catch (apiError) {
      alert(apiError?.response?.data?.message || 'Could not update appointment.');
    } finally {
      setIsSaving(false);
    }
  };

  const openCaseReport = async (appointment) => {
    if (!appointment?._id) return;
    setCaseSummaryLoading(true);
    setCaseSummaryError('');
    try {
      const { data } = await appointmentsAPI.caseSummary(appointment._id);
      setCaseSummary(data?.summary || null);
    } catch (apiError) {
      setCaseSummary(null);
      setCaseSummaryError(apiError?.response?.data?.message || 'Could not load case report.');
    } finally {
      setCaseSummaryLoading(false);
    }
  };

  const closeCaseReport = () => {
    setCaseSummary(null);
    setCaseSummaryError('');
    setCaseSummaryLoading(false);
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              Clinician Portal
            </div>
            <h1 className="text-4xl font-bold text-slate-900 font-serif">Welcome, {user?.fullName || user?.name || 'Doctor'}</h1>
          </div>
          <div className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Appointments', val: stats.today, color: 'text-slate-800' },
            { label: 'Pending', val: stats.pending, color: 'text-amber-600' },
            { label: 'Completed', val: stats.completed, color: 'text-emerald-600' },
            { label: 'Est. Earnings', val: stats.earnings, color: 'text-blue-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <h3 className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.val}</h3>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden min-h-[400px] p-8">
          <h2 className="text-2xl font-bold text-slate-800 font-serif mb-6">Appointments</h2>

          {loading ? (
            <div className="text-center py-20 text-slate-500">Loading appointments...</div>
          ) : error ? (
            <div className="text-center py-20 text-rose-600 font-semibold">{error}</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-20 text-slate-400">No appointments assigned yet.</div>
          ) : (
            <div className="grid gap-4">
              {appointments.map((appt) => (
                <div key={appt._id} className="flex flex-col lg:flex-row lg:items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{appt?.patientId?.fullName || 'Patient'}</h3>
                    <p className="text-slate-500 text-sm">{appt.slotDate} at {appt.slotTime}</p>
                    <p className="text-xs mt-1 font-bold text-blue-600 uppercase">Status: {appt.status}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openCaseReport(appt)} className="px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700">
                      Case Report
                    </button>
                    <button onClick={() => handleJoinCall(appt)} className="px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700">
                      Join Call
                    </button>
                    <button onClick={() => openEditor(appt)} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-100">
                      Update Status
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeEditor}></div>
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-xl p-8">
            <h3 className="text-2xl font-bold text-slate-900 font-serif mb-1">Update Appointment</h3>
            <p className="text-slate-500 text-sm mb-6">{selected?.patientId?.fullName || 'Patient'}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500">
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="NO_SHOW">NO_SHOW</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Doctor Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 resize-none" placeholder="Add notes for this consultation" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeEditor} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100">Cancel</button>
              <button onClick={saveUpdate} disabled={isSaving} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save Update'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {(caseSummaryLoading || caseSummary || caseSummaryError) ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeCaseReport}></div>
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl p-8 max-h-[85vh] overflow-auto">
            <h3 className="text-2xl font-bold text-slate-900 font-serif mb-1">Patient Case Report</h3>
            <p className="text-slate-500 text-sm mb-6">
              {(caseSummary?.appointment?.patientId?.fullName || 'Patient')}
            </p>

            {caseSummaryLoading ? (
              <div className="text-slate-500">Loading case report...</div>
            ) : caseSummaryError ? (
              <div className="text-rose-600 font-semibold">{caseSummaryError}</div>
            ) : caseSummary ? (
              <div className="space-y-5">
                <section className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <h4 className="font-bold text-slate-800 mb-2">Appointment Snapshot</h4>
                  <p className="text-sm text-slate-600">
                    {caseSummary?.appointment?.slotDate} at {caseSummary?.appointment?.slotTime} | Status: {caseSummary?.appointment?.status}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Symptom summary: {caseSummary?.appointment?.symptomSummary || 'Not provided by patient.'}
                  </p>
                </section>

                <section className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <h4 className="font-bold text-slate-800 mb-2">Longitudinal Symptom Memory</h4>
                  {caseSummary?.symptomMemory ? (
                    <>
                      <p className="text-sm text-slate-600">
                        Top recurring symptoms: {(caseSummary.symptomMemory.topSymptoms || []).join(', ') || 'N/A'}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        Likely contributors: {(caseSummary.symptomMemory.likelyCauses || []).join(', ') || 'N/A'}
                      </p>
                      <div className="mt-3 space-y-2">
                        {(caseSummary.symptomMemory.recentConversationSignals || []).map((entry, index) => (
                          <div key={`${entry.createdAt || index}`} className="bg-white border border-slate-200 rounded-xl p-3">
                            <p className="text-xs font-bold text-slate-500 uppercase">{entry.source} | {new Date(entry.createdAt).toLocaleString()}</p>
                            <p className="text-sm text-slate-700 mt-1">{entry.snippet || 'No additional context.'}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">No longitudinal memory available yet.</p>
                  )}
                </section>

                <section className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <h4 className="font-bold text-slate-800 mb-2">Recent Assessments</h4>
                  {(caseSummary.recentAssessments || []).length === 0 ? (
                    <p className="text-sm text-slate-500">No recent symptom assessments.</p>
                  ) : (
                    <div className="space-y-2">
                      {(caseSummary.recentAssessments || []).slice(0, 5).map((item) => (
                        <div key={item._id} className="bg-white border border-slate-200 rounded-xl p-3">
                          <p className="text-xs font-bold text-slate-500 uppercase">
                            {new Date(item.createdAt).toLocaleString()} | {item?.triage?.severityLevel || 'N/A'}
                          </p>
                          <p className="text-sm text-slate-700 mt-1">
                            Symptoms: {(item.symptoms || []).map((sym) => sym.name).join(', ') || 'N/A'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            ) : null}

            <div className="flex justify-end mt-6">
              <button onClick={closeCaseReport} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100">
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
