import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./pages/dashboard.jsx";
import AppContent from "./AppContent.jsx";

export default function App() {
  return (
    <Router>
      <Navbar />
      
      
      <Routes>
        {/* Admin Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Default route for non-admin users */}
        <Route
          path="/"
          element={
            <div className="flex flex-col items-center justify-center h-screen text-center">
              <h1 className="text-3xl font-bold text-pink-500">Hello User 👋</h1>
              <p className="mt-2 text-gray-400">
                You are logged in. Only the admin can view the dashboard.
              </p>
            </div>
          }
        />
      </Routes>
      <AppContent />
    </Router>
    
  );
}
