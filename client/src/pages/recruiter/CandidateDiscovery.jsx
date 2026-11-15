import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  FolderGit2,
  ExternalLink,
  Plus,
  Award,
  Sparkles,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';

export default function CandidateDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [shortlistedSet, setShortlistedSet] = useState(new Set(['1', '2']));
  const [successToast, setSuccessToast] = useState('');

  const candidates = [
    {
      id: '1',
      name: 'Priya Sharma',
      roll: 'CS2021-084',
      branch: 'Computer Science',
      cgpa: 8.42,
      administrativeStatus: 'ELIGIBLE',
      matchReason: 'Direct match for Full Stack / Web Core requirements. 8 skills verified via GitHub repositories.',
      verifiedSkills: ['JavaScript (ES6+)', 'React.js', 'PostgreSQL', 'Node.js'],
      unverifiedSkills: ['GraphQL', 'Docker'],
      skillGaps: ['Kubernetes'],
      githubRepo: 'github.com/priyasharma-dev/event-engine',
      matchScore: 92
    },
    {
      id: '2',
      name: 'Aarav Patel',
      roll: 'CS2021-012',
      branch: 'Computer Science',
      cgpa: 9.10,
      administrativeStatus: 'ELIGIBLE',
      matchReason: 'Top algorithmic score in cohort. 11 skills verified with strong C++ and distributed systems code.',
      verifiedSkills: ['C++', 'Data Structures', 'Distributed Systems', 'Algorithms'],
      unverifiedSkills: ['Linux Kernel', 'gRPC'],
      skillGaps: ['AWS'],
      githubRepo: 'github.com/aarav-patel/raft-consensus',
      matchScore: 96
    },
    {
      id: '3',
      name: 'Ananya Iyer',
      roll: 'CS2021-028',
      branch: 'Computer Science',
      cgpa: 8.90,
      administrativeStatus: 'ELIGIBLE',
      matchReason: 'Strong cloud architecture background with verified Azure and Go containerized projects.',
      verifiedSkills: ['Go', 'Docker', 'Kubernetes', 'Cloud'],
      unverifiedSkills: ['Terraform'],
      skillGaps: ['Kafka'],
      githubRepo: 'github.com/ananya-iyer/k8s-scaler',
      matchScore: 89
    },
    {
      id: '4',
      name: 'Sneha Gupta',
      roll: 'IT2021-091',
      branch: 'Information Tech',
      cgpa: 8.15,
      administrativeStatus: 'ELIGIBLE',
      matchReason: 'Solid backend enterprise profile with verified Spring Boot & PostgreSQL implementations.',
      verifiedSkills: ['Java', 'Spring Boot', 'SQL', 'REST APIs'],
      unverifiedSkills: ['Redis'],
      skillGaps: ['Microservices Design'],
      githubRepo: 'github.com/sneha-gupta/banking-api',
      matchScore: 85
    },
    {
      id: '5',
      name: 'Meera Nambiar',
      roll: 'CS2021-052',
      branch: 'Computer Science',
      cgpa: 8.80,
      administrativeStatus: 'ELIGIBLE',
      matchReason: 'High systems proficiency with verified Rust memory safety and network concurrency code.',
      verifiedSkills: ['Rust', 'Linux Internals', 'Networks', 'C'],
      unverifiedSkills: ['WebAssembly'],
      skillGaps: ['DevOps'],
      githubRepo: 'github.com/meera-n/rust-http-proxy',
      matchScore: 94
    }
  ];

  const handleToggleShortlist = (id, name) => {
    const updated = new Set(shortlistedSet);
    if (updated.has(id)) {
      updated.delete(id);
      setSuccessToast(`Removed ${name} from interview shortlist.`);
    } else {
      updated.add(id);
      setSuccessToast(`Added ${name} to Round 1 Technical Interview shortlist.`);
    }
    setShortlistedSet(updated);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const filtered = candidates.filter(c => {
    const matchesQuery = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.verifiedSkills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSkill = selectedSkill === 'All' || c.verifiedSkills.some(s => s.toLowerCase().includes(selectedSkill.toLowerCase()));
    return matchesQuery && matchesSkill;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pre-Verified Candidate Discovery"
        subtitle="Search institutional talent with authentic code artifacts and explainable match justifications."
        breadcrumbs={[{ label: 'Recruiter', href: '/recruiter' }, { label: 'Candidate Discovery' }]}
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Shortlisted: <strong className="text-indigo-600">{shortlistedSet.size} Candidates</strong>
            </span>
            <Button to="/recruiter/shortlists" variant="primary" size="sm">
              <UserCheck className="h-4 w-4 mr-1.5" />
              View Shortlist
            </Button>
          </div>
        }
      />

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Search and Skill Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          {['All', 'JavaScript', 'React', 'C++', 'Go', 'Docker'].map((sk) => (
            <button
              key={sk}
              onClick={() => setSelectedSkill(sk)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedSkill === sk
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sk}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by candidate or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8.5 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Candidate Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((cand) => {
          const isShortlisted = shortlistedSet.has(cand.id);
          return (
            <Card key={cand.id} hover className="p-5 border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <Avatar name={cand.name} size="md" />
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{cand.name}</h4>
                      <p className="text-xs text-slate-500">{cand.branch} • CGPA: <strong>{cand.cgpa}</strong></p>
                    </div>
                  </div>
                  <Badge variant="emerald" size="sm">
                    {cand.matchScore}% Match
                  </Badge>
                </div>

                {/* Match Justification */}
                <div className="mt-3 p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700">
                  <span className="font-semibold text-indigo-900 block mb-0.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-indigo-600" />
                    Explainable Match Rationale:
                  </span>
                  {cand.matchReason}
                </div>

                {/* Administrative Status & Privacy Indicator */}
                <div className="mt-2.5 flex items-center justify-between text-[11px] p-2 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Admin: ELIGIBLE (CGPA {cand.cgpa})</span>
                  </div>
                  <span className="text-slate-400 text-[10px]">Contact Anonymized</span>
                </div>

                {/* Skill Breakdown: Verified, Unverified, Missing */}
                <div className="mt-3 space-y-2">
                  <div>
                    <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block mb-1">
                      Verified Competencies ({cand.verifiedSkills.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cand.verifiedSkills.map((sk) => (
                        <span key={sk} className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200/70 px-2 py-0.5 rounded font-medium">
                          ✓ {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {cand.unverifiedSkills && (
                    <div>
                      <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider block mb-1">
                        Self-Declared / Pending ({cand.unverifiedSkills.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {cand.unverifiedSkills.map((sk) => (
                          <span key={sk} className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium">
                            ? {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {cand.skillGaps && (
                    <div>
                      <span className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider block mb-1">
                        Skill Gaps ({cand.skillGaps.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {cand.skillGaps.map((sk) => (
                          <span key={sk} className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-medium">
                            ✕ {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Code Evidence Link */}
                <div className="mt-3 text-xs flex items-center gap-1.5 text-slate-500">
                  <FolderGit2 className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{cand.githubRepo}</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button
                  onClick={() => setSelectedCandidate(cand)}
                  variant="outline"
                  size="sm"
                >
                  Inspect Evidence
                </Button>
                <Button
                  onClick={() => handleToggleShortlist(cand.id, cand.name)}
                  variant={isShortlisted ? 'emerald' : 'primary'}
                  size="sm"
                >
                  {isShortlisted ? '✓ Shortlisted' : '+ Shortlist for Round 1'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Candidate Evidence Modal */}
      <Modal
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        title={selectedCandidate ? `${selectedCandidate.name} - Verified Candidate Profile` : 'Candidate'}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setSelectedCandidate(null)} variant="outline" size="sm">
              Close
            </Button>
            {selectedCandidate && (
              <Button
                onClick={() => {
                  handleToggleShortlist(selectedCandidate.id, selectedCandidate.name);
                  setSelectedCandidate(null);
                }}
                variant="primary"
                size="sm"
              >
                {shortlistedSet.has(selectedCandidate.id) ? 'Remove Shortlist' : 'Add to Shortlist'}
              </Button>
            )}
          </div>
        }
      >
        {selectedCandidate && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block mb-1">Authentic Evidence Repositories</span>
              <p className="font-mono text-slate-800">{selectedCandidate.githubRepo}</p>
              <p className="text-[11px] text-slate-500 mt-1">Verified with git commit timestamps and faculty code evaluation rubric.</p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-1">Academic Status</h4>
              <p className="text-slate-600">Enrolled in {selectedCandidate.branch}, CGPA: {selectedCandidate.cgpa} / 10.0 with 0 active backlogs.</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
