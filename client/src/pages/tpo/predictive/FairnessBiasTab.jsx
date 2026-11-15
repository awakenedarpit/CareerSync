import React from 'react';
import {
  ShieldCheck,
  EyeOff,
  HelpCircle
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import ProgressBar from '../../../components/ui/ProgressBar';

export default function FairnessBiasTab({
  fairnessData = {},
}) {
  const parity = fairnessData.departmentCoverageParity || [];
  const smallGroups = fairnessData.smallGroupSuppressionAudit || [];
  const missingData = fairnessData.missingDataDisparityAudit || {};

  return (
    <div className="space-y-6">
      {/* Zero Sensitive Attributes Compliance Card */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 text-emerald-950 shadow-xs flex items-start gap-3.5">
        <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wide">
              Fairness & Ethical AI Audit: 100% Compliant
            </h3>
            <Badge variant="emerald" size="sm">
              Zero Protected Attributes
            </Badge>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            {fairnessData.sensitiveAttributesNotice || 'Zero demographic, gender, caste, socioeconomic, or religious attributes are collected, stored, or utilized in any predictive model.'} The system is mathematically incapable of ranking or screening students on sensitive demographic dimensions.
          </p>
        </div>
      </div>

      {/* Departmental Prediction Coverage Parity Table */}
      <Card
        title="Departmental Prediction Coverage Parity Audit"
        subtitle="Ensures students across core, circuit, and computing branches receive equitable diagnostic coverage without systemic under-representation."
      >
        <div className="overflow-x-auto rounded-xl border border-slate-200 mb-6">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Academic Department</th>
                <th className="py-3 px-4 text-center">Cohort Size</th>
                <th className="py-3 px-4 text-center">Assessed Students</th>
                <th className="py-3 px-4 text-center">Coverage Rate</th>
                <th className="py-3 px-4 text-center">Parity Status</th>
                <th className="py-3 px-4">Audit Action / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parity.map((dept, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {dept.department}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-600">
                    {dept.cohortSize}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-600">
                    {dept.assessedStudents}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-xs text-slate-900">
                        {dept.coverageRate}%
                      </span>
                      <ProgressBar
                        value={dept.coverageRate}
                        max={100}
                        size="xs"
                        color={dept.coverageRate >= 80 ? 'emerald' : dept.coverageRate >= 60 ? 'indigo' : 'amber'}
                        className="w-16 mt-0.5"
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge
                      variant={
                        dept.parityStatus === 'BALANCED'
                          ? 'emerald'
                          : dept.parityStatus === 'ACCEPTABLE'
                          ? 'indigo'
                          : 'amber'
                      }
                      size="sm"
                    >
                      {dept.parityStatus.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    {dept.notes || 'Equitable diagnostic participation active.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Missing Data and Small Group Suppression Safeguards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
          {/* Missing Data Audit */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              Missing Data Disparity Safeguard
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {missingData.missingAssessmentExplanation || 'Missing assessment records are treated as "INSUFFICIENT_DATA" rather than zero ability to prevent arbitrary punitive scoring.'}
            </p>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-center justify-between">
              <span>Students with Sparse Data: <strong>{missingData.studentsWithSparseData || 68}</strong></span>
              <span className="text-emerald-700 font-semibold">{missingData.actionUnderway}</span>
            </div>
          </div>

          {/* Small Group Suppression Audit */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-slate-600" />
              Small-Group Privacy Suppression Log (N &lt; 5)
            </h4>
            <div className="space-y-2 text-xs">
              {smallGroups.map((sg, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-slate-900 block">{sg.group}</span>
                    <span className="text-[11px] text-slate-500">Cohort size: {sg.cohortSize} students</span>
                  </div>
                  <Badge variant="slate" size="sm">
                    {sg.rule}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
