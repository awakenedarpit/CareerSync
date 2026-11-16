import React, { useState } from 'react';
import {
  MessageSquare,
  Star,
  CheckCircle2,
  Save,
  Send,
  Sparkles
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';

export default function CandidateFeedback() {
  const [candidate, setCandidate] = useState('Priya Sharma (CS2021-084)');
  const [decision, setDecision] = useState('hire_strong');
  const [feedbackText, setFeedbackText] = useState(
    'Exceptional clarity in JavaScript async patterns and database query planning. Recommend offering immediate FTE position.'
  );
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Interview Feedback & Decision Engine"
        subtitle="Submit structured interview evaluations. Feedback automatically feeds into the student's Skill-Gap learning loop."
        breadcrumbs={[{ label: 'Recruiter', href: '/recruiter' }, { label: 'Candidate Feedback' }]}
      />

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Feedback successfully recorded and forwarded to T&P office.</span>
        </div>
      )}

      <Card className="p-6 border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs max-w-2xl">
          <Select
            label="Select Candidate"
            value={candidate}
            onChange={(e) => setCandidate(e.target.value)}
            options={[
              { value: 'Priya Sharma (CS2021-084)', label: 'Priya Sharma (CS2021-084) - ASE L3' },
              { value: 'Aarav Patel (CS2021-012)', label: 'Aarav Patel (CS2021-012) - ASE L3' },
              { value: 'Ananya Iyer (CS2021-028)', label: 'Ananya Iyer (CS2021-028) - Backend Intern' }
            ]}
          />

          <Select
            label="Hiring Decision Recommendation"
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            options={[
              { value: 'hire_strong', label: 'Strong Hire - Extend Offer Immediately' },
              { value: 'hire', label: 'Hire - Advance to Final Executive Round' },
              { value: 'hold', label: 'Hold - Evaluate Cohort Comparison' },
              { value: 'reject', label: 'Do Not Hire - Recommend Skill Improvement' }
            ]}
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Detailed Technical Assessment Notes</label>
            <textarea
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-[#02E8A7] focus:outline-hidden"
              placeholder="Provide constructive technical notes..."
            />
            <p className="text-[11px] text-slate-400">
              Notes are synthesized by the Industry Skill-Gap Agent to help candidates bridge deficiencies.
            </p>
          </div>

          <Button type="submit" variant="primary" size="md">
            <Send className="h-4 w-4 mr-1.5" />
            Submit Final Evaluation
          </Button>
        </form>
      </Card>
    </div>
  );
}
