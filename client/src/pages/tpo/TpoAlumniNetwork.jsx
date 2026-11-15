import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Users,
  Search,
  Filter,
  BarChart3,
  ExternalLink,
  ShieldAlert,
  FileText,
  Building2,
  Calendar,
  Star,
  Check,
  Ban
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { alumniService } from '../../services/alumniService';
import {
  moderationService,
  MODERATION_ACTIONS
} from '../../services/moderationService';

export default function TpoAlumniNetwork() {
  const [activeTab, setActiveTab] = useState('VERIFICATION'); // VERIFICATION, DIRECTORY, ANALYTICS, MODERATION
  const [loading, setLoading] = useState(true);

  // Verification Queue
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [selectedAlumniForVerify, setSelectedAlumniForVerify] = useState(null);
  const [verifyDecision, setVerifyDecision] = useState('VERIFIED'); // 'VERIFIED' or 'REJECTED'
  const [verifyAuditNotes, setVerifyAuditNotes] = useState('');
  const [submittingVerify, setSubmittingVerify] = useState(false);

  // Verified Alumni Directory
  const [alumniDirectory, setAlumniDirectory] = useState([]);
  const [directorySearch, setDirectorySearch] = useState('');

  // Analytics
  const [analytics, setAnalytics] = useState(null);

  // Moderation Reports Queue
  const [moderationReports, setModerationReports] = useState([]);
  const [selectedReportForResolve, setSelectedReportForResolve] = useState(null);
  const [moderationAction, setModerationAction] = useState('WARNING_ISSUED');
  const [moderationResolutionNotes, setModerationResolutionNotes] = useState('');
  const [submittingModeration, setSubmittingModeration] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);
      const [queueData, dirData, analyticsData, modReportsData] = await Promise.all([
        alumniService.getTpoVerificationQueue(),
        alumniService.getDirectory(),
        alumniService.getTpoAlumniAnalytics(),
        moderationService.getTpoModerationReports(),
      ]);
      setVerificationQueue(Array.isArray(queueData) ? queueData : []);
      setAlumniDirectory(Array.isArray(dirData) ? dirData : []);
      setAnalytics(analyticsData);
      setModerationReports(Array.isArray(modReportsData) ? modReportsData : []);
    } catch (err) {
      console.error('Failed to load TPO Alumni Network data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifySubmit(e) {
    e.preventDefault();
    if (!selectedAlumniForVerify) return;

    try {
      setSubmittingVerify(true);
      await alumniService.verifyAlumni(selectedAlumniForVerify.id, {
        status: verifyDecision,
        reason: verifyAuditNotes,
        notes: verifyAuditNotes,
      });

      // Update state locally
      setVerificationQueue((prev) =>
        prev.filter((item) => item.id !== selectedAlumniForVerify.id)
      );
      setSelectedAlumniForVerify(null);
      setVerifyAuditNotes('');
      // Refresh directory
      const updatedDir = await alumniService.getDirectory();
      setAlumniDirectory(Array.isArray(updatedDir) ? updatedDir : []);
    } catch (err) {
      console.error('Failed to verify alumni:', err);
    } finally {
      setSubmittingVerify(false);
    }
  }

  async function handleResolveModerationSubmit(e) {
    e.preventDefault();
    if (!selectedReportForResolve) return;

    try {
      setSubmittingModeration(true);
      await moderationService.resolveModerationReport(selectedReportForResolve.id, {
        status: 'RESOLVED_ACTION_TAKEN',
        actionTaken: moderationAction,
        resolutionNotes: moderationResolutionNotes,
      });

      setModerationReports((prev) =>
        prev.map((r) =>
          r.id === selectedReportForResolve.id
            ? {
                ...r,
                status: 'RESOLVED_ACTION_TAKEN',
                actionTaken: moderationAction,
                resolutionNotes: moderationResolutionNotes,
              }
            : r
        )
      );
      setSelectedReportForResolve(null);
      setModerationResolutionNotes('');
    } catch (err) {
      console.error('Failed to resolve moderation report:', err);
    } finally {
      setSubmittingModeration(false);
    }
  }

  const filteredDirectory = alumniDirectory.filter((alum) => {
    if (!directorySearch) return true;
    const q = directorySearch.toLowerCase();
    return (
      alum.fullName?.toLowerCase().includes(q) ||
      alum.company?.toLowerCase().includes(q) ||
      alum.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Institutional Alumni Network & Student Moderation"
        subtitle="Verify alumni graduation credentials, oversee student mentorship programs, and govern real-time peer safety and conduct."
        badge="Phase 16 Governance"
        badgeVariant="purple"
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Alumni Verifications"
          value={verificationQueue.length.toString()}
          icon={Clock}
          iconColor="text-amber-600"
          bgColor="bg-amber-50"
          subtitle="Awaiting TPO validation"
        />
        <StatCard
          title="Verified Alumni Mentors"
          value={(analytics?.verifiedMentors || alumniDirectory.length || 86).toString()}
          icon={GraduationCap}
          iconColor="text-indigo-600"
          bgColor="bg-indigo-50"
          subtitle="Active institutional network"
        />
        <StatCard
          title="Mentorship Sessions"
          value={(analytics?.totalSessionsCompleted || 312).toString()}
          icon={Calendar}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
          subtitle="Completed student hours"
        />
        <StatCard
          title="Student Conduct Reports"
          value={moderationReports.filter(r => r.status === 'PENDING_REVIEW').length.toString()}
          icon={ShieldAlert}
          iconColor="text-rose-600"
          bgColor="bg-rose-50"
          subtitle="Pending conduct triage"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'VERIFICATION', label: `Pending Verification (${verificationQueue.length})` },
          { id: 'DIRECTORY', label: `Verified Alumni Directory (${alumniDirectory.length})` },
          { id: 'ANALYTICS', label: 'Mentorship Analytics' },
          { id: 'MODERATION', label: `Conduct & Safety Reports (${moderationReports.filter(r => r.status === 'PENDING_REVIEW').length} Open)` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Verification Queue */}
      {activeTab === 'VERIFICATION' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Institutional Verification Safeguard:</strong> Alumni registrations remain in <code>PENDING</code> status and are completely hidden from students until a verified TPO administrator explicitly cross-checks graduation year, degree, and current employment records.
            </p>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400">Loading queue...</div>
          ) : verificationQueue.length === 0 ? (
            <Card className="p-10 text-center border-slate-200">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
              <h3 className="text-sm font-semibold text-slate-900">Verification Queue Clear</h3>
              <p className="text-xs text-slate-500 mt-1">All alumni applications have been reviewed and approved.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {verificationQueue.map((item) => (
                <Card key={item.id} className="p-5 border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="amber" size="xs">Verification Pending</Badge>
                      <span className="text-xs text-slate-400">
                        Submitted {new Date(item.submittedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900">{item.fullName}</h3>
                      <p className="text-xs text-slate-600">
                        {item.role} @ <strong className="text-slate-800">{item.company}</strong> ({item.yearsExperience} yrs exp)
                      </p>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap gap-4">
                      <span><strong>Alum:</strong> Class of {item.graduationYear} ({item.degree || item.branch})</span>
                      <span><strong>Email:</strong> {item.email}</span>
                      {item.linkedinUrl && (
                        <a
                          href={item.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>LinkedIn Profile</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    {item.verificationNotes && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 font-mono">
                        {item.verificationNotes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        setSelectedAlumniForVerify(item);
                        setVerifyDecision('VERIFIED');
                      }}
                    >
                      Approve & Verify
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setSelectedAlumniForVerify(item);
                        setVerifyDecision('REJECTED');
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Verified Alumni Directory */}
      {activeTab === 'DIRECTORY' && (
        <div className="space-y-4">
          <Card className="p-4 border-slate-200 shadow-xs">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search alumni by name, company, or role..."
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDirectory.map((mentor) => (
              <Card key={mentor.id} className="p-5 border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{mentor.fullName}</h3>
                        <Badge variant="emerald" size="xs">Verified</Badge>
                      </div>
                      <p className="text-xs text-purple-700 font-medium">{mentor.role} @ {mentor.company}</p>
                      <p className="text-xs text-slate-500">Class of {mentor.graduationYear} • {mentor.branch}</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-800">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      {mentor.rating || 4.9}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {mentor.skills?.slice(0, 4).map((s) => (
                      <span key={s} className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Domain: <strong>{mentor.domain}</strong></span>
                    <span>Weekly Capacity: <strong>{mentor.capacityWeekly || 2}</strong></span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Mentorship Analytics */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Domain Breakdown */}
            <Card className="p-6 border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Alumni Mentorship Domains Distribution
              </h3>
              <div className="space-y-3">
                {[
                  { domain: 'Software Engineering', percent: 56, count: '48 mentors' },
                  { domain: 'Data Science & Artificial Intelligence', percent: 25, count: '22 mentors' },
                  { domain: 'Cloud, DevOps & Production Systems', percent: 12, count: '10 mentors' },
                  { domain: 'Product Management & Consulting', percent: 7, count: '6 mentors' },
                ].map((item) => (
                  <div key={item.domain} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{item.domain}</span>
                      <span className="font-bold text-slate-900">{item.percent}% ({item.count})</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full" style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Impact & Outcomes */}
            <Card className="p-6 border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Institutional Outcomes & Placement Correlation
              </h3>
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <strong className="text-emerald-950 block mb-0.5">Mock Drive Success Lift:</strong>
                  Students completing at least 2 alumni mock sessions achieved a <strong>34% higher pass rate</strong> in final technical rounds.
                </div>
                <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                  <strong className="text-purple-950 block mb-0.5">Average Mentorship Rating:</strong>
                  <strong>4.92 / 5.0</strong> institutional satisfaction across 312 completed sessions.
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 block mb-0.5">Zero Privacy Violations:</strong>
                  Platform mediation successfully protected all student and alumni personal contact numbers and personal emails.
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 4: Conduct & Moderation Reports */}
      {activeTab === 'MODERATION' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-xs text-rose-900 flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Campus Conduct Moderation Queue:</strong> Reports logged by participants during 1-on-1 mentorship, peer mock interviews, or collaboration rooms are routed here for official administrative adjudication. Actions take immediate platform-wide effect.
            </p>
          </div>

          <div className="space-y-3">
            {moderationReports.map((report) => (
              <Card key={report.id} className="p-5 border-slate-200 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={report.status === 'PENDING_REVIEW' ? 'rose' : 'emerald'}
                        size="xs"
                      >
                        {report.status === 'PENDING_REVIEW' ? 'Review Required' : 'Resolved'}
                      </Badge>
                      <Badge variant="slate" size="xs">
                        {report.sessionType}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        Reported {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Reason: <span className="text-rose-700">{report.reason}</span>
                      </h3>
                      <p className="text-xs text-slate-600">
                        Reported User: <strong className="text-slate-800">{report.targetUserName}</strong> ({report.targetUserRole}) • Reporter: {report.reporterName} ({report.reporterRole})
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700 border border-slate-200">
                      <strong className="block text-slate-900 mb-0.5">Report Description:</strong>
                      <span>{report.description}</span>
                      {report.evidenceNotes && (
                        <div className="mt-1 text-slate-500 font-mono text-[11px]">
                          Evidence: {report.evidenceNotes}
                        </div>
                      )}
                    </div>

                    {report.resolutionNotes && (
                      <div className="rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800 border border-emerald-100">
                        <strong>Action Taken:</strong> {report.actionTaken} • <em>{report.resolutionNotes}</em>
                      </div>
                    )}
                  </div>

                  {report.status === 'PENDING_REVIEW' && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                      onClick={() => setSelectedReportForResolve(report)}
                    >
                      Adjudicate Report
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Verification Action Modal */}
      {selectedAlumniForVerify && (
        <Modal
          isOpen={!!selectedAlumniForVerify}
          onClose={() => setSelectedAlumniForVerify(null)}
          title={`${verifyDecision === 'VERIFIED' ? 'Approve' : 'Reject'} Alumni Mentor Registration`}
          size="md"
        >
          <form onSubmit={handleVerifySubmit} className="space-y-4 text-slate-700">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs">
              <div className="font-bold text-slate-900">{selectedAlumniForVerify.fullName}</div>
              <div>{selectedAlumniForVerify.role} @ {selectedAlumniForVerify.company}</div>
              <div className="text-slate-500">Graduation: Class of {selectedAlumniForVerify.graduationYear}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Audit Trail Reason / Notes <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="State the verification confirmation (e.g. cross-referenced university ledger) or reason for rejection..."
                value={verifyAuditNotes}
                onChange={(e) => setVerifyAuditNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setSelectedAlumniForVerify(null)}
                disabled={submittingVerify}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={verifyDecision === 'VERIFIED' ? 'primary' : 'danger'}
                size="md"
                disabled={submittingVerify}
              >
                {submittingVerify ? 'Processing...' : `Confirm ${verifyDecision}`}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Moderation Adjudication Modal */}
      {selectedReportForResolve && (
        <Modal
          isOpen={!!selectedReportForResolve}
          onClose={() => setSelectedReportForResolve(null)}
          title={`Adjudicate Conduct Report: ${selectedReportForResolve.targetUserName}`}
          size="md"
        >
          <form onSubmit={handleResolveModerationSubmit} className="space-y-4 text-slate-700">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Administrative Action <span className="text-rose-500">*</span>
              </label>
              <select
                value={moderationAction}
                onChange={(e) => setModerationAction(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none focus:border-purple-500 bg-white"
              >
                {MODERATION_ACTIONS.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resolution Summary & Disciplinary Audit Note <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Explain the findings of the investigation and the justification for the disciplinary action taken..."
                value={moderationResolutionNotes}
                onChange={(e) => setModerationResolutionNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setSelectedReportForResolve(null)}
                disabled={submittingModeration}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={submittingModeration}
              >
                {submittingModeration ? 'Applying...' : 'Enforce Resolution'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
