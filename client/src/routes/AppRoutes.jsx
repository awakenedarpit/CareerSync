import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LandingPage from '../pages/landing/LandingPage';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import StudentPreview from '../pages/student/StudentPreview';
import AdminPreview from '../pages/admin/AdminPreview';
import RecruiterPreview from '../pages/recruiter/RecruiterPreview';
import Button from '../components/common/Button';

function NotFoundPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 flex flex-col items-center justify-center text-center">
      <div className="text-6xl font-black text-indigo-500 mb-4">404</div>
      <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
      <p className="text-slate-400 text-sm max-w-md mb-6">
        The requested URL was not found in the CarrerSync platform.
      </p>
      <Button to="/" variant="primary" size="md">
        Return to Landing Page
      </Button>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/student" element={<StudentPreview />} />
        <Route path="/admin" element={<AdminPreview />} />
        <Route path="/recruiter" element={<RecruiterPreview />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
