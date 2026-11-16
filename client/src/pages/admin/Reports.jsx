import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  CheckCircle2,
  FileText,
  FileDown
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function AdminReports() {
  const [downloadSuccess, setDownloadSuccess] = useState('');

  const reports = [
    {
      id: 'REP-01',
      title: 'NIRF / NAAC Placement Institutional Compliance Report 2024-25',
      desc: 'Official accredited disclosure including branch medians, verified offer letters, and higher education progression.',
      date: 'Updated Yesterday',
      size: '2.4 MB',
      format: 'PDF / CSV'
    },
    {
      id: 'REP-02',
      title: 'Cohort Verified Technical Skill Inventory Audit',
      desc: 'Granular breakdown of verified code artifacts, student GitHub activity, and benchmarked competencies.',
      date: 'Nov 12, 2024',
      size: '4.8 MB',
      format: 'CSV / Excel'
    },
    {
      id: 'REP-03',
      title: 'Recruiter Drive Analytics & Offer Acceptance Synthesis',
      desc: 'Summary of company visiting metrics, packages offered, gender diversity ratios, and selection rates.',
      date: 'Nov 01, 2024',
      size: '1.8 MB',
      format: 'PDF'
    }
  ];

  const handleDownload = (title) => {
    setDownloadSuccess(`Generated export package for "${title}". Downloading.`);
    setTimeout(() => setDownloadSuccess(''), 4000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutional Placement Reports & Export Center"
        subtitle="Generate accredited placement summaries, verified skill evidence audits, and compliance documentation."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Reports' }]}
      />

      {downloadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reports.map((rep) => (
          <Card key={rep.id} hover className="p-5 border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="aqua" size="sm">{rep.format}</Badge>
                <span className="text-xs text-slate-400">{rep.size}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">{rep.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">{rep.desc}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">{rep.date}</span>
              <Button onClick={() => handleDownload(rep.title)} variant="outline" size="sm">
                <Download className="h-3.5 w-3.5 mr-1" />
                Export
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
