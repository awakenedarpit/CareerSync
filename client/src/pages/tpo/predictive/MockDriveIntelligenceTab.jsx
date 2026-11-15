import React from 'react';
import {
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import ProgressBar from '../../../components/ui/ProgressBar';

export default function MockDriveIntelligenceTab({
  mockData = {},
  skillImprovement = {},
}) {
  const summary = mockData.summary || {};
  const rounds = mockData.roundProgression || [];
  const weaknesses = mockData.topicWeaknesses || [];
  const trajectories = skillImprovement.trajectories || [];
  const milestones = skillImprovement.longitudinalMilestones || [];

  return (
    <div className="space-y-6">
      {/* Practice vs Recruitment Separation Banner */}
      <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-xs text-sky-950 shadow-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sm text-sky-950">
            Phase 12 Mock Drive Integration: Practice vs Recruitment Distinction
          </p>
          <p className="text-sky-800 leading-relaxed">
            All mock drive assessments, coding sandboxes, and simulated interview reps are designated as <strong>developmental learning opportunities</strong>. In strict compliance with institutional guidelines, mock drive errors or unfinished attempts are never transmitted to corporate recruiters, nor can they be used as grounds for student placement disqualification.
          </p>
        </div>
      </div>

      {/* 3-Round Mock Progression Pipeline */}
      <Card
        title="Mock Drive Funnel & Round Progression (Phase 12 Benchmark)"
        subtitle={`Total evaluated candidates: N=${summary.totalParticipants || 420} • Cumulative simulated clearance rate: ${summary.overallPassRate || 68.2}%`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {rounds.map((round) => (
            <div
              key={round.roundNumber}
              className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Round {round.roundNumber}
                  </span>
                  <Badge variant={round.passPercentage >= 75 ? 'emerald' : 'indigo'} size="sm">
                    {round.passPercentage}% Cleared
                  </Badge>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {round.roundName}
                </h4>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                  <span>Participants: {round.participants}</span>
                  <span className="font-semibold text-slate-700">
                    Cleared: {round.cleared}
                  </span>
                </div>
                <ProgressBar
                  value={round.passPercentage}
                  max={100}
                  size="xs"
                  color={round.passPercentage >= 75 ? 'emerald' : 'indigo'}
                  className="mt-2"
                />
              </div>

              {/* Identified Round Bottlenecks */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <span className="font-semibold text-slate-700 block mb-1">
                  Primary Deficit Areas:
                </span>
                <div className="space-y-1">
                  {round.bottleneckTopics?.map((bt, i) => (
                    <div key={i} className="flex justify-between text-[11px] text-slate-600">
                      <span>• {bt.topic}</span>
                      <span className="text-amber-700 font-semibold">{bt.weaknessScore}% deficit</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Diagnostic Topic Bottlenecks Table */}
        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Algorithmic & Technical Deficit Heatmap
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {weaknesses.map((w, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-200 bg-white text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between font-semibold text-slate-800">
                  <span className="truncate pr-2">{w.topic}</span>
                  <span className="text-amber-600 font-bold shrink-0">
                    {w.studentDeficitPercentage}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Category: <strong>{w.category}</strong>
                </div>
                <div className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-medium">
                  Prescription: {w.recommendedIntervention}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Longitudinal Skill Improvement Tracking */}
      <Card
        title="Longitudinal Skill Improvement Tracking & Learning Deltas"
        subtitle={skillImprovement.cohortGrowthDelta || '+18.4% Average Mastery Gain over 6 Weeks'}
      >
        <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Enforcement Rule:</strong> {skillImprovement.learningEnforcementNote || 'Completed learning tasks alone do not grant verified status without assessment verification.'}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 mb-6">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Core Skill Domain</th>
                <th className="py-3 px-4 text-center">Baseline Mastery</th>
                <th className="py-3 px-4 text-center">Current Mastery</th>
                <th className="py-3 px-4 text-center">Relative Gain</th>
                <th className="py-3 px-4 text-center">Verified Delta</th>
                <th className="py-3 px-4">Progress Trajectory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trajectories.map((traj, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {traj.skill}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500">
                    {traj.baselineAvg}%
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-sm font-bold text-slate-900">
                    {traj.currentAvg}%
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant="emerald" size="sm">
                      +{traj.growthPercentage}%
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-center text-xs font-bold text-indigo-700">
                    {traj.verifiedDeltas}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="w-36">
                      <ProgressBar
                        value={traj.currentAvg}
                        max={100}
                        size="xs"
                        color="emerald"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Longitudinal Milestones Progression */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Cohort Weekly Progression Milestones
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {milestones.map((m, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-200 bg-white text-center space-y-1"
              >
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  {m.week.split(' ')[0]} {m.week.split(' ')[1]}
                </span>
                <span className="text-lg font-black text-slate-900 block">
                  {m.avgReadiness}%
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {m.assessmentsLogged} logs
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
