import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { appointmentsAPI, doctorsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const toDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getAvailableDateMap = (availability = []) => {
  const dateMap = {};
  availability.forEach((entry) => {
    const date = entry?.date;
    if (!date) return;

    const openSlots = (entry?.slots || [])
      .filter((slot) => slot?.status === 'AVAILABLE' && slot?.time)
      .map((slot) => slot.time);

    if (openSlots.length > 0) {
      dateMap[date] = openSlots;
    }
  });
  return dateMap;
};

const getNextAvailableDate = (availableDateMap, preferredDate) => {
  if (availableDateMap[preferredDate]?.length) return preferredDate;

  const availableDates = Object.keys(availableDateMap).sort((a, b) => a.localeCompare(b));
  const nextUpcoming = availableDates.find((date) => date >= preferredDate);
  return nextUpcoming || availableDates[0] || preferredDate;
};

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const [selectedDate, setSelectedDate] = useState(toDateValue(new Date()));
  const [selectedSlot, setSelectedSlot] = useState('');
  const [formData, setFormData] = useState({
    reason: '',
  });

  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      setError('');

      try {
        const [doctorRes, availabilityRes] = await Promise.all([
          doctorsAPI.getById(id),
          doctorsAPI.getAvailability(id),
        ]);

        setDoctor(doctorRes?.data?.doctor || null);
        setAvailability(availabilityRes?.data?.availability || []);
      } catch (apiError) {
        setError(apiError?.response?.data?.message || 'Could not load doctor profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [id]);

  const availableDateMap = useMemo(() => getAvailableDateMap(availability), [availability]);

  const slotsForSelectedDate = useMemo(
    () => availableDateMap[selectedDate] || [],
    [availableDateMap, selectedDate]
  );

  const hasAnySlots = Object.keys(availableDateMap).length > 0;

  useEffect(() => {
    const today = toDateValue(new Date());
    setSelectedDate((current) => getNextAvailableDate(availableDateMap, current || today));
  }, [availableDateMap]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      navigate('/login', {
        state: {
          from: `/doctors/${id}`,
          message: 'Please sign in to book your appointment.',
        },
      });
      return;
    }

    setIsBooking(true);
    setBookingError('');

    try {
      await appointmentsAPI.create({
        doctorId: id,
        date: selectedDate,
        time: selectedSlot,
        consultationType: 'telemedicine',
        symptomSummary: formData.reason,
      });

      setBookingStep(2);
    } catch (apiError) {
      setBookingError(apiError?.response?.data?.message || 'Booking failed. Please choose another slot.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setBookingError('');
    setTimeout(() => {
      setBookingStep(1);
      setSelectedSlot('');
      setSelectedDate(getNextAvailableDate(availableDateMap, toDateValue(new Date())));
      setFormData({ reason: '' });
    }, 200);
  };

  if (loading) {
    return <div className="min-h-screen pt-40 text-center text-slate-600">Loading doctor profile...</div>;
  }

  if (error || !doctor) {
    return <div className="min-h-screen pt-40 text-center text-rose-600 font-semibold">{error || 'Doctor not found'}</div>;
  }

  const specialty = doctor?.doctorProfile?.specialty || 'Specialist';
  const rating = Number(doctor?.doctorProfile?.rating || 0).toFixed(1);
  const experience = Number(doctor?.doctorProfile?.experienceYears || 0);
  const fee = Number(doctor?.doctorProfile?.consultationFee || 0);

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/doctors" className="hover:text-blue-600">Doctors</Link>
          <span>/</span>
          <span className="text-slate-800 font-bold">{doctor.fullName}</span>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-lg sticky top-32">
              <div className="w-32 h-32 bg-blue-50 rounded-3xl mx-auto flex items-center justify-center text-6xl shadow-inner mb-6">👨‍⚕️</div>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">{doctor.fullName}</h1>
                <p className="text-blue-600 font-bold text-sm uppercase tracking-wide">{specialty}</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-3">
                  <span className="text-slate-500">Experience</span>
                  <span className="font-bold text-slate-800">{experience} years</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-3">
                  <span className="text-slate-500">Rating</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">{rating} <span className="text-amber-500">★</span></span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-3">
                  <span className="text-slate-500">Fee</span>
                  <span className="font-bold text-slate-800">₹{fee}</span>
                </div>
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 hover:scale-[1.02] transition-all"
              >
                Book Appointment
              </button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4 font-serif">About {doctor.fullName}</h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                {doctor?.doctorProfile?.bio || 'Experienced Ayurvedic specialist focused on practical, evidence-informed care.'}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="block text-xs font-bold text-slate-400 uppercase">Qualification</span>
                  <span className="block font-bold text-slate-800 mt-1">
                    {Array.isArray(doctor?.doctorProfile?.qualifications)
                      ? doctor.doctorProfile.qualifications.join(', ')
                      : doctor?.doctorProfile?.qualifications || 'BAMS'}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="block text-xs font-bold text-slate-400 uppercase">Languages</span>
                  <span className="block font-bold text-slate-800 mt-1">
                    {Array.isArray(doctor?.doctorProfile?.languages)
                      ? doctor.doctorProfile.languages.join(', ')
                      : doctor?.doctorProfile?.languages || 'English'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 font-serif">Clinic Availability</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors">
                  <span className="font-medium text-slate-600">Location</span>
                  <span className="text-sm font-bold text-blue-600">{doctor?.doctorProfile?.location || 'Online'}</span>
                </div>
                <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors">
                  <span className="font-medium text-slate-600">Open slots loaded</span>
                  <span className="text-sm font-bold text-blue-600">{Object.keys(availableDateMap).length} day(s)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleClose}></div>
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            {bookingStep === 1 && (
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 font-serif">Book Appointment</h2>
                  <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Date</label>
                      <input
                        type="date"
                        required
                        value={selectedDate}
                        min={toDateValue(new Date())}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setSelectedSlot('');
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Available Slots</label>
                      <div className="flex flex-wrap gap-2">
                        {slotsForSelectedDate.length > 0 ? (
                          slotsForSelectedDate.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                                selectedSlot === slot
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                              }`}
                            >
                              {slot}
                            </button>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500">
                            {hasAnySlots
                              ? 'No available slots for this date. Please choose another date.'
                              : 'This doctor has not published any slots yet. Doctor can add slots from Doctor Dashboard.'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">Consultation Note</h3>
                    <textarea
                      name="reason"
                      placeholder="Briefly describe your concern"
                      value={formData.reason}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 resize-none h-24"
                    />
                  </div>

                  {bookingError ? <p className="text-sm text-rose-600 font-medium">{bookingError}</p> : null}

                  <button
                    type="submit"
                    disabled={!selectedSlot || isBooking}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBooking ? 'Confirming...' : 'Confirm Appointment'}
                  </button>
                </form>
              </div>
            )}

            {bookingStep === 2 && (
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 font-serif mb-2">Booked!</h2>
                <p className="text-slate-500 mb-8">
                  Your appointment with <span className="font-bold text-slate-800">{doctor.fullName}</span> is confirmed.
                </p>
                <Link
                  to="/dashboard"
                  className="block w-full py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-all"
                >
                  Go to Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
