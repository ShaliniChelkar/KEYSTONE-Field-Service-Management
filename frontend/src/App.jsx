import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import CustomerDashboard from "./pages/CustomerDashboard";
import RequestService from "./pages/RequestService";
import MyRequests from "./pages/MyRequests";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import DispatcherDashboard from "./pages/DispatcherDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* CUSTOMER */}
        <Route path="/customer" element={<CustomerDashboard />} />
        <Route path="/request-service" element={<RequestService />} />
        <Route path="/my-requests" element={<MyRequests />} />

        {/* COMMON */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />

        {/* TECHNICIAN */}
        <Route
          path="/technician"
          element={<TechnicianDashboard />}
        />

        {/* ADMIN / MANAGER */}
        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        {/* DISPATCHER */}
        <Route
          path="/dispatcher"
          element={<DispatcherDashboard />}
        />

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;