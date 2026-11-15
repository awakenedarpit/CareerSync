import React, { useState, useEffect } from 'react';
import {
  Plus,
  Calendar,
  Award,
  Users,
  Download,
  AlertCircle,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import ProgressBar from '../../components/ui/ProgressBar';
import assessmentService from '../../services/assessmentService';

export default function TpoMockDrives() {
  const [activeTab, setActiveTab] = useState('drives'); // 'drives' | 'banks' | 'analytics'
  const [drives, setDrives] = useState([]);
  const [questionBanks, setQuestionBanks] = useState([]);
  const [selectedAnalyticsDrive, setSelectedAnalyticsDrive] = useState(null);
  const [driveAnalytics, setDriveAnalytics] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state for creating drive
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newCompanyTier, setNewCompanyTier] = useState('Tier-1 IT / Product');
  const [newFormat, setNewFormat] = useState('Cognitive Aptitude + Coding');
  const [newDuration, setNewDuration] = useState(90);
  const [newCutoff, setNewCutoff] = useState(75);
  const [newRoles, setNewRoles] = useState('Full Stack Engineer, Backend Architect');
  const [newScheduledDate, setNewScheduledDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [drivesData, banksData] = await Promise.all([
          assessmentService.getTpoMockDrives(),
          assessmentService.getQuestionBanks()
        ]);
        setDrives(Array.isArray(drivesData) ? drivesData : []);
        setQuestionBanks(Array.isArray(banksData) ? banksData : []);

        // Load analytics for the first drive if available
        if (drivesData && drivesData.length > 0) {
          const analytics = await assessmentService.getTpoDriveAnalytics(drivesData[0].id);
          setSelectedAnalyticsDrive(drivesData[0]);
          setDriveAnalytics(analytics);
        }
      } catch (err) {
        console.error('Failed to load TPO mock drive data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      const payload = {
        title: newTitle,
        company: newCompany,
        companyTier: newCompanyTier,
        format: newFormat,
        durationMinutes: Number(newDuration),
        cutoffScore: Number(newCutoff),
        targetRoles: newRoles.split(',').map(r => r.trim()),
        scheduledAt: newScheduledDate || new Date().toISOString(),
        difficulty: 'Medium',
        description: `Institutional campus placement simulation configured by TPO for ${newCompany}.`
      };

      const created = await assessmentService.createTpoMockDrive(payload);
      setDrives(prev => [created, ...prev]);
      setShowCreateModal(false);

      // Reset form
      setNewTitle('');
      setNewCompany('');
    } catch (err) {
      console.error('Failed to create drive:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewAnalytics = async (drive) => {
    try {
      setSelectedAnalyticsDrive(drive);
      const analytics = await assessmentService.getTpoDriveAnalytics(drive.id);
      setDriveAnalytics(analytics);
      setActiveTab('analytics');
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const driveColumns = [
    { key: 'title', label: 'Drive Title & Details' },
    { key: 'company', label: 'Company / Tier' },
    { key: 'format', label: 'Format' },
    {
      key: 'totalRegistered',
      label: 'Enrolled Candidates',
      sortable: true,
      render: (val) => <span className="font-semibold text-slate-800">{val || 0}</span>
    },
    {
      key: 'cutoffScore',
      label: 'Cutoff',
      render: (val) => <Badge variant="indigo" size="sm">{val}%</Badge>
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <Badge variant={val === 'ACTIVE_NOW' || val === 'OPEN' ? 'emerald' : 'neutral'} size="sm">
          {val}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button
          onClick={() => handleViewAnalytics(row)}
          variant="outline"
          size="sm"
        >
          Cohort Analytics
        </Button>
      )
    }
  ];

  const tabs = [
    { id: 'drives', label: `Active & Scheduled Drives (${drives.length})` },
    { id: 'banks', label: `Question Banks (${questionBanks.length})` },
    { id: 'analytics', label: 'Cohort Diagnostic Analytics' }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
        <p className="text-sm text-slate-500">Loading TPO Placement Simulation Control...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Institutional Mock Drive Administration & Assessment Engine"
        subtitle="Schedule company-benchmarked mock placement tests, configure question banks, and monitor cohort readiness curves."
        breadcrumbs={[{ label: 'TPO Portal', href: '/admin' }, { label: 'Mock Drive Control' }]}
        action={
          <Button onClick={() => setShowCreateModal(true)} variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Schedule New Mock Drive
          </Button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Mock Drives"
          value={drives.length.toString()}
          subtitle="4 Active / 2 Upcoming"
          trend="up"
          trendValue="+2 this month"
          icon={Calendar}
          color="indigo"
        />
        <StatCard
          title="Total Student Attempts"
          value="1,138"
          subtitle="92% completion rate"
          trend="up"
          trendValue="+14%"
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Cohort Average Score"
          value="78.4%"
          subtitle="Across all branches"
          trend="up"
          trendValue="+3.8%"
          icon={Award}
          color="violet"
        />
        <StatCard
          title="Placement Readiness Boost"
          value="+18.2%"
          subtitle="Post-remediation score gain"
          trend="up"
          trendValue="High Impact"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* TAB 1: MOCK DRIVES LIST */}
      {activeTab === 'drives' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Configured Placement Simulation Drives</h3>
            <span className="text-xs text-slate-500">{drives.length} drives registered in system</span>
          </div>

          <DataTable
            columns={driveColumns}
            data={drives}
            pageSize={10}
          />
        </div>
      )}

      {/* TAB 2: QUESTION BANKS */}
      {activeTab === 'banks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Institutional Question Banks</h3>
              <p className="text-xs text-slate-500">Curated repositories of cognitive MCQs, coding problems, and structured technical interview prompts.</p>
            </div>
            <Button
              onClick={() => alert('Question bank creator opened.')}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Question Bank
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {questionBanks.map((qb) => (
              <Card key={qb.id} className="p-5 border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={qb.type === 'CODING' ? 'violet' : qb.type === 'INTERVIEW' ? 'emerald' : 'indigo'} size="sm">
                      {qb.type}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-500">{qb.difficulty}</span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mb-2">{qb.name}</h4>

                  <div className="text-xs text-slate-600 space-y-1 mb-4">
                    <div><strong>Total Questions:</strong> {qb.questionCount}</div>
                    <div><strong>Last Updated:</strong> {qb.lastUpdated}</div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {qb.categories?.map(cat => (
                      <span key={cat} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">ID: {qb.id}</span>
                  <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-800">
                    Manage Items <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: COHORT DIAGNOSTIC ANALYTICS */}
      {activeTab === 'analytics' && driveAnalytics && (
        <div className="space-y-6">
          <Card className="p-6 border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="indigo" size="sm">Drive Analytics</Badge>
                  <span className="text-xs text-slate-500 font-medium">Cutoff: {driveAnalytics.cutoffScore}%</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedAnalyticsDrive?.title || 'Drive Cohort Performance'}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {driveAnalytics.totalAttempted} students attempted • {driveAnalytics.qualifiedCount} qualified ({driveAnalytics.qualifiedPercentage})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => alert('Cohort analytical breakdown exported to CSV.')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Export Cohort CSV
                </Button>
              </div>
            </div>
          </Card>

          {/* Department Breakdown & Weak Topics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Department Comparison */}
            <Card className="p-5 border-slate-200">
              <h4 className="font-bold text-slate-900 mb-3 text-sm">Department Performance & Clearance Rate</h4>
              <div className="space-y-3">
                {driveAnalytics.departmentBreakdown?.map(dept => (
                  <div key={dept.department} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-800">{dept.department}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{dept.participants} Students</span>
                        <span className="font-bold text-indigo-700">{dept.avgScore}% Avg</span>
                      </div>
                    </div>
                    <ProgressBar value={dept.avgScore} color="indigo" />
                    <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                      <span>Pass Clearance Rate:</span>
                      <strong className="text-emerald-700">{dept.passRate}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Cohort-Wide Weak Topics Identified */}
            <Card className="p-5 border-amber-200 bg-amber-50/20">
              <h4 className="font-bold text-amber-950 mb-3 text-sm flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Diagnosed Cohort Knowledge Gaps
              </h4>
              <p className="text-xs text-amber-900 mb-3">
                These topics had the highest error rate across participants. Automated micro-tasks have been pushed to students' Learning Paths.
              </p>

              <div className="space-y-2.5">
                {driveAnalytics.weakestTopics?.map(gap => (
                  <div key={gap.topic} className="p-3 bg-white/80 rounded-lg border border-amber-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-950">{gap.topic}</span>
                    <Badge variant="amber" size="sm">
                      {gap.errorRate} Error Rate
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* CREATE MOCK DRIVE MODAL */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Schedule New Placement Mock Drive"
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowCreateModal(false)} variant="outline" size="sm">
              Cancel
            </Button>
            <Button
              onClick={handleCreateDrive}
              disabled={isCreating || !newTitle || !newCompany}
              variant="primary"
              size="sm"
            >
              {isCreating ? 'Creating Drive...' : 'Publish Drive'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateDrive} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-800 block mb-1">
              Drive Title <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Microsoft Engage Machine Coding & DSA Qualifier"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Target Company <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Microsoft"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Company Tier</label>
              <select
                value={newCompanyTier}
                onChange={(e) => setNewCompanyTier(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Tier-1 FAANG / Big Tech">Tier-1 FAANG / Big Tech</option>
                <option value="Tier-1 IT / Product">Tier-1 IT / Product</option>
                <option value="FinTech / Banking">FinTech / Banking</option>
                <option value="Enterprise IT">Enterprise IT</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Duration (Mins)</label>
              <Input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                min={15}
                max={240}
              />
            </div>
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Cutoff Score (%)</label>
              <Input
                type="number"
                value={newCutoff}
                onChange={(e) => setNewCutoff(e.target.value)}
                min={40}
                max={100}
              />
            </div>
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Scheduled Date</label>
              <Input
                type="date"
                value={newScheduledDate}
                onChange={(e) => setNewScheduledDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-800 block mb-1">Target Roles (Comma-separated)</label>
            <Input
              type="text"
              value={newRoles}
              onChange={(e) => setNewRoles(e.target.value)}
              placeholder="Full Stack Engineer, Backend Architect"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-800 block mb-1">Assessment Format</label>
            <select
              value={newFormat}
              onChange={(e) => setNewFormat(e.target.value)}
              className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
            >
              <option value="Cognitive Aptitude + Coding">Cognitive Aptitude + Coding</option>
              <option value="Algorithmic Machine Coding">Algorithmic Machine Coding</option>
              <option value="Technical Interview Practice">Technical Interview Practice</option>
              <option value="Complete 3-Round Placement Simulation">Complete 3-Round Placement Simulation</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
