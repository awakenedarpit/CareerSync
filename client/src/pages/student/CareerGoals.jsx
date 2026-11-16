import React, { useState } from 'react';
import {
  Target,
  Check,
  Building,
  MapPin,
  IndianRupee,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Save
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';

export default function CareerGoals() {
  const [selectedRole, setSelectedRole] = useState('fullstack');
  const [targetSalary, setTargetSalary] = useState('14 - 24 LPA');
  const [preferredLocations, setPreferredLocations] = useState(['Bengaluru', 'Hyderabad', 'Remote']);
  const [savedAlert, setSavedAlert] = useState(false);

  const roles = [
    {
      id: 'fullstack',
      title: 'Full Stack Engineer',
      readiness: 78,
      demand: 'Very High',
      avgPackage: '12 - 28 LPA',
      coreSkills: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'System Design'],
      match: 'Strong Match'
    },
    {
      id: 'backend',
      title: 'Backend Systems Engineer',
      readiness: 72,
      demand: 'High',
      avgPackage: '14 - 30 LPA',
      coreSkills: ['Node.js/Go', 'PostgreSQL', 'Redis', 'Microservices', 'Distributed Systems'],
      match: 'Good Match'
    },
    {
      id: 'frontend',
      title: 'Frontend Specialist',
      readiness: 85,
      demand: 'High',
      avgPackage: '10 - 22 LPA',
      coreSkills: ['React', 'TypeScript', 'Tailwind CSS', 'Performance Tuning', 'Next.js'],
      match: 'Top Match'
    },
    {
      id: 'devops',
      title: 'Cloud & DevOps Engineer',
      readiness: 45,
      demand: 'Growing',
      avgPackage: '12 - 26 LPA',
      coreSkills: ['Docker', 'Kubernetes', 'AWS/GCP', 'CI/CD Pipelines', 'Terraform'],
      match: 'Gaps Present'
    },
    {
      id: 'ml_ai',
      title: 'AI / ML Engineer',
      readiness: 40,
      demand: 'Very High',
      avgPackage: '15 - 35 LPA',
      coreSkills: ['Python', 'PyTorch', 'FastAPI', 'Vector Databases', 'Prompt Engineering'],
      match: 'Gaps Present'
    }
  ];

  const currentRole = roles.find(r => r.id === selectedRole) || roles[0];

  const handleSave = () => {
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Career Goals & Target Role Selection"
        subtitle="Align your skill development with target industry roles and compensation brackets."
        breadcrumbs={[{ label: 'Student', href: '/student' }, { label: 'Career Goals' }]}
        action={
          <Button onClick={handleSave} variant="primary" size="sm">
            <Save className="h-4 w-4 mr-1.5" />
            Save Target Preferences
          </Button>
        }
      />

      {savedAlert && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>Target goal preferences saved. Skill gap analytics updated for {currentRole.title}.</span>
        </div>
      )}

      {/* Target Role Selector Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Select Primary Target Job Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`cursor-pointer rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-white ring-2 ring-[#02E8A7]/20 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-bold text-slate-900">{role.title}</h4>
                    {isSelected && (
                      <span className="h-5 w-5 rounded-full bg-[#02E8A7] text-[#002020] font-bold flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs mb-3">
                    <Badge variant={role.readiness > 70 ? 'emerald' : 'amber'} size="sm">
                      {role.match}
                    </Badge>
                    <span className="text-slate-500">• Demand: {role.demand}</span>
                  </div>

                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Curriculum Alignment</span>
                      <span className="font-semibold">{role.readiness}%</span>
                    </div>
                    <ProgressBar
                      value={role.readiness}
                      variant={role.readiness > 70 ? 'emerald' : 'amber'}
                      size="sm"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between items-center">
                  <span>Avg Package:</span>
                  <strong className="text-slate-800">{role.avgPackage}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Role Calibration Details */}
      <Card className="p-6 border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#009669]">Target Role Config</span>
            <h3 className="text-xl font-bold text-slate-900">{currentRole.title}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Current cohort competitiveness index: <strong>78th Percentile</strong>
            </p>
          </div>
          <Button to="/student/skill-gap" variant="outline" size="sm">
            View Role Skill Gap Matrix
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Target Salary Preference */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <IndianRupee className="h-4 w-4 text-emerald-600" />
              <span>Compensation Bracket</span>
            </div>
            <select
              value={targetSalary}
              onChange={(e) => setTargetSalary(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 focus:border-[#02E8A7] focus:outline-hidden"
            >
              <option value="6 - 12 LPA">6 - 12 LPA (Mass Tech / IT Services)</option>
              <option value="12 - 20 LPA">12 - 20 LPA (Product & Mid-Tier)</option>
              <option value="14 - 24 LPA">14 - 24 LPA (Tier-1 Product / Unicorns)</option>
              <option value="25+ LPA">25+ LPA (Global Tech / Quant / Tier-1 Elite)</option>
            </select>
            <p className="text-[11px] text-slate-400">Used to filter automatic drive recommendations.</p>
          </div>

          {/* Location Preferences */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <MapPin className="h-4 w-4 text-[#009669]" />
              <span>Location Flexibility</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['Bengaluru', 'Hyderabad', 'Pune', 'Delhi NCR', 'Remote'].map((loc) => {
                const active = preferredLocations.includes(loc);
                return (
                  <button
                    key={loc}
                    onClick={() => {
                      if (active) {
                        setPreferredLocations(preferredLocations.filter(l => l !== loc));
                      } else {
                        setPreferredLocations([...preferredLocations, loc]);
                      }
                    }}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                      active
                        ? 'bg-[#BDF9F9]/30 border-[#02E8A7]/50 text-[#004D36] font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Milestone Target Date */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Calendar className="h-4 w-4 text-[#009669]" />
              <span>Placement Season Target</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700">
              <strong>Campus Drive Phase 1:</strong> Starts Oct 15, 2024
              <div className="text-[11px] text-slate-500 mt-0.5">Eligibility cutoff: Oct 01, 2024</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
