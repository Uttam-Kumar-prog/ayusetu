import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dashboardPath =
    user?.role === 'doctor'
      ? '/doctor-dashboard'
      : user?.role === 'admin'
      ? '/admin-dashboard'
      : user?.role === 'patient'
      ? '/dashboard'
      : user?.role === 'pharmacy'
      ? '/knowledge'
      : '/';
  const dashboardLabel =
    user?.role === 'doctor'
      ? 'Clinician Panel'
      : user?.role === 'admin'
      ? 'Admin Console'
      : user?.role === 'patient'
      ? 'My Dashboard'
      : user?.role === 'pharmacy'
      ? 'Pharmacy Portal'
      : 'Dashboard';

  // 1. Hook Logic (ALWAYS call these first)
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // 2. Navigation Logic (Define this before returning)
  let navLinks = [];
  if (!user) {
     navLinks = [
        { name: "Home", path: "/" },
        { name: "About", path: "/about" },
        { name: "Knowledge", path: "/knowledge" },
     ];
  } else if (user.role === 'doctor') {
     navLinks = [
        { name: "Portal", path: "/doctor-dashboard" },
        { name: "Patients", path: "/doctor-dashboard" },
        { name: "Resources", path: "/knowledge" },
     ];
  } else if (user.role === 'admin') {
     navLinks = [
        { name: "Home", path: "/" },
        { name: "Admin", path: "/admin-dashboard" },
        { name: "Services", path: "/services" },
        { name: "Knowledge", path: "/knowledge" },
     ];
  } else if (user.role === 'pharmacy') {
     navLinks = [
        { name: "Home", path: "/" },
        { name: "Knowledge", path: "/knowledge" },
     ];
  } else {
     navLinks = [
        { name: "Home", path: "/" },
        { name: "Symptoms", path: "/symptoms" },
        { name: "Find Doctors", path: "/doctors" },
        { name: "About", path: "/about" },
        { name: "Knowledge", path: "/knowledge" },
     ];
  }

  // 3. Conditional Return (MUST be after all hooks)
  // Now it's safe to hide the navbar because hooks have already run.
  if (location.pathname === '/login') {
    return null;
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "py-4" : "py-6"}`}>
        <div className={`mx-auto max-w-6xl px-6 transition-all duration-300 ${isScrolled ? "bg-white/80 backdrop-blur-md shadow-lg shadow-blue-900/5 border border-white/50 rounded-full py-3" : "bg-transparent py-2"}`}>
          <div className="flex items-center justify-between">
            
            {/* LOGO */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-blue-200 group-hover:shadow-lg transition-all">A</div>
              <span className="text-xl font-bold text-slate-800 font-serif group-hover:text-blue-700 transition-colors">AyuSetu</span>
              {user?.role === 'doctor' && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-1">MD</span>}
              {user?.role === 'admin' && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-1">ADM</span>}
            </Link>

            {/* DESKTOP LINKS */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link key={link.name} to={link.path} className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors relative group">
                  {link.name}
                  <span className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-blue-600 group-hover:w-full group-hover:left-0 transition-all duration-300" />
                </Link>
              ))}
            </div>

            {/* BUTTONS */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <Link to={dashboardPath} className="text-sm font-semibold text-slate-600 hover:text-blue-700 transition-colors">
                     {dashboardLabel}
                  </Link>
                  <button onClick={() => { logout(); navigate('/'); }} className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-full shadow-lg hover:bg-slate-800 transition-all">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-700 transition-colors">Sign In</Link>
                  <Link to="/login" className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all">Get Started</Link>
                </>
              )}
            </div>

            {/* MOBILE HAMBURGER */}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-slate-700 p-2 focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className={`fixed inset-0 z-40 bg-white/95 backdrop-blur-xl transition-all duration-300 md:hidden flex flex-col items-center justify-center gap-8 ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
         {navLinks.map((link) => (
            <Link key={link.name} to={link.path} onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-slate-800 hover:text-blue-600">{link.name}</Link>
         ))}
         {user && <button onClick={() => { logout(); setIsMobileMenuOpen(false); navigate('/'); }} className="text-xl text-slate-500 font-bold">Logout</button>}
      </div>
    </>
  );
}
