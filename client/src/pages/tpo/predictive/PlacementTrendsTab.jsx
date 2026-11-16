import React from 'react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import ProgressBar from '../../../components/ui/ProgressBar';

export default function PlacementTrendsTab({
  trendsData = {},
  recruiterData = {},
}) {
  const funnel = trendsData.funnelConversion || {};
  const roles = trendsData.roleDistribution || [];
  const salaryBands = trendsData.salaryBands || [];
  const recruiters = recruiterData.topEngagedRecruiters || [];
  const pipeline = recruiterData.corporatePipelineSummary || {};

  return (
    <div className="space-y-6">
      {/* Placement Funnel Conversion Analysis */}
      <Card
        title="Placement Funnel & Candidate Conversion Pipeline"
        subtitle="End-to-end institutional conversion rates from registration through shortlist, interview rounds, and offer acceptance."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-xs uppercase font-semibold text-slate-500 block">
              1. Registered Candidates
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {funnel.registeredStudents || 480}
            </div>
            <span className="text-[11px] text-slate-400">Total Placement Enrolled</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-xs uppercase font-semibold text-slate-500 block">
              2. Shortlisted Candidates
            </span>
            <div className="text-2xl font-black text-[#004D36] mt-1">
              {funnel.shortlistedStudents || 394}{' '}
              <span className="text-xs font-normal text-slate-500">
                ({funnel.shortlistRate || 82.1}%)
              </span>
            </div>
            <ProgressBar value={funnel.shortlistRate || 82.1} max={100} size="xs" color="teal" className="mt-2" />
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-xs uppercase font-semibold text-slate-500 block">
              3. Interview Progression
            </span>
            <div className="text-2xl font-black text-[#004D36] mt-1">
              {funnel.interviewedStudents || 310}{' '}
              <span className="text-xs font-normal text-slate-500">
                ({funnel.interviewRate || 64.6}%)
              </span>
            </div>
            <ProgressBar value={funnel.interviewRate || 64.6} max={100} size="xs" color="aqua" className="mt-2" />
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-xs uppercase font-semibold text-slate-500 block">
              4. Unique Placed Students
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {funnel.offeredStudents || 254}{' '}
              <span className="text-xs font-normal text-slate-500">
                ({funnel.offerRate || 52.9}%)
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 block mt-1">
              Total Offers: {funnel.totalOffersIssued || 362} ({funnel.multipleOffersCount || 88} multiple)
            </span>
          </div>
        </div>

        {/* Role Distribution & Salary Bands */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-5">
          {/* Target Role Distribution */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Offer Distribution by Target Career Role
            </h4>
            <div className="space-y-3">
              {roles.map((r, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{r.role}</span>
                    <span className="text-slate-600 font-mono">
                      {r.count} offers ({r.percentage}%)
                    </span>
                  </div>
                  <ProgressBar value={r.percentage} max={100} size="xs" color="teal" />
                </div>
              ))}
            </div>
          </div>

          {/* Salary Compensation Bands */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Compensation Tiers (Authorized TPO View)
            </h4>
            <div className="space-y-3">
              {salaryBands.map((sb, i) => (
                <div key={i} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-800">
                    <span>{sb.band}</span>
                    <span className="text-emerald-700 font-bold">{sb.percentage}%</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{sb.count} total offers secured</span>
                  </div>
                  <ProgressBar value={sb.percentage} max={100} size="xs" color="emerald" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Recruiter Engagement & Corporate Pipeline */}
      <Card
        title="Recruiter Engagement Analytics & Corporate Pipeline"
        subtitle={`Active corporate network: ${pipeline.totalOnboardedCompanies || 74} verified enterprise partners • ${pipeline.activeApprovedJobs || 118} active approved job requisitions.`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500">Onboarded Companies</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {pipeline.totalOnboardedCompanies || 74}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500">Conducted Drives</span>
            <div className="text-xl font-black text-[#004D36] mt-0.5">
              {pipeline.conductedDrives || 38}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500">Upcoming Drives</span>
            <div className="text-xl font-black text-sky-700 mt-0.5">
              {pipeline.upcomingDrives || 16}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500">Avg Time to Offer</span>
            <div className="text-xl font-black text-emerald-700 mt-0.5">
              {pipeline.averageTimeToOfferDays || 14.2} days
            </div>
          </div>
        </div>

        {/* Top Recruiters Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Corporate Recruiter</th>
                <th className="py-3 px-4">Recruitment Tier</th>
                <th className="py-3 px-4 text-center">Roles</th>
                <th className="py-3 px-4 text-center">Openings</th>
                <th className="py-3 px-4 text-center">Shortlists</th>
                <th className="py-3 px-4 text-center">Offers Issued</th>
                <th className="py-3 px-4 text-center">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recruiters.map((rec, i) => (
                <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {rec.company}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        rec.tier === 'Super Dream'
                          ? 'purple'
                          : rec.tier === 'Dream'
                          ? 'indigo'
                          : 'slate'
                      }
                      size="sm"
                    >
                      {rec.tier}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-xs">{rec.roles}</td>
                  <td className="py-3.5 px-4 text-center font-mono text-xs">{rec.openings}</td>
                  <td className="py-3.5 px-4 text-center font-mono text-xs">{rec.shortlists}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900">{rec.offers}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-semibold text-emerald-700 text-xs">
                      {rec.conversionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
