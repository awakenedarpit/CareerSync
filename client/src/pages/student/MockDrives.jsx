import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Award,
  Play,
  BarChart2,
  Code,
  FileQuestion,
  Users,
  Compass,
  ShieldCheck,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import assessmentService from '../../services/assessmentService';

const TARGET_ROLES = [
  { id: 'full-stack', title: 'Full Stack Engineer', category: 'Software Dev', matchRate: '88%', drivesAvailable: 3 },
  { id: 'frontend', title: 'Frontend Specialist (React)', category: 'Client Engineering', matchRate: '92%', drivesAvailable: 2 },
  { id: 'backend', title: 'Backend Architect (Node/Go)', category: 'Core Engineering', matchRate: '84%', drivesAvailable: 4 },
  { id: 'devops-cloud', title: 'DevOps & Cloud (AWS/Docker)', category: 'Platform & SRE', matchRate: '76%', drivesAvailable: 2 },
  { id: 'ai-ml', title: 'Machine Learning & AI', category: 'Data & AI', matchRate: '71%', drivesAvailable: 1 },
  { id: 'data-engineer', title: 'Data Platform Engineer', category: 'Data Infrastructure', matchRate: '79%', drivesAvailable: 2 },
  { id: 'sre', title: 'Site Reliability Engineer (SRE)', category: 'Reliability & Ops', matchRate: '73%', drivesAvailable: 1 },
  { id: 'qa-automation', title: 'QA & Test Automation', category: 'Software Quality', matchRate: '89%', drivesAvailable: 2 },
  { id: 'cybersecurity', title: 'Cybersecurity Analyst', category: 'Information Security', matchRate: '68%', drivesAvailable: 1 },
  { id: 'mobile-dev', title: 'Mobile Applications Engineer', category: 'Mobile & Native', matchRate: '65%', drivesAvailable: 1 },
  { id: 'embedded-iot', title: 'Embedded Systems & IoT', category: 'Hardware & Systems', matchRate: '62%', drivesAvailable: 1 },
  { id: 'solutions-architect', title: 'Solutions Architect', category: 'Architecture & Strategy', matchRate: '75%', drivesAvailable: 2 }
];

export default function MockDrives() {
  const navigate = useNavigate();
  const [drives, setDrives] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [selectedDriveModal, setSelectedDriveModal] = useState(null);
  const [registeredDrives, setRegisteredDrives] = useState({});

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [drivesData, reportsData] = await Promise.all([
          assessmentService.getMockDrives(),
          assessmentService.getPerformanceReports()
        ]);
        setDrives(Array.isArray(drivesData) ? drivesData : []);
        setReports(Array.isArray(reportsData) ? reportsData : []);
      } catch (err) {
        console.error('Failed to load mock drives:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRegister = async (driveId) => {
    try {
      await assessmentService.registerForMockDrive(driveId);
      setRegisteredDrives(prev => ({ ...prev, [driveId]: true }));
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const filteredDrives = drives.filter(d => {
    if (selectedRoleFilter === 'all') return true;
    const roleObj = TARGET_ROLES.find(r => r.id === selectedRoleFilter);
    if (!roleObj) return true;
    return d.targetRoles?.some(tr => tr.toLowerCase().includes(roleObj.title.toLowerCase().split(' ')[0]));
  });

  const historyColumns = [
    { key: 'driveTitle', label: 'Assessment Drive / Test' },
    {
      key: 'attemptedAt',
      label: 'Date Attempted',
      render: (val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    },
    {
      key: 'overallScore',
      label: 'Score',
      render: (val) => (
        <span className="font-semibold text-slate-800">{val}%</span>
      )
    },
    {
      key: 'percentile',
      label: 'Cohort Rank',
      render: (val) => (
        <Badge variant="aqua" size="sm">{val}</Badge>
      )
    },
    {
      key: 'resultStatus',
      label: 'Result',
      render: (val) => (
        <Badge variant={val.includes('PASS') ? 'emerald' : 'amber'} size="sm">
          {val.replace('_', ' ')}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Link
          to={`/student/mock-drives/reports/${row.id}`}
          className="text-xs font-medium text-[#009669] hover:text-[#002020] flex items-center gap-1"
        >
          View Diagnostics <ChevronRight className="h-3 w-3" />
        </Link>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
        <p className="text-sm text-slate-500">Loading Mock Drive Centre...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Mock Placement Drive Centre & Diagnostic Arena"
        subtitle="Experience end-to-end recruiter simulation rounds with algorithmic coding, cognitive aptitude, and structured interview practice."
        breadcrumbs={[{ label: 'Student', href: '/student' }, { label: 'Mock Drives' }]}
        action={
          <div className="flex items-center gap-2">
            <Button to="/student/mock-drives/reports" variant="outline" size="sm">
              <BarChart2 className="h-4 w-4 mr-1.5" />
              Diagnostic Reports
            </Button>
            <Button to="/student/learning-path" variant="primary" size="sm">
              <BookOpen className="h-4 w-4 mr-1.5" />
              Personalized Learning Path
            </Button>
          </div>
        }
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Mock Readiness"
          value="84.5%"
          subtitle="Top 11% in campus cohort"
          trend="up"
          trendValue="+5.2%"
          icon={Award}
          color="emerald"
        />
        <StatCard
          title="Aptitude Benchmark"
          value="88.0%"
          subtitle="4 completed evaluations"
          trend="up"
          trendValue="Above Cutoff"
          icon={CheckCircle2}
          color="teal"
        />
        <StatCard
          title="Coding Speed & Quality"
          value="82.0%"
          subtitle="Avg solve time 28m"
          trend="up"
          trendValue="18 Test cases passed"
          icon={Code}
          color="aqua"
        />
        <StatCard
          title="Target Role Alignment"
          value="Full Stack"
          subtitle="88% matching target roles"
          trend="neutral"
          trendValue="3 Drives Open"
          icon={Compass}
          color="amber"
        />
      </div>

      {/* 3 Interactive Practice Modules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Direct Practice Arenas</h2>
            <p className="text-xs text-slate-500">Launch targeted standalone skill assessments anytime without scheduled drive restrictions.</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            Zero-invasive privacy practice environment
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Module 1: Aptitude */}
          <Card hover className="p-5 border-slate-200 flex flex-col justify-between bg-gradient-to-br from-white to-indigo-50/20">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-lg bg-[#BDF9F9]/50 text-[#004D36]">
                  <FileQuestion className="h-5 w-5" />
                </span>
                <Badge variant="aqua" size="sm">Timed MCQ</Badge>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Cognitive & CS Aptitude</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Quantitative aptitude, logical deductions, critical path analysis, and core computer science fundamentals (OS, DBMS, Networks).
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 30-45 Mins</span>
                <span>•</span>
                <span>8-20 Questions</span>
              </div>
            </div>
            <Button
              onClick={() => navigate('/student/mock-drives/aptitude')}
              variant="primary"
              size="sm"
              className="w-full justify-center"
            >
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Launch Aptitude Assessment
            </Button>
          </Card>

          {/* Module 2: Machine Coding */}
          <Card hover className="p-5 border-slate-200 flex flex-col justify-between bg-gradient-to-br from-white to-violet-50/20">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-lg bg-violet-100 text-violet-700">
                  <Code className="h-5 w-5" />
                </span>
                <Badge variant="violet" size="sm">Live Sandbox</Badge>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Algorithmic Machine Coding</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Solve real-world algorithmic problems with Python, Java, C++, or JavaScript in a safe browser/containerized sandbox environment.
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 45-60 Mins</span>
                <span>•</span>
                <span>Multiple Languages</span>
              </div>
            </div>
            <Button
              onClick={() => navigate('/student/mock-drives/technical')}
              variant="primary"
              size="sm"
              className="w-full justify-center"
            >
              <Code className="h-3.5 w-3.5 mr-1.5" />
              Open Coding Sandbox
            </Button>
          </Card>

          {/* Module 3: Interview Practice */}
          <Card hover className="p-5 border-slate-200 flex flex-col justify-between bg-gradient-to-br from-white to-emerald-50/20">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <Users className="h-5 w-5" />
                </span>
                <Badge variant="emerald" size="sm">AI Evaluation</Badge>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Role-Based Interview Simulation</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Multi-category interview across System Design, STAR Behavioral, REST APIs, and Concurrency with 5-dimension structured feedback.
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 30 Mins</span>
                <span>•</span>
                <span>9 Question Categories</span>
              </div>
            </div>
            <Button
              onClick={() => navigate('/student/mock-drives/interview')}
              variant="primary"
              size="sm"
              className="w-full justify-center"
            >
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Start Interview Simulation
            </Button>
          </Card>
        </div>
      </div>

      {/* 12 Target Roles Explorer */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">12 Industry Target Roles</h2>
            <p className="text-xs text-slate-500">Select a career track to view tailored mock placement drives and aligned question banks.</p>
          </div>
          {selectedRoleFilter !== 'all' && (
            <button
              onClick={() => setSelectedRoleFilter('all')}
              className="text-xs text-[#009669] hover:text-[#002020] font-medium"
            >
              Clear Role Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {TARGET_ROLES.map((role) => {
            const isSelected = selectedRoleFilter === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRoleFilter(isSelected ? 'all' : role.id)}
                className={`p-3 rounded-xl border text-left transition-all duration-150 ${
                  isSelected
                    ? 'border-indigo-600 bg-[#BDF9F9]/30 shadow-sm ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Badge variant={isSelected ? 'indigo' : 'neutral'} size="sm">
                    {role.category}
                  </Badge>
                  <span className="text-[10px] font-semibold text-emerald-600">{role.matchRate}</span>
                </div>
                <div className="font-semibold text-xs text-slate-900 truncate" title={role.title}>
                  {role.title}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {role.drivesAvailable} Drives Open
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Available & Scheduled Mock Placement Drives */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900">
            {selectedRoleFilter === 'all'
              ? 'Campus & Corporate Mock Placement Drives'
              : `Drives Aligned with ${TARGET_ROLES.find(r => r.id === selectedRoleFilter)?.title}`}
          </h2>
          <span className="text-xs text-slate-500">{filteredDrives.length} Drives Available</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDrives.map((drive) => {
            const isRegistered = registeredDrives[drive.id] || drive.status === 'ACTIVE_NOW';
            return (
              <Card key={drive.id} hover className="p-5 border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={drive.status === 'ACTIVE_NOW' ? 'emerald' : 'indigo'} size="sm">
                        {drive.status === 'ACTIVE_NOW' ? 'LIVE NOW' : drive.companyTier}
                      </Badge>
                      <span className="text-xs font-medium text-slate-500">{drive.company}</span>
                    </div>
                    <Badge variant={drive.difficulty === 'Hard' ? 'amber' : 'neutral'} size="sm">
                      {drive.difficulty}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{drive.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-3">{drive.description}</p>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Evaluation Format:</span>
                      <span className="font-medium text-slate-800">{drive.format}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Cutoff Score:</span>
                      <span className="font-semibold text-[#004D36]">{drive.cutoffScore}% Pass Mark</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Target Roles:</span>
                      <span className="font-medium text-slate-700 truncate max-w-[200px]">
                        {drive.targetRoles?.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {drive.durationMinutes}m</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {drive.totalRegistered} enrolled</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setSelectedDriveModal(drive)}
                      variant="outline"
                      size="sm"
                    >
                      View Details
                    </Button>
                    {isRegistered ? (
                      <Button
                        onClick={() => navigate('/student/mock-drives/aptitude')}
                        variant="primary"
                        size="sm"
                      >
                        Enter Drive
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleRegister(drive.id)}
                        variant="primary"
                        size="sm"
                      >
                        Register
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Past Performance & Attempt History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Attempt History & Diagnostic Records</h2>
            <p className="text-xs text-slate-500">Detailed logs of all completed mock attempts, benchmarked percentiles, and gap breakdowns.</p>
          </div>
          <Button to="/student/mock-drives/reports" variant="outline" size="sm">
            All Detailed Reports
          </Button>
        </div>

        <DataTable
          columns={historyColumns}
          data={reports}
          pageSize={5}
        />
      </div>

      {/* Drive Details Modal */}
      {selectedDriveModal && (
        <Modal
          isOpen={!!selectedDriveModal}
          onClose={() => setSelectedDriveModal(null)}
          title={selectedDriveModal.title}
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setSelectedDriveModal(null)} variant="outline" size="sm">
                Close
              </Button>
              <Button
                onClick={() => {
                  setSelectedDriveModal(null);
                  navigate('/student/mock-drives/aptitude');
                }}
                variant="primary"
                size="sm"
              >
                Begin Assessment
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500">Company / Tier:</span>
                <p className="font-semibold text-slate-900 text-sm">{selectedDriveModal.company} ({selectedDriveModal.companyTier})</p>
              </div>
              <Badge variant="aqua" size="md">Cutoff: {selectedDriveModal.cutoffScore}%</Badge>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-1">Assessment Overview</h4>
              <p className="text-slate-600 leading-relaxed">{selectedDriveModal.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div><strong>Format:</strong> {selectedDriveModal.format}</div>
              <div><strong>Duration:</strong> {selectedDriveModal.durationMinutes} Minutes</div>
              <div><strong>Registered:</strong> {selectedDriveModal.totalRegistered} Candidates</div>
              <div><strong>Difficulty:</strong> {selectedDriveModal.difficulty}</div>
            </div>

            <div className="p-3 bg-[#BDF9F9]/30 border border-[#02E8A7]/40 rounded-lg text-[#002020]">
              <div className="flex items-center gap-1.5 font-semibold mb-1">
                <ShieldCheck className="h-4 w-4 text-[#009669]" />
                Ethical Proctoring Policy
              </div>
              <p className="text-[11px] leading-relaxed text-[#002020]">
                CarrerSync guarantees ethical privacy. This assessment does not record your screen, webcam, or microphone in the background. Automated evaluations run against code output and MCQ answer correctness only.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
