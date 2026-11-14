import React from 'react';
import {
  ShieldCheck,
  FileText,
  BookOpen,
  Building2,
  Activity,
  ArrowRight,
  User,
  Star,
  Upload,
  Target,
  TrendingUp,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import ProgressBar from '../../components/ui/ProgressBar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const recentActivity = [
  { id: 1, icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50', text: 'JavaScript skill verified via HackerRank assessment', time: '2 hours ago' },
  { id: 2, icon: Upload, color: 'text-indigo-600 bg-indigo-50', text: 'Uploaded project evidence for React skill', time: '5 hours ago' },
  { id: 3, icon: Star, color: 'text-amber-600 bg-amber-50', text: 'Received endorsement from Prof. Mehta for Python', time: '1 day ago' },
  { id: 4, icon: Building2, color: 'text-sky-600 bg-sky-50', text: 'Applied to TCS Digital — Full Stack Developer', time: '2 days ago' },
  { id: 5, icon: BookOpen, color: 'text-purple-600 bg-purple-50', text: 'Completed "Advanced React Patterns" learning task', time: '3 days ago' },
];

const recommendedActions = [
  { id: 1, icon: Target, title: 'Complete Your Profile', description: 'Add your GitHub and LinkedIn profiles to boost visibility.', buttonLabel: 'Update Profile', color: 'indigo' },
  { id: 2, icon: ShieldCheck, title: 'Verify Python Skill', description: 'Take the assessment to get your Python skill verified.', buttonLabel: 'Start Assessment', color: 'emerald' },
  { id: 3, icon: TrendingUp, title: 'Review Skill Gaps', description: 'Check your gap analysis for Full Stack Developer role.', buttonLabel: 'View Analysis', color: 'amber' },
];

export default function Overview() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Dashboard"
        subtitle="Welcome back, Priya! Here's your placement readiness overview."
        breadcrumbs={[
          { label: 'Student', href: '/student' },
          { label: 'Overview' },
        ]}
      />

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm shrink-0">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold">Welcome back, Priya Sharma!</h2>
            <p className="text-indigo-100 mt-1 text-sm">B.Tech Computer Science — Class of 2025</p>
            <div className="mt-4 max-w-md">
              <div className="flex items-center justify-between text-xs text-indigo-100 mb-1.5">
                <span>Profile Completion</span>
                <span className="font-semibold text-white">72%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: '72%' }} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -right-4 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Verified Skills" value="8" subtitle="3 verified this month" icon={ShieldCheck} accentColor="emerald" trend="+2" trendType="up" />
        <StatCard title="Evidence Items" value="23" subtitle="5 pending review" icon={FileText} accentColor="indigo" trend="+4" trendType="up" />
        <StatCard title="Learning Tasks" value="5" subtitle="2 in progress" icon={BookOpen} accentColor="violet" />
        <StatCard title="Upcoming Drives" value="3" subtitle="Next: TCS on Dec 15" icon={Building2} accentColor="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card title="Recent Activity" subtitle="Your latest actions" className="lg:col-span-2">
          <ul className="space-y-3">
            {recentActivity.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-2">
                <div className={`p-2 rounded-lg shrink-0 ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 leading-snug">{item.text}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Recommended Actions */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">Recommended Actions</h3>
          {recommendedActions.map((action) => (
            <Card key={action.id}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${
                  action.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                  action.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  <action.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900">{action.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 mb-3">{action.description}</p>
                  <Button size="xs" variant="outline" icon={ArrowRight} iconPosition="right">
                    {action.buttonLabel}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
