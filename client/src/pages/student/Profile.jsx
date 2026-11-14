import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Mail,
  Phone,
  Globe,
  Code2,
  Award,
  ExternalLink,
  Edit2,
  Save,
  CheckCircle2,
  FolderGit2
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';

export default function StudentProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: 'Priya Sharma',
    rollNumber: 'CS2021-084',
    branch: 'Computer Science and Engineering',
    degree: 'B.Tech',
    batch: '2021 - 2025',
    cgpa: '8.42',
    email: 'priya.sharma21@college.edu',
    phone: '+91 98765 43210',
    bio: 'Passionate Full Stack Engineer specializing in TypeScript, React, and scalable backend microservices. Active open-source contributor.',
    github: 'https://github.com/priyasharma-dev',
    portfolio: 'https://priyasharma.me',
    leetcode: 'https://leetcode.com/priya_codes'
  });

  const breadcrumbs = [
    { label: 'Student', href: '/student' },
    { label: 'My Profile' }
  ];

  const projects = [
    {
      title: 'Distributed Event Booking Engine',
      tech: ['React', 'Node.js', 'PostgreSQL', 'Redis'],
      repo: 'github.com/priyasharma-dev/event-engine',
      verified: true,
      desc: 'High-throughput ticket reservation engine with concurrency locking and Stripe integration.'
    },
    {
      title: 'DevCollab - Realtime Code Workspace',
      tech: ['TypeScript', 'WebSocket', 'Tailwind CSS'],
      repo: 'github.com/priyasharma-dev/devcollab',
      verified: true,
      desc: 'Collaborative cloud IDE with operational transformation and multi-cursor sync.'
    },
    {
      title: 'AI Resume Keyword Verifier',
      tech: ['Python', 'FastAPI', 'ChromaDB'],
      repo: 'github.com/priyasharma-dev/resume-verifier',
      verified: false,
      desc: 'Vector-search based qualification matcher checking semantic similarity of resume bullets.'
    }
  ];

  const certificates = [
    { title: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', date: 'Aug 2024', status: 'verified' },
    { title: 'Meta Front-End Developer Professional', issuer: 'Coursera / Meta', date: 'Jan 2024', status: 'verified' }
  ];

  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Profile & Academic Records"
        subtitle="Manage your personal background, academic credentials, and connected evidence repositories."
        breadcrumbs={breadcrumbs}
        action={
          isEditing ? (
            <Button onClick={handleSave} variant="primary" size="sm">
              <Save className="h-4 w-4 mr-1.5" />
              Save Profile
            </Button>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              <Edit2 className="h-4 w-4 mr-1.5" />
              Edit Profile
            </Button>
          )
        }
      />

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Profile records successfully updated and queued for tenant evidence re-indexing.</span>
        </div>
      )}

      {/* Main Profile Header Card */}
      <Card className="p-6 border-slate-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-2xl font-bold shadow-xs">
              PS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{formData.name}</h2>
                <Badge variant="indigo" size="sm">Verified Student</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{formData.branch} • Class of {formData.batch.split(' - ')[1]}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-900">Roll:</span> {formData.rollNumber}
                <span>•</span>
                <span className="font-semibold text-slate-900">CGPA:</span> {formData.cgpa} / 10.0
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={formData.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <FolderGit2 className="h-3.5 w-3.5" />
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
            <a
              href={formData.leetcode}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>LeetCode</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Bio & Details Form */}
        <div className="mt-6">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                label="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                label="Portfolio URL"
                value={formData.portfolio}
                onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
              />
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">Career Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bio</h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">{formData.bio}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block">Email</span>
                  <span className="font-medium text-slate-800">{formData.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone</span>
                  <span className="font-medium text-slate-800">{formData.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Portfolio</span>
                  <a href={formData.portfolio} target="_blank" rel="noreferrer" className="font-medium text-indigo-600 hover:underline truncate block">
                    {formData.portfolio}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Projects & Certifications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Featured Projects */}
        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderGit2 className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Evidence Projects</h3>
            </div>
            <Badge variant="indigo" size="sm">{projects.length} Repositories</Badge>
          </div>

          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.title} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{proj.title}</h4>
                  <StatusBadge status={proj.verified ? 'verified' : 'evidence_linked'} />
                </div>
                <p className="text-[11px] text-slate-600 mt-1">{proj.desc}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {proj.tech.map((t) => (
                    <span key={t} className="text-[10px] font-medium bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Certifications & Academics */}
        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">Verified Certifications</h3>
            </div>
            <Badge variant="purple" size="sm">Institutional Proof</Badge>
          </div>

          <div className="space-y-3">
            {certificates.map((cert) => (
              <div key={cert.title} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{cert.title}</h4>
                  <StatusBadge status={cert.status} />
                </div>
                <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500">
                  <span>{cert.issuer}</span>
                  <span>Issued: {cert.date}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-700 mb-2">Academic Consistency</h4>
            <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span>Active Backlogs: <strong className="text-emerald-600">0</strong></span>
              <span>Credits Completed: <strong className="text-slate-900">142 / 160</strong></span>
              <span>Semester: <strong className="text-slate-900">7th</strong></span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
