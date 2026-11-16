import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  Briefcase,
  UserCheck,
  ShieldAlert,
  UserX,
  Mail,
  Shield,
  PlusCircle,
  UserPlus,
  History,
  Settings,
  ArrowRight,
  ExternalLink,
  Activity,
  Server,
  Database,
  Cpu
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function Overview() {
  const stats = [
    { title: 'Total Colleges', value: '18', subtitle: 'Affiliated institutions', icon: Building2, trend: '+3 this quarter', trendType: 'up', accentColor: 'indigo' },
    { title: 'Total Students', value: '14,820', subtitle: 'Active student profiles', icon: Users, trend: '+12.4% YoY', trendType: 'up', accentColor: 'sky' },
    { title: 'Total Recruiters', value: '248', subtitle: 'Verified corporate partners', icon: Briefcase, trend: '+18 this month', trendType: 'up', accentColor: 'emerald' },
    { title: 'Total College Admins', value: '36', subtitle: 'Institutional heads', icon: UserCheck, trend: 'Normal', trendType: 'neutral', accentColor: 'violet' },
    { title: 'Total TPO Admins', value: '52', subtitle: 'Placement coordinators', icon: Shield, trend: '+4 this month', trendType: 'up', accentColor: 'amber' },
    { title: 'Active Users', value: '15,120', subtitle: '98.4% engagement rate', icon: Activity, trend: '+5.2%', trendType: 'up', accentColor: 'emerald' },
    { title: 'Suspended Users', value: '14', subtitle: 'Policy / compliance flagged', icon: UserX, trend: '-2 this week', trendType: 'down', accentColor: 'slate' },
    { title: 'Pending Invitations', value: '29', subtitle: '7 expiring within 48h', icon: Mail, trend: 'Awaiting', trendType: 'neutral', accentColor: 'amber' },
  ];

  const recentColleges = [
    { id: 'col-1', name: 'MIT World Peace University', slug: 'mit-wpu', domain: 'mitwpu.edu.in', location: 'Pune, Maharashtra', admins: 3, students: 2450, status: 'Active', registeredAt: 'Nov 12, 2024' },
    { id: 'col-2', name: 'Stanford Institute of Technology', slug: 'sit-blr', domain: 'sit.edu.in', location: 'Bengaluru, Karnataka', admins: 2, students: 1890, status: 'Active', registeredAt: 'Nov 08, 2024' },
    { id: 'col-3', name: 'Delhi Technological University', slug: 'dtu-delhi', domain: 'dtu.ac.in', location: 'New Delhi', admins: 4, students: 3120, status: 'Active', registeredAt: 'Oct 29, 2024' },
    { id: 'col-4', name: 'National Institute of Tech Surathkal', slug: 'nitk', domain: 'nitk.edu.in', location: 'Surathkal, Karnataka', admins: 3, students: 2780, status: 'Active', registeredAt: 'Oct 15, 2024' },
    { id: 'col-5', name: 'Vellore Institute of Innovation', slug: 'vii-tn', domain: 'vii.edu.in', location: 'Vellore, Tamil Nadu', admins: 2, students: 1640, status: 'Suspended', registeredAt: 'Sep 20, 2024' },
  ];

  const recentAuditEvents = [
    { id: 'aud-101', actor: 'Platform Administrator', action: 'COLLEGE_REGISTERED', entity: 'MIT World Peace University (mit-wpu)', time: '14 mins ago', status: 'Success' },
    { id: 'aud-102', actor: 'Platform Administrator', action: 'INVITATION_ISSUED', entity: 'admin.tnp@sit.edu.in (TPO Admin)', time: '42 mins ago', status: 'Success' },
    { id: 'aud-103', actor: 'Automated Governance', action: 'USER_SUSPENDED', entity: 'fraud.check@vii.edu.in (Student)', time: '2 hours ago', status: 'Warning' },
    { id: 'aud-104', actor: 'Platform Administrator', action: 'ROLE_MODIFIED', entity: 'Dr. Rajiv Menon -> TPO Admin', time: '5 hours ago', status: 'Success' },
    { id: 'aud-105', actor: 'Platform Administrator', action: 'SECURITY_POLICY_UPDATED', entity: 'Session Timeout lowered to 30 mins', time: '1 day ago', status: 'Success' },
  ];

  const systemHealth = [
    { name: 'Core API Gateway', status: 'Operational', uptime: '99.98%', latency: '24ms', icon: Server },
    { name: 'Multi-Tenant Database', status: 'Operational', uptime: '100%', latency: '8ms', icon: Database },
    { name: 'Skill Evidence AI Fleet', status: 'Optimal', uptime: '99.94%', latency: '310ms', icon: Cpu },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin Platform Intelligence"
        subtitle="Cross-institution governance, multi-tenant isolation monitor, global identity and provisioning control plane."
        breadcrumbs={[{ label: 'Super Admin', href: '/super-admin' }, { label: 'Overview' }]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button to="/super-admin/colleges/new" variant="primary" size="sm">
              <PlusCircle className="h-4 w-4 mr-1.5" />
              Register College
            </Button>
            <Button to="/super-admin/users/new" variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-1.5" />
              Create User
            </Button>
            <Button to="/super-admin/invitations" variant="secondary" size="sm">
              <Mail className="h-4 w-4 mr-1.5" />
              Invitations
            </Button>
          </div>
        }
      />

      {/* 8 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => (
          <StatCard
            key={idx}
            title={s.title}
            value={s.value}
            subtitle={s.subtitle}
            icon={s.icon}
            trend={s.trend}
            trendType={s.trendType}
            accentColor={s.accentColor}
          />
        ))}
      </div>

      {/* System Infrastructure Health Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <h3 className="text-sm font-semibold text-slate-100">Global Cluster Health & Tenant Isolation Engine</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">All 18 institutional tenants isolated via PostgreSQL Row-Level Security (RLS).</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/super-admin/settings"
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              Configure Policies <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {systemHealth.map((sys, i) => {
            const Icon = sys.icon;
            return (
              <div key={i} className="flex items-center justify-between bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-700/60 text-slate-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{sys.name}</p>
                    <p className="text-[11px] text-slate-400">Latency: {sys.latency}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {sys.status}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">{sys.uptime} uptime</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Grid: Recent Colleges & Recent Platform Audit Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registered Colleges */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#009669]" />
                <h3 className="font-bold text-slate-900 text-sm">Recently Registered Colleges</h3>
              </div>
              <Link
                to="/super-admin/colleges"
                className="text-xs font-semibold text-[#009669] hover:text-[#004D36] flex items-center gap-1"
              >
                View All Colleges <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {recentColleges.map((col) => (
                <div key={col.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{col.name}</p>
                      <Badge variant={col.status === 'Active' ? 'emerald' : 'rose'} size="sm">
                        {col.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span>{col.domain}</span>
                      <span>•</span>
                      <span>{col.location}</span>
                      <span>•</span>
                      <span>{col.students.toLocaleString()} students</span>
                    </div>
                  </div>
                  <Link
                    to={`/super-admin/colleges`}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                    title="Manage College"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
            <span>Showing top 5 of 18 active institutions</span>
            <Button to="/super-admin/colleges/new" variant="secondary" size="sm">
              <PlusCircle className="h-3.5 w-3.5 mr-1" />
              New College
            </Button>
          </div>
        </Card>

        {/* Recent Audit Events */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-[#009669]" />
                <h3 className="font-bold text-slate-900 text-sm">Platform Audit Trail Stream</h3>
              </div>
              <Link
                to="/super-admin/audit-logs"
                className="text-xs font-semibold text-[#009669] hover:text-[#004D36] flex items-center gap-1"
              >
                Full Audit Trail <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {recentAuditEvents.map((evt) => (
                <div key={evt.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                        {evt.action}
                      </span>
                      <span className="text-xs text-slate-500">{evt.time}</span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 font-medium">{evt.entity}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Initiator: {evt.actor}</p>
                  </div>
                  <Badge variant={evt.status === 'Success' ? 'emerald' : 'amber'} size="sm">
                    {evt.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
            <span>Real-time event stream active</span>
            <Button to="/super-admin/audit-logs" variant="outline" size="sm">
              <History className="h-3.5 w-3.5 mr-1" />
              Explore All Logs
            </Button>
          </div>
        </Card>
      </div>

      {/* Quick Access Action Deck */}
      <Card className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-0">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center lg:text-left">
            <h3 className="text-base font-bold text-white flex items-center justify-center lg:justify-start gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
              Super Administrator Command Operations
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl">
              Execute cross-institution institutional provisioning, global role assignments, security policy rollouts, and audit exports.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Button to="/super-admin/colleges/new" variant="primary" size="sm">
              <PlusCircle className="h-4 w-4 mr-1.5" />
              Register College
            </Button>
            <Button to="/super-admin/users/new" variant="secondary" size="sm">
              <UserPlus className="h-4 w-4 mr-1.5" />
              Create User
            </Button>
            <Button to="/super-admin/settings" variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Settings className="h-4 w-4 mr-1.5" />
              Platform Settings
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
