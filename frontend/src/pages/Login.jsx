import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../utils/api";

export default function Login() {
  const [role, setRole] = useState('patient');
  const [isFlipped, setIsFlipped] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [errorMessage, setErrorMessage] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine redirect path
  const redirectPath = location.state?.from || (role === 'doctor' ? "/doctor-dashboard" : "/dashboard");
  const alertMessage = location.state?.message;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    license: "" // Extra field for doctors
  });

  const extractApiError = (error, fallback) => {
    const validationMessage = error?.response?.data?.errors?.[0]?.message;
    return validationMessage || error?.response?.data?.message || fallback;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

   const getRedirectForRole = (targetRole) => {
     if (targetRole === 'doctor') return '/doctor-dashboard';
     if (targetRole === 'admin') return '/admin-dashboard';
     return '/dashboard';
   };

   // ===== 1. LOGIN HANDLER (Enters the Portal) =====
   const handleLogin = async (e) => {
    e.preventDefault();
      setIsSubmitting(true);
      setErrorMessage('');

      try {
         const identifier = String(formData.email || '').trim();
         const payload = { password: formData.password };
         if (identifier.includes('@')) {
           payload.email = identifier;
         } else {
           payload.phone = identifier;
         }

         const { data } = await authAPI.login(payload);

         const user = login({ token: data?.token, user: data?.user });
         navigate(location.state?.from || getRedirectForRole(user?.role || role));
      } catch (error) {
         setErrorMessage(extractApiError(error, 'Login failed. Please check your credentials.'));
      } finally {
         setIsSubmitting(false);
      }
  };

  // ===== 2. SIGNUP HANDLER (Redirects to Login) =====
   const handleSignup = async (e) => {
    e.preventDefault();
      setIsSubmitting(true);
      setErrorMessage('');

      try {
         if (!String(formData.name || '').trim()) {
           setErrorMessage('Full Name is required.');
           setIsSubmitting(false);
           return;
         }
         if (!String(formData.email || '').trim()) {
           setErrorMessage('Email is required.');
           setIsSubmitting(false);
           return;
         }
         if (!String(formData.password || '').trim()) {
           setErrorMessage('Password is required.');
           setIsSubmitting(false);
           return;
         }

         const { data } = await authAPI.register({
            fullName: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
            role,
         });

         const user = login({ token: data?.token, user: data?.user });
         navigate(getRedirectForRole(user?.role || role));
      } catch (error) {
         setErrorMessage(extractApiError(error, 'Registration failed. Please try again.'));
      } finally {
         setIsSubmitting(false);
      }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900 perspective-1000 py-10">
      
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-slate-50">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/60 rounded-full blur-[80px] opacity-70 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-50/60 rounded-full blur-[80px] opacity-70" />
      </div>

      {/* Clean Header */}
      <div className="absolute top-10 left-0 w-full flex justify-center z-20">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
              A
            </div>
            <span className="font-bold text-2xl text-slate-800 font-serif tracking-tight">
              AyuSetu
            </span>
         </div>
      </div>

      {/* 3D Card Container */}
      <div className="w-full max-w-md px-4 perspective group">
        <div className={`grid grid-cols-1 grid-rows-1 transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* ==============================
              FRONT: LOGIN FORM
          ============================== */}
          <div className="col-start-1 row-start-1 backface-hidden z-10">
             <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl rounded-[2rem] p-8 relative overflow-hidden">
                
                {/* ROLE TOGGLE */}
                <div className="flex justify-center mb-6">
                   <div className="bg-slate-100 p-1 rounded-xl flex relative">
                      <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ${role === 'doctor' ? 'left-[calc(50%+2px)]' : 'left-1'}`}></div>
                      <button onClick={() => setRole('patient')} className={`relative z-10 px-6 py-1.5 text-sm font-bold transition-colors ${role === 'patient' ? 'text-blue-600' : 'text-slate-500'}`}>Patient</button>
                      <button onClick={() => setRole('doctor')} className={`relative z-10 px-6 py-1.5 text-sm font-bold transition-colors ${role === 'doctor' ? 'text-blue-600' : 'text-slate-500'}`}>Doctor</button>
                   </div>
                </div>

                <div className="text-center mb-6">
                  {alertMessage ? (
                     <div className="mb-4 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-medium animate-fade-in-down">✨ {alertMessage}</div>
                  ) : (
                     <h2 className="text-2xl font-bold text-slate-800 font-serif">
                       {role === 'doctor' ? 'Clinician Portal' : 'Welcome Back'}
                     </h2>
                  )}
                  <p className="text-slate-500 text-sm">
                    {role === 'doctor' ? 'Secure login for medical practitioners.' : 'Sign in to access your health dashboard.'}
                  </p>
                           {errorMessage ? (
                              <div className="mt-3 bg-rose-50 text-rose-700 px-4 py-2 rounded-xl text-sm font-medium">
                                 {errorMessage}
                              </div>
                           ) : null}
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Email</label>
                      <input 
                        type="text" 
                        name="email" 
                        value={formData.email} // Controlled input to keep email after signup
                        placeholder={role === 'doctor' ? "dr.name@hospital.com or phone" : "name@example.com or phone"}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" 
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Password</label>
                      <input 
                        type="password" 
                        name="password" 
                        value={formData.password}
                        placeholder="••••••••"
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" 
                      />
                   </div>

                   <button type="submit" className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all">
                      {isSubmitting ? 'Please wait...' : (role === 'doctor' ? 'Access Portal' : 'Sign In')}
                   </button>
                </form>

                {/* Switch to Signup */}
                <div className="mt-6 text-center border-t border-slate-100 pt-6">
                   <p className="text-slate-500 text-sm">
                      {role === 'doctor' ? 'New Practitioner?' : 'New here?'} 
                      <button onClick={() => setIsFlipped(true)} className="font-bold text-blue-600 hover:underline ml-1">
                         Create Account
                      </button>
                   </p>
                </div>
             </div>
          </div>

          {/* ==============================
              BACK: SIGN UP FORM
          ============================== */}
          <div className="col-start-1 row-start-1 backface-hidden rotate-y-180 z-10">
             <div className="bg-gradient-to-b from-blue-50 to-white backdrop-blur-xl border border-blue-200 shadow-2xl rounded-[2rem] p-8 relative overflow-hidden">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-blue-900 font-serif">
                     {role === 'doctor' ? 'Join Medical Network' : 'Join AyuSetu'}
                  </h2>
                  <p className="text-slate-500 text-sm">
                     {role === 'doctor' ? 'Register your clinic.' : 'Create your patient profile.'}
                  </p>
                  {errorMessage ? (
                    <div className="mt-3 bg-rose-50 text-rose-700 px-4 py-2 rounded-xl text-sm font-medium">
                      {errorMessage}
                    </div>
                  ) : null}
                </div>
                
                <form onSubmit={handleSignup} className="space-y-3">
                   <input 
                     type="text" 
                     name="name"
                     onChange={handleChange}
                     placeholder={role === 'doctor' ? "Dr. Full Name" : "Full Name"} 
                     className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl outline-none focus:border-blue-500" 
                   />
                   <input 
                     type="email" 
                     name="email"
                     onChange={handleChange}
                     placeholder="Email Address" 
                     className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl outline-none focus:border-blue-500" 
                   />
                   
                   {/* License ID for Doctors */}
                   {role === 'doctor' && (
                      <input 
                        type="text" 
                        name="license"
                        onChange={handleChange}
                        placeholder="Medical License ID" 
                        className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl outline-none focus:border-blue-500" 
                      />
                   )}

                   <input 
                     type="password" 
                     name="password"
                     onChange={handleChange}
                     placeholder="Create Password" 
                     className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl outline-none focus:border-blue-500" 
                   />

                   <button className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg mt-2 hover:bg-blue-700 transition-all">
                      {isSubmitting ? 'Please wait...' : (role === 'doctor' ? 'Register' : 'Create Account')}
                   </button>
                </form>

                <div className="mt-6 text-center">
                   <button onClick={() => setIsFlipped(false)} className="text-sm font-bold text-blue-600 hover:underline">
                      Back to Sign In
                   </button>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
