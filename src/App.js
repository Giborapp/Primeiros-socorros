import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import LandingScreen from './screens/LandingScreen';
import RegisterSchoolScreen from './screens/RegisterSchoolScreen';
import RoleSelectScreen from './screens/RoleSelectScreen';
import TeacherPinScreen from './screens/TeacherPinScreen';
import StudentLoginScreen from './screens/StudentLoginScreen';
import CharacterCreatorScreen from './screens/CharacterCreatorScreen';
import BoardScreen from './screens/BoardScreen';
import QuestionScreen from './screens/QuestionScreen';
import VictoryScreen from './screens/VictoryScreen';
import RankingScreen from './screens/RankingScreen';
import TeacherDashboardScreen from './screens/TeacherDashboardScreen';
import RivePreviewScreen from './screens/RivePreviewScreen';
import StudentHomeScreen from './screens/StudentHomeScreen';
import './App.css';

function Spinner() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="spinner" />
    </div>
  );
}

function Guard({ children }) {
  const { user } = useApp();
  if (user === undefined) return <Spinner />;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function TeacherGuard({ children }) {
  const { user, isTeacher } = useApp();
  if (user === undefined) return <Spinner />;
  if (!user) return <Navigate to="/" replace />;
  if (!isTeacher) return <Navigate to="/teacher/pin" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useApp();
  if (user === undefined) return <Spinner />;
  return (
    <Routes>
      <Route path="/"               element={user ? <Navigate to="/role" replace /> : <LandingScreen />} />
      <Route path="/register"       element={<RegisterSchoolScreen />} />
      <Route path="/role"           element={<Guard><RoleSelectScreen /></Guard>} />
      <Route path="/teacher/pin"    element={<Guard><TeacherPinScreen /></Guard>} />
      <Route path="/student/login"  element={<Guard><StudentLoginScreen /></Guard>} />
      <Route path="/student/home"   element={<Guard><StudentHomeScreen /></Guard>} />
      <Route path="/character"      element={<Guard><CharacterCreatorScreen /></Guard>} />
      <Route path="/board"          element={<Guard><BoardScreen /></Guard>} />
      <Route path="/play/:topicIdx" element={<Guard><QuestionScreen /></Guard>} />
      <Route path="/victory"        element={<Guard><VictoryScreen /></Guard>} />
      <Route path="/ranking"              element={<Guard><RankingScreen /></Guard>} />
      <Route path="/teacher/dashboard"  element={<TeacherGuard><TeacherDashboardScreen /></TeacherGuard>} />
      <Route path="/rive-preview"    element={<RivePreviewScreen />} />
      <Route path="*"               element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
