/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ExploreScreen from "./screens/Explore";
import SearchScreen from "./screens/Search";
import TutorDetailScreen from "./screens/TutorDetail";
import BookingSummaryScreen from "./screens/BookingSummary";
import LearningScreen from "./screens/Learning";
import MessagesScreen from "./screens/Messages";
import ProfileScreen from "./screens/Profile";
import VerificationScreen from "./screens/Verification";
import NotificationsScreen from "./screens/Notifications";
import PaymentsScreen from "./screens/Payments";
import SavedTutorsScreen from "./screens/SavedTutors";
import HelpSupportScreen from "./screens/HelpSupport";
import ActiveSessionsScreen from "./screens/ActiveSessions";
import ActiveChatsScreen from "./screens/ActiveChats";
import SettingsScreen from "./screens/Settings";
import TutorDashboard from "./screens/TutorDashboard";
import AdminDashboard from "./screens/AdminDashboard";
import ChatDetailScreen from "./screens/ChatDetail";
import LoginScreen from "./screens/Login";

import { FirebaseProvider, useAuth } from "./components/FirebaseProvider";
import { ConfigProvider } from "./components/ConfigProvider";

function AppRoutes() {
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-12 h-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginScreen /> : <Navigate to="/" replace />} />
      
      <Route path="/" element={isAuthenticated ? <ExploreScreen /> : <Navigate to="/login" replace />} />
      <Route path="/search" element={isAuthenticated ? <SearchScreen /> : <Navigate to="/login" replace />} />
      <Route path="/tutor/:id" element={isAuthenticated ? <TutorDetailScreen /> : <Navigate to="/login" replace />} />
      <Route path="/booking-summary" element={isAuthenticated ? <BookingSummaryScreen /> : <Navigate to="/login" replace />} />
      <Route path="/learning" element={isAuthenticated ? <LearningScreen /> : <Navigate to="/login" replace />} />
      <Route path="/messages" element={isAuthenticated ? <MessagesScreen /> : <Navigate to="/login" replace />} />
      <Route path="/chat/:id" element={isAuthenticated ? <ChatDetailScreen /> : <Navigate to="/login" replace />} />
      <Route path="/profile" element={isAuthenticated ? <ProfileScreen /> : <Navigate to="/login" replace />} />
      <Route path="/verification" element={isAuthenticated ? <VerificationScreen /> : <Navigate to="/login" replace />} />
      <Route path="/notifications" element={isAuthenticated ? <NotificationsScreen /> : <Navigate to="/login" replace />} />
      <Route path="/payments" element={isAuthenticated ? <PaymentsScreen /> : <Navigate to="/login" replace />} />
      <Route path="/settings" element={isAuthenticated ? <SettingsScreen /> : <Navigate to="/login" replace />} />
      <Route path="/tutor-dashboard" element={isAuthenticated ? <TutorDashboard /> : <Navigate to="/login" replace />} />
      <Route path="/admin" element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/login" replace />} />
      <Route path="/saved" element={isAuthenticated ? <SavedTutorsScreen /> : <Navigate to="/login" replace />} />
      <Route path="/help" element={isAuthenticated ? <HelpSupportScreen /> : <Navigate to="/login" replace />} />
      <Route path="/active-sessions" element={isAuthenticated ? <ActiveSessionsScreen /> : <Navigate to="/login" replace />} />
      <Route path="/active-chats" element={isAuthenticated ? <ActiveChatsScreen /> : <Navigate to="/login" replace />} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <FirebaseProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </FirebaseProvider>
    </ConfigProvider>
  );
}
