import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Eye,
  AlertTriangle,
  RotateCw,
  Database,
  FileText
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import Modal from '../../components/ui/Modal';
import accreditationService, {
  ACCREDITATION_STANDARDS,
  REPORT_CATEGORIES,
  FALLBACK_TEMPLATES,
  FALLBACK_REPORT_HISTORY
} from '../../services/accreditationService';

export default function AccreditationReports() {
  const [templates, setTemplates] = useState(FALLBACK_TEMPLATES);
  const [history, setHistory] = useState(FALLBACK_REPORT_HISTORY);
  const [refreshing, setRefreshing] = useState(false);

  // Selected Template & Form state
  const [selectedTemplateId, setSelectedTemplateId] = useState('tmpl-nirf-metric-52');
  const [selectedCategory, setSelectedCategory] = useState('CAT_01');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [batch, setBatch] = useState('2026');
  const [department, setDepartment] = useState('ALL');

  // Preview Modal State
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Export Trigger State
  const [exportingFormat, setExportingFormat] = useState(null);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [tmpls, hist] = await Promise.all([
        accreditationService.getTemplates(),
        accreditationService.getReportHistory(),
      ]);
      if (tmpls) setTemplates(tmpls);
      if (hist) setHistory(hist);
    } catch (err) {
      console.error('Failed to load accreditation data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenPreview = async () => {
    try {
      setPreviewLoading(true);
      const activeTmpl = templates.find((t) => t.id === selectedTemplateId) || templates[0];
      const preview = await accreditationService.previewReport({
        templateId: selectedTemplateId,
        title: activeTmpl.title,
        academicYear,
        batch,
        department,
        category: selectedCategory,
      });
      setPreviewData(preview);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Failed to preview report:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      setExportingFormat(format);
      const activeTmpl = templates.find((t) => t.id === selectedTemplateId) || templates[0];
      await accreditationService.exportReport({
        templateId: selectedTemplateId,
        title: activeTmpl.title,
        format,
        academicYear,
        batch,
        department,
      });
    } catch (err) {
      console.error('Failed to export report:', err);
    } finally {
      setExportingFormat(null);
    }
  };

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Accreditation & Regulatory Reporting Builder"
        subtitle="Automated compliance data generation for NAAC Criterion 5, NIRF Metric 5.2, NBA Criterion 10, and Board of Governors reviews."
        breadcrumbs={[
          { label: 'TPO Portal', href: '/tpo' },
          { label: 'Accreditation Reports' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={refreshing}>
              <RotateCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenPreview} disabled={previewLoading}>
              <Eye className="w-4 h-4 mr-1.5" />
              {previewLoading ? 'Compiling Preview...' : 'Preview Report'}
            </Button>
          </div>
        }
      />

      {/* Mandatory Statutory Disclosure Banner */}
      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 flex items-start gap-3 text-xs">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="font-bold text-amber-900">Legal & Regulatory Reporting Notice</h4>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            The accreditation report generators in CarrerSync are automated reporting aids configured to assist institutional documentation. 
            Generating these tables does not constitute an official accreditation certification without formal on-site audit and verification by NAAC, NIRF, NBA, or relevant statutory bodies.
          </p>
        </div>
      </div>

      {/* Configurable Report Builder Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="1. Select Regulatory Standard & Report Template"
            subtitle="Choose from 14 standardized reporting categories mapped to national and international higher education accreditation frameworks."
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pre-Configured Accreditation Template
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates.map((tmpl) => {
                    const isSelected = tmpl.id === selectedTemplateId;
                    const standardConfig = ACCREDITATION_STANDARDS[tmpl.standard] || ACCREDITATION_STANDARDS.NAAC;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => setSelectedTemplateId(tmpl.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-[#BDF9F9]/30/30 ring-2 ring-indigo-600/10'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              standardConfig.badgeVariant === 'emerald'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : standardConfig.badgeVariant === 'indigo'
                                ? 'bg-[#BDF9F9]/30 text-[#002020] border border-[#02E8A7]/40'
                                : standardConfig.badgeVariant === 'purple'
                                ? 'bg-[#BDF9F9]/30 text-[#002020] border border-[#02E8A7]/40'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {tmpl.standard}
                          </span>
                          <span className="font-mono text-[10px] text-emerald-700 font-bold">
                            {tmpl.coverageRate}% Populated
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{tmpl.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {tmpl.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 14 Categories Filter */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  14 Report Categories Matrix
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-medium text-slate-800 focus:bg-white focus:outline-hidden"
                >
                  {REPORT_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      [{cat.code}] {cat.name} ({cat.standard})
                    </option>
                  ))}
                </select>
              </div>

              {/* Scope Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Year</label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white p-2 font-medium text-slate-700 focus:outline-hidden"
                  >
                    <option value="2025-2026">2025-2026</option>
                    <option value="2024-2025">2024-2025</option>
                    <option value="2023-2024">2023-2024</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Graduating Batch</label>
                  <select
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white p-2 font-medium text-slate-700 focus:outline-hidden"
                  >
                    <option value="2026">Batch of 2026</option>
                    <option value="2025">Batch of 2025</option>
                    <option value="2024">Batch of 2024</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white p-2 font-medium text-slate-700 focus:outline-hidden"
                  >
                    <option value="ALL">All Departments (Institutional)</option>
                    <option value="CSE">Computer Science & Engineering</option>
                    <option value="IT">Information Technology</option>
                    <option value="ECE">Electronics & Communication</option>
                    <option value="EEE">Electrical & Electronics</option>
                    <option value="MECH">Mechanical Engineering</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Step 2: One-Click Export Triggers & Preview Summary */}
        <div className="space-y-6">
          <Card
            title="Export Triggers"
            subtitle="Download verified compliance data in institutional and regulatory file formats."
          >
            <div className="space-y-3">
              <Button
                variant="outline"
                size="md"
                className="w-full justify-center"
                onClick={() => handleExport('csv')}
                disabled={exportingFormat === 'csv'}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
                {exportingFormat === 'csv' ? 'Generating CSV...' : 'Download Official CSV (.csv)'}
              </Button>

              <Button
                variant="outline"
                size="md"
                className="w-full justify-center"
                onClick={() => handleExport('xlsx')}
                disabled={exportingFormat === 'xlsx'}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-[#009669]" />
                {exportingFormat === 'xlsx' ? 'Generating XLSX...' : 'Download Excel Sheet (.xlsx)'}
              </Button>

              <Button
                variant="outline"
                size="md"
                className="w-full justify-center"
                onClick={() => handleExport('pdf')}
                disabled={exportingFormat === 'pdf'}
              >
                <FileText className="w-4 h-4 mr-2 text-rose-600" />
                {exportingFormat === 'pdf' ? 'Formatting Print View...' : 'Export Printable / Text Report'}
              </Button>

              <div className="pt-3 border-t border-slate-100">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  onClick={handleOpenPreview}
                  disabled={previewLoading}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Inspect Completeness & Traceability
                </Button>
              </div>
            </div>

            {/* Template Specs Mini Box */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
              <div className="flex justify-between text-slate-500">
                <span>Selected:</span>
                <span className="font-semibold text-slate-800">{activeTemplate.standard}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Sample Size (N):</span>
                <span className="font-mono font-medium text-slate-700">{activeTemplate.sampleCount} records</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Data Completeness:</span>
                <span className="font-mono font-bold text-emerald-700">{activeTemplate.coverageRate}%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Generated Report History */}
      <Card
        title="Institutional Accreditation Report Archives"
        subtitle="Immutable ledger of historically generated NAAC, NIRF, and NBA compliance reports with cryptographic tamper-proof audit hashes."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Report Title & ID</th>
                <th className="py-2.5 px-3">Standard & Category</th>
                <th className="py-2.5 px-3">Academic Cycle</th>
                <th className="py-2.5 px-3">Generated By & Time</th>
                <th className="py-2.5 px-3">Completeness</th>
                <th className="py-2.5 px-3">Cryptographic Audit Hash</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs">
                    <div>{rep.title}</div>
                    <span className="text-[10px] text-slate-400 font-mono font-normal">ID: {rep.id}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#BDF9F9]/30 text-[#004D36] border border-[#02E8A7]/30">
                      {rep.template}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-700">{rep.academicYear}</td>
                  <td className="py-3 px-3 text-slate-600 text-[11px]">
                    <div>{rep.generatedBy}</div>
                    <span className="text-[10px] text-slate-400">{new Date(rep.generatedAt).toLocaleDateString()}</span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-700">{rep.completeness}</td>
                  <td className="py-3 px-3 font-mono text-[10px] text-slate-500">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{rep.auditHash}</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Button variant="ghost" size="xs" onClick={() => handleExport('csv')}>
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Comprehensive Report Preview Modal */}
      {isPreviewOpen && previewData && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Accreditation Preview: ${previewData.title}`}
          subtitle={`Academic Cycle: ${previewData.academicYear} • Standard: ${previewData.standard}`}
          maxWidth="max-w-4xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-slate-500">
                Data Completeness: <strong className="text-emerald-700">{previewData.completenessGauge.percentage}%</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)}>
                  Close Preview
                </Button>
                <Button variant="primary" size="sm" onClick={() => { setIsPreviewOpen(false); handleExport('csv'); }}>
                  <Download className="w-4 h-4 mr-1.5" />
                  Confirm & Export Report
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-5 text-xs">
            {/* Completeness Gauge & Warning Banner */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800">Field Completeness & Integrity Gauge</span>
                <span className="font-mono text-emerald-700 font-bold">{previewData.completenessGauge.percentage}%</span>
              </div>
              <ProgressBar value={previewData.completenessGauge.percentage} color="emerald" size="sm" />
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{previewData.completenessGauge.populatedFields} of {previewData.completenessGauge.totalFields} mandatory fields verified</span>
                <span className="text-emerald-700 font-medium">Optimal Completeness</span>
              </div>
            </div>

            {/* Evidence Traceability Table (Section 15 Scenario 10) */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Database className="w-4 h-4 text-[#009669]" />
                Evidence Traceability Matrix (Database Record Provenance)
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-2 px-3">Regulatory Metric</th>
                      <th className="py-2 px-3">Observed Value</th>
                      <th className="py-2 px-3">Source Relational Table</th>
                      <th className="py-2 px-3">Verification Artifact</th>
                      <th className="py-2 px-3 font-mono">Row Audit Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.evidenceTraceability.map((row) => (
                      <tr key={row.metric} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{row.metric}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#004D36]">{row.value}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{row.sourceTable}</td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px]">{row.verifiedEvidenceSource}</td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">{row.auditHash}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabular Data Rows Sample */}
            {previewData.dataRows && previewData.dataRows.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-900 mb-2">NIRF Data Matrix (Metric 5.2.1 / 5.2.2 Output)</h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="py-2 px-3">Academic Year</th>
                        <th className="py-2 px-3">Intake</th>
                        <th className="py-2 px-3">Graduated</th>
                        <th className="py-2 px-3">Placed Count</th>
                        <th className="py-2 px-3">Placement Rate</th>
                        <th className="py-2 px-3">Median Salary (INR)</th>
                        <th className="py-2 px-3">Higher Ed Progression</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewData.dataRows.map((r) => (
                        <tr key={r.academicYear}>
                          <td className="py-2 px-3 font-semibold text-slate-900">{r.academicYear}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{r.intake}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{r.graduated}</td>
                          <td className="py-2 px-3 font-mono font-bold text-[#004D36]">{r.placed}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">{r.placementRate}%</td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-700">₹{r.medianSalaryLpa} LPA</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{r.higherEd} candidates</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
