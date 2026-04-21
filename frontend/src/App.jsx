import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Components
import Navbar from "./components/common/Navbar";
import ChatAssistantWidget from "./components/chatbot/ChatAssistantWidget";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Pages
import Landing from "./pages/Landing";
import SymptomInput from "./pages/SymptomInput";
import Results from "./pages/Results";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import About from "./pages/About";
import KnowledgeBase from "./pages/KnowledgeBase";
import Services from "./pages/Services";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import DoctorList from "./pages/DoctorList";       // <--- NEW
import DoctorProfile from "./pages/DoctorProfile"; // <--- NEW
import ConsultationRoom from "./pages/ConsultationRoom";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />

        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<Landing />} />
          
          {/* Authentication Page */}
          <Route path="/login" element={<Login />} />
          
          {/* Patient App Features */}
          <Route
            path="/symptoms"
            element={
              <ProtectedRoute roles={["patient"]}>
                <SymptomInput />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute roles={["patient"]}>
                <Results />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={["patient"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          {/* DOCTOR SECTION ROUTES */}
          <Route
            path="/doctors"
            element={
              <ProtectedRoute roles={["patient"]}>
                <DoctorList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctors/:id"
            element={
              <ProtectedRoute roles={["patient"]}>
                <DoctorProfile />
              </ProtectedRoute>
            }
          />
          
          {/* Doctor Portal */}
          <Route
            path="/doctor-dashboard"
            element={
              <ProtectedRoute roles={["doctor"]}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/consultation/:roomId"
            element={
              <ProtectedRoute roles={["patient", "doctor", "admin"]}>
                <ConsultationRoom />
              </ProtectedRoute>
            }
          />
          
          {/* Informational Pages */}
          <Route
            path="/services"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Services />
              </ProtectedRoute>
            }
          />
          <Route path="/about" element={<About />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />

          {/* Fallback */}
          <Route path="*" element={<Landing />} />
        </Routes>

        <ChatAssistantWidget />
      </Router>
    </AuthProvider>
  );
}

export default App;
