import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ReportItem } from './pages/ReportItem';
import { MyReports } from './pages/MyReports';
import { ClaimItem } from './pages/ClaimItem';
import { ItemDetails } from './pages/ItemDetails';
import { Profile } from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/report" element={
                <ProtectedRoute>
                  <ReportItem />
                </ProtectedRoute>
              } />
              <Route path="/my-reports" element={
                <ProtectedRoute>
                  <MyReports />
                </ProtectedRoute>
              } />
              <Route path="/item/:id" element={
                <ProtectedRoute>
                  <ItemDetails />
                </ProtectedRoute>
              } />
              <Route path="/claim/:id" element={
                <ProtectedRoute>
                  <ClaimItem />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;