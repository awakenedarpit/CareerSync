import React, { useState, useEffect } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  ChevronRight,
  Briefcase,
  Target
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import industryService from '../../services/industryService';

export default function CompanyIntelligence() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const list = await industryService.getCompanyIntelligenceList();
        setCompanies(list || []);
        if (list && list.length > 0) {
          setSelectedCompany(list[0]);
        }
      } catch (err) {
        console.error('Failed to load company intelligence:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredCompanies = companies.filter((c) =>
    c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company-Specific Skill Intelligence & Drive Calibration"
        subtitle="Benchmark your verified student competencies directly against the specific tech stacks and expectations of approved visiting companies."
        breadcrumbs={[
          { label: 'Student', href: '/student' },
          { label: 'Company Intelligence' }
        ]}
      />

      {/* Recruiter Privacy Protection Banner */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Recruiter Confidentiality & Privacy Guard Active
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Ethical Placement Governance
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              All company profiles are calibrated using authenticated job specifications and campus drive criteria. Recruiter private notes, internal hiring quotas, and individual interviewer annotations remain strictly confidential.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Company Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Companies Directory */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Visiting Campus Recruiters</h3>
            <span className="text-xs text-slate-500">{filteredCompanies.length} Companies</span>
          </div>

          <Input
            placeholder="Search company or sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={Search}
            size="sm"
          />

          <div className="space-y-2.5">
            {filteredCompanies.map((comp) => {
              const isSelected = selectedCompany?.companyId === comp.companyId;
              return (
                <div
                  key={comp.companyId}
                  onClick={() => setSelectedCompany(comp)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-sm font-bold text-slate-900">{comp.companyName}</h4>
                    <span className="text-xs font-black text-indigo-700">{comp.readinessScore}% Match</span>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">{comp.industry}</div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Drive: {comp.visitingDate}
                    </span>
                    <span className="font-medium text-indigo-600 flex items-center">
                      View Calibration <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Company In-Depth Intelligence */}
        <div className="lg:col-span-2">
          {selectedCompany ? (
            <Card className="p-6 border-slate-200 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-xl font-black text-slate-900">{selectedCompany.companyName}</h3>
                    <Badge variant="indigo" size="sm">Approved Partner</Badge>
                  </div>
                  <div className="text-xs text-slate-500">
                    Sector: <strong className="text-slate-700">{selectedCompany.industry}</strong> • Drive Scheduled:{' '}
                    <strong className="text-slate-700">{selectedCompany.visitingDate}</strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center sm:text-right min-w-[140px]">
                  <span className="text-[11px] text-slate-500 font-medium block">Personalized Readiness</span>
                  <span className="text-2xl font-black text-indigo-600">{selectedCompany.readinessScore}%</span>
                  <div className="w-full mt-1.5">
                    <ProgressBar
                      value={selectedCompany.readinessScore}
                      variant={selectedCompany.readinessScore >= 80 ? 'emerald' : 'indigo'}
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              {/* Active Roles Being Recruited */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Active Hiring Profiles for Campus Drive
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCompany.activeHiringRoles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                    >
                      <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Frequently Requested Tech Stack */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Frequently Requested Technologies
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCompany.frequentTechStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-50 text-slate-800 border border-slate-200"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Student Verified Matches vs Missing Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Verified Matches */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Your Verified Matches
                  </div>
                  <ul className="space-y-1.5">
                    {selectedCompany.studentVerifiedMatches.map((m) => (
                      <li key={m} className="flex items-center justify-between text-xs text-slate-800 bg-white p-2 rounded-lg border border-emerald-100">
                        <span>{m}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Matched
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Missing Skills */}
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/30">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900 uppercase tracking-wider mb-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    Missing Company Prerequisites
                  </div>
                  <ul className="space-y-1.5">
                    {selectedCompany.missingSkills.map((gap) => (
                      <li key={gap} className="flex items-center justify-between text-xs text-slate-800 bg-white p-2 rounded-lg border border-rose-100">
                        <span>{gap}</span>
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                          Gap to Close
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended Company Prep Actions */}
              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                    Targeted Preparation Playbook for {selectedCompany.companyName}
                  </h4>
                </div>
                <ul className="space-y-2 mb-4">
                  {selectedCompany.recommendedPreparation.map((prep, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <ChevronRight className="h-3.5 w-3.5 text-indigo-600 mt-0.5 shrink-0" />
                      <span>{prep}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-indigo-100">
                  <Button
                    variant="primary"
                    size="sm"
                    to="/student/mock-drives"
                  >
                    Take Company Practice Assessment
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    to="/student/learning-path"
                  >
                    Open Learning Tasks
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center border-slate-200">
              <Building2 className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-700">Select a company from the list</div>
              <div className="text-xs text-slate-400">View calibrated skill expectations and recommended preparation.</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
