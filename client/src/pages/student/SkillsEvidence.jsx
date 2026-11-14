import React, { useState } from 'react';
import {
  Award,
  Plus,
  ExternalLink,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  FolderGit2,
  AlertTriangle,
  UploadCloud
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import StatusBadge from '../../components/ui/StatusBadge';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

export default function SkillsEvidence() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Frontend');
  const [newEvidenceUrl, setNewEvidenceUrl] = useState('');

  const [skills, setSkills] = useState([
    {
      id: '1',
      name: 'JavaScript (ES6+)',
      category: 'Languages',
      status: 'verified',
      level: 'Advanced',
      verifiedBy: 'Automated Code Audit & Prof. K. Rao',
      verifiedDate: '12 Oct 2024',
      evidence: [
        { type: 'GitHub Repo', name: 'event-engine', url: 'https://github.com/priya/event-engine' },
        { type: 'Test Result', name: 'JS Advanced Benchmark (94%)', url: '#' }
      ]
    },
    {
      id: '2',
      name: 'React.js',
      category: 'Frontend',
      status: 'evidence_linked',
      level: 'Intermediate',
      verifiedBy: 'Pending Faculty Review',
      verifiedDate: '28 Oct 2024',
      evidence: [
        { type: 'Project', name: 'devcollab frontend', url: 'https://github.com/priya/devcollab' }
      ]
    },
    {
      id: '3',
      name: 'Node.js & Express',
      category: 'Backend',
      status: 'observed',
      level: 'Intermediate',
      verifiedBy: 'Lab Submission Analyzer',
      verifiedDate: '04 Nov 2024',
      evidence: [
        { type: 'Lab Commit', name: 'CS402 Lab Assignment 3', url: '#' }
      ]
    },
    {
      id: '4',
      name: 'PostgreSQL',
      category: 'Database',
      status: 'verified',
      level: 'Advanced',
      verifiedBy: 'DBMS Faculty Lab Evaluation',
      verifiedDate: '15 Sep 2024',
      evidence: [
        { type: 'Schema File', name: 'event-booking-schema.sql', url: '#' }
      ]
    },
    {
      id: '5',
      name: 'Docker & Containers',
      category: 'DevOps',
      status: 'claimed',
      level: 'Beginner',
      verifiedBy: 'Self-Declared (No verified proof)',
      verifiedDate: 'N/A',
      evidence: []
    },
    {
      id: '6',
      name: 'Machine Learning (Scikit-Learn)',
      category: 'AI/ML',
      status: 'expired',
      level: 'Beginner',
      verifiedBy: 'Stale (No activity in 18 months)',
      verifiedDate: 'Mar 2023',
      evidence: [
        { type: 'Old Coursework', name: 'ML 101 Intro Lab', url: '#' }
      ]
    },
    {
      id: '7',
      name: 'TypeScript',
      category: 'Languages',
      status: 'evidence_linked',
      level: 'Intermediate',
      verifiedBy: 'GitHub Integration Engine',
      verifiedDate: '02 Nov 2024',
      evidence: [
        { type: 'GitHub Commit', name: 'devcollab typed models', url: '#' }
      ]
    },
    {
      id: '8',
      name: 'MongoDB',
      category: 'Database',
      status: 'observed',
      level: 'Intermediate',
      verifiedBy: 'Coursework Parser',
      verifiedDate: '20 Oct 2024',
      evidence: [
        { type: 'NoSQL Project', name: 'blog-backend', url: '#' }
      ]
    }
  ]);

  const tabs = [
    { id: 'all', label: 'All Skills', count: skills.length },
    { id: 'verified', label: 'Verified', count: skills.filter(s => s.status === 'verified').length },
    { id: 'evidence_linked', label: 'Evidence-linked', count: skills.filter(s => s.status === 'evidence_linked').length },
    { id: 'observed', label: 'Observed', count: skills.filter(s => s.status === 'observed').length },
    { id: 'claimed', label: 'Claimed', count: skills.filter(s => s.status === 'claimed').length },
    { id: 'expired', label: 'Expired', count: skills.filter(s => s.status === 'expired').length }
  ];

  const filteredSkills = skills.filter(skill => {
    const matchesTab = activeTab === 'all' || skill.status === activeTab;
    const matchesQuery = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         skill.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesQuery;
  });

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const newSkill = {
      id: String(Date.now()),
      name: newSkillName.trim(),
      category: newSkillCategory,
      status: newEvidenceUrl.trim() ? 'evidence_linked' : 'claimed',
      level: 'Beginner',
      verifiedBy: newEvidenceUrl.trim() ? 'Student Linked Evidence' : 'Self-Declared',
      verifiedDate: 'Just now',
      evidence: newEvidenceUrl.trim() ? [{ type: 'Submitted Link', name: newEvidenceUrl.trim(), url: newEvidenceUrl.trim() }] : []
    };

    setSkills([newSkill, ...skills]);
    setNewSkillName('');
    setNewEvidenceUrl('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skills & Evidence Portfolio"
        subtitle="Transparent skill inventory governed by the 5-state evidence verification lifecycle."
        breadcrumbs={[{ label: 'Student', href: '/student' }, { label: 'Skills & Evidence' }]}
        action={
          <Button onClick={() => setShowAddModal(true)} variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Skill / Attach Evidence
          </Button>
        }
      />

      {/* Lifecycle Rules Clarification */}
      <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-indigo-600 shrink-0" />
          <span>
            <strong>Human-in-the-Loop Rule:</strong> AI assists in artifact parsing, but only faculty, coding test benchmarks, or verified credentials can promote skills to <strong>Verified</strong>.
          </span>
        </div>
        <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-indigo-200">
          Strict Policy
        </span>
      </div>

      {/* Controls: Search and Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8.5 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Skill Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => (
            <Card key={skill.id} hover className="p-5 border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{skill.category}</span>
                    <h3 className="text-base font-bold text-slate-900">{skill.name}</h3>
                  </div>
                  <StatusBadge status={skill.status} />
                </div>

                <div className="mt-2 text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Proficiency:</span>
                    <strong className="text-slate-700">{skill.level}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Validation:</span>
                    <span className="text-slate-600 truncate max-w-[160px]" title={skill.verifiedBy}>
                      {skill.verifiedBy}
                    </span>
                  </div>
                </div>

                {/* Evidence Artifacts */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Evidence ({skill.evidence.length})
                  </h4>
                  {skill.evidence.length > 0 ? (
                    <div className="space-y-1.5">
                      {skill.evidence.map((ev, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded-md bg-slate-50 border border-slate-100">
                          <span className="truncate text-slate-700">{ev.name}</span>
                          <span className="text-[10px] text-indigo-600 font-medium shrink-0 ml-2">{ev.type}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No artifacts linked. Currently self-claimed.</p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Date: {skill.verifiedDate}</span>
                <button
                  onClick={() => {
                    setNewSkillName(skill.name);
                    setNewSkillCategory(skill.category);
                    setShowAddModal(true);
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  + Add Proof
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Skill / Attach Evidence Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Skill or Attach Evidence"
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowAddModal(false)} variant="outline" size="sm">
              Cancel
            </Button>
            <Button onClick={handleAddSkill} variant="primary" size="sm">
              Save Skill
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddSkill} className="space-y-4 text-xs">
          <Input
            label="Skill Name"
            placeholder="e.g. Docker, GraphQL, Kubernetes"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            required
          />

          <Select
            label="Category"
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value)}
            options={[
              { value: 'Languages', label: 'Programming Languages' },
              { value: 'Frontend', label: 'Frontend Development' },
              { value: 'Backend', label: 'Backend & APIs' },
              { value: 'Database', label: 'Databases & Storage' },
              { value: 'DevOps', label: 'Cloud & DevOps' },
              { value: 'AI/ML', label: 'AI & Data Science' }
            ]}
          />

          <Input
            label="Evidence URL (Optional)"
            placeholder="GitHub repository, PR link, certificate URL"
            value={newEvidenceUrl}
            onChange={(e) => setNewEvidenceUrl(e.target.value)}
            helperText="Linking valid evidence elevates this skill to 'Evidence-linked' state pending review."
          />
        </form>
      </Modal>
    </div>
  );
}
