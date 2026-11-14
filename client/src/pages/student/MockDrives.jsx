import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Award,
  Play,
  RotateCcw,
  BarChart2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';

export default function MockDrives() {
  const [activeTab, setActiveTab] = useState('all');
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedMock, setSelectedMock] = useState(null);

  const tabs = [
    { id: 'all', label: 'All Formats', count: 6 },
    { id: 'coding', label: 'Machine Coding', count: 3 },
    { id: 'aptitude', label: 'Aptitude & Logic', count: 2 },
    { id: 'interview', label: 'Technical Interview', count: 1 }
  ];

  const upcomingMocks = [
    {
      id: 1,
      title: 'TCS Digital Advanced Coding Simulation',
      format: 'Machine Coding',
      duration: '90 Mins',
      questions: '3 Algorithmic Problems',
      scheduledDate: 'Tomorrow, 5:00 PM',
      difficulty: 'Medium - Hard',
      type: 'coding'
    },
    {
      id: 2,
      title: 'Cognitive & Quantitative Aptitude Benchmark',
      format: 'Aptitude & Logic',
      duration: '60 Mins',
      questions: '45 MCQs',
      scheduledDate: 'Nov 20, 2:00 PM',
      difficulty: 'Medium',
      type: 'aptitude'
    }
  ];

  const history = [
    {
      id: 'MOK-109',
      name: 'Full Stack REST API Machine Test',
      type: 'Machine Coding',
      date: '10 Nov 2024',
      score: '92 / 100',
      percentile: '94th',
      status: 'Passed'
    },
    {
      id: 'MOK-104',
      name: 'Data Structures & Algorithms Sprint',
      type: 'Machine Coding',
      date: '02 Nov 2024',
      score: '78 / 100',
      percentile: '82nd',
      status: 'Passed'
    },
    {
      id: 'MOK-098',
      name: 'Core CS Fundamentals (OS & DBMS)',
      type: 'Aptitude & Logic',
      date: '25 Oct 2024',
      score: '85 / 100',
      percentile: '89th',
      status: 'Passed'
    },
    {
      id: 'MOK-085',
      name: 'Simulated System Design Round',
      type: 'Technical Interview',
      date: '15 Oct 2024',
      score: '70 / 100',
      percentile: '72nd',
      status: 'Review Needed'
    }
  ];

  const columns = [
    { key: 'name', label: 'Test Name', sortable: true },
    { key: 'type', label: 'Format' },
    { key: 'date', label: 'Date Attempted', sortable: true },
    { key: 'score', label: 'Score' },
    { key: 'percentile', label: 'Cohort Rank' },
    {
      key: 'status',
      label: 'Result',
      render: (val) => (
        <Badge variant={val === 'Passed' ? 'emerald' : 'amber'} size="sm">
          {val}
        </Badge>
      )
    }
  ];

  const handleStart = (mock) => {
    setSelectedMock(mock);
    setShowStartModal(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mock Placement Drives & Practice Arena"
        subtitle="Simulate real-world recruiter technical tests and company-specific aptitude rounds."
        breadcrumbs={[{ label: 'Student', href: '/student' }, { label: 'Mock Drives' }]}
        action={
          <Button onClick={() => handleStart(upcomingMocks[0])} variant="primary" size="sm">
            <Play className="h-4 w-4 mr-1.5" />
            Launch Instant Practice
          </Button>
        }
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Mock Score"
          value="81.2%"
          subtitle="Across 4 completed simulations"
          trend="up"
          trendValue="+6.4%"
          icon={Award}
          color="emerald"
        />
        <StatCard
          title="Simulated Percentile"
          value="88th"
          subtitle="Campus cohort ranking"
          trend="up"
          trendValue="Top 15%"
          icon={BarChart2}
          color="indigo"
        />
        <StatCard
          title="Coding Speed Index"
          value="34m"
          subtitle="Avg per problem"
          trend="down"
          trendValue="Faster"
          icon={Clock}
          color="violet"
        />
        <StatCard
          title="Target Drive Readiness"
          value="High"
          subtitle="Based on mock scores"
          trend="neutral"
          trendValue="Ready for TCS/Infy"
          icon={CheckCircle2}
          color="amber"
        />
      </div>

      {/* Upcoming Scheduled Drives */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3">Upcoming Mock Drives</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingMocks.map((mock) => (
            <Card key={mock.id} hover className="p-5 border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant="indigo" size="sm">{mock.format}</Badge>
                  <span className="text-xs text-slate-400">{mock.difficulty}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">{mock.title}</h4>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {mock.duration}</span>
                  <span>•</span>
                  <span>{mock.questions}</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-600">
                  <Calendar className="h-3.5 w-3.5 inline mr-1 text-slate-400" />
                  {mock.scheduledDate}
                </div>
                <Button onClick={() => handleStart(mock)} variant="primary" size="sm">
                  Start Simulation
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Past Performance History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-slate-900">Attempt History & Diagnostics</h3>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
        <DataTable
          columns={columns}
          data={history}
          pageSize={5}
        />
      </div>

      {/* Mock Simulation Modal */}
      <Modal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
        title={selectedMock ? selectedMock.title : 'Mock Simulation'}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowStartModal(false)} variant="outline" size="sm">
              Close Preview
            </Button>
            <Button onClick={() => setShowStartModal(false)} variant="primary" size="sm">
              Begin Test Environment
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            This simulation replicates the real company assessment environment. No proctoring software will lock your device, and no intrusive screen/webcam recording will take place, adhering to CarrerSync ethical privacy policies.
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div><strong>Duration:</strong> {selectedMock?.duration}</div>
            <div><strong>Format:</strong> {selectedMock?.format} ({selectedMock?.questions})</div>
            <div><strong>Evaluation:</strong> Automated test harness with branch coverage analysis.</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
