import React from 'react';
import { Shield } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import ProgressBar from '../../../components/ui/ProgressBar';

export default function CohortDepartmentTab({
  batchAnalytics = [],
  departmentAnalytics = [],
}) {
  return (
    <div className="space-y-6">
      {/* Batch-wise Longitudinal Comparison */}
      <Card
        title="Batch-wise Comparative Placement Analytics"
        subtitle="Longitudinal historical cohort metrics with explicit sample sizes, denominators, and active season status."
      >
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Batch</th>
                <th className="py-3 px-4">Cohort Status</th>
                <th className="py-3 px-4 text-center">Placed / Registered</th>
                <th className="py-3 px-4 text-center">Placement Rate</th>
                <th className="py-3 px-4 text-center">Total Offers</th>
                <th className="py-3 px-4 text-center">Avg Package (LPA)</th>
                <th className="py-3 px-4 text-center">Recruiters</th>
                <th className="py-3 px-4 text-center">Data Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batchAnalytics.map((batch) => {
                const isOngoing = batch.status === 'ACTIVE_IN_PROGRESS';
                const isUpcoming = batch.status === 'UPCOMING_COHORT';

                return (
                  <tr key={batch.batch} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      Batch {batch.batch}
                    </td>
                    <td className="py-3.5 px-4">
                      {isOngoing ? (
                        <Badge variant="aqua" size="sm">
                          Active Season (Interim)
                        </Badge>
                      ) : isUpcoming ? (
                        <Badge variant="slate" size="sm">
                          Upcoming Cohort
                        </Badge>
                      ) : (
                        <Badge variant="emerald" size="sm">
                          Historical Audited
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs font-mono">
                      {isUpcoming ? (
                        <span className="text-slate-400">0 / 0</span>
                      ) : (
                        `${batch.placedStudents} / ${batch.registeredPlacement}`
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isUpcoming ? (
                        <span className="text-slate-400 text-xs">N/A</span>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span
                            className={`font-black ${
                              batch.placementRate >= 85
                                ? 'text-emerald-700'
                                : batch.placementRate >= 70
                                ? 'text-[#004D36]'
                                : 'text-amber-700'
                            }`}
                          >
                            {batch.placementRate}%
                          </span>
                          <ProgressBar
                            value={batch.placementRate}
                            max={100}
                            size="xs"
                            color={batch.placementRate >= 80 ? 'emerald' : 'indigo'}
                            className="w-16 mt-0.5"
                          />
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                      {isUpcoming ? '-' : batch.totalOffers}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs">
                      {isUpcoming ? (
                        <span className="text-slate-400">-</span>
                      ) : (
                        <span>
                          ₹{batch.avgPackageLpa} <span className="text-slate-400">(med: ₹{batch.medianPackageLpa})</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-700">
                      {isUpcoming ? '-' : `${batch.topRecruitersCount} orgs`}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs">
                      <span className="font-semibold text-slate-700">
                        {batch.dataCoverageRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Department Capability Matrices & Small-Group Suppression */}
      <Card
        title="Departmental Capability Matrices & Technical Foundations"
        subtitle="Granular evaluation across core technical disciplines. Notice: Small groups (N < 5) are strictly suppressed to safeguard individual student privacy."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departmentAnalytics.map((dept) => {
            const isSuppressed = !dept.sampleSizeMet;

            return (
              <div
                key={dept.code}
                className={`p-5 rounded-xl border transition-all ${
                  isSuppressed
                    ? 'border-slate-300 bg-slate-50/90 text-slate-500'
                    : 'border-slate-200 bg-white shadow-2xs'
                }`}
              >
                {/* Department Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-slate-900 text-base">
                        {dept.code}
                      </span>
                      <span className="text-xs text-slate-500 font-normal">
                        ({dept.name})
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Cohort: {dept.totalCohort} • Participating: {dept.participating}
                    </div>
                  </div>

                  {isSuppressed ? (
                    <Badge variant="slate" size="sm">
                      <Shield className="w-3 h-3 mr-1 text-slate-500" />
                      N &lt; 5 Suppressed
                    </Badge>
                  ) : (
                    <div className="text-right">
                      <div className="text-sm font-black text-[#004D36]">
                        {dept.readinessAvg}%
                      </div>
                      <div className="text-[10px] text-slate-400">Avg Readiness</div>
                    </div>
                  )}
                </div>

                {isSuppressed ? (
                  <div className="p-4 rounded-lg border border-dashed border-slate-300 bg-slate-100/60 text-center my-4 space-y-2">
                    <Shield className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">
                      Small-Group Privacy Protection Active
                    </p>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      With {dept.participating} registered students, individual capability breakdown and placement rates are masked to prevent inadvertent identification.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Capability Matrix Dimensions */}
                    <div className="space-y-2.5 my-4 border-t border-b border-slate-100 py-3 text-xs">
                      {Object.entries(dept.capabilityMatrix || {}).map(([dimKey, score]) => {
                        const dimLabels = {
                          dataStructures: 'Data Structures & Algorithmic Problem Solving',
                          systemDesign: 'System Design & Distributed Scalability',
                          webTechnologies: 'Modern Web Frameworks & APIs',
                          cloudDevOps: 'Cloud Computing, CI/CD & Containers',
                          databaseManagement: 'Relational DBs, SQL & Data Modeling',
                        };
                        return (
                          <div key={dimKey} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-medium text-slate-700">
                              <span className="truncate pr-2">{dimLabels[dimKey] || dimKey}</span>
                              <span className="font-bold text-slate-900 shrink-0">{score}%</span>
                            </div>
                            <ProgressBar
                              value={score}
                              max={100}
                              size="xs"
                              color={score >= 75 ? 'emerald' : score >= 60 ? 'indigo' : 'amber'}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Top Bottleneck and Placement Stats */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Current Placement Rate:</span>
                        <strong className="text-slate-900">
                          {dept.currentRate}% ({dept.placedCount} placed)
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Historical Benchmark:</span>
                        <span className="text-slate-700">{dept.historicalRate}%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 text-[11px] text-amber-900 mt-2">
                        <strong className="block text-amber-950 mb-0.5">Key Identified Deficit:</strong>
                        {dept.topWeakness}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
