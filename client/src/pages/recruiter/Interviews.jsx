import React, { useState } from 'react';
import {
  Users,
  Video,
  Calendar,
  Clock,
  CheckCircle2,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';

export default function RecruiterInterviews() {
  const [selectedInterview, setSelectedInterview] = useState(null);

  const interviews = [
    {
      id: 'INT-01',
      candidate: 'Priya Sharma',
      roll: 'CS2021-084',
      role: 'Associate Software Engineer',
      interviewer: 'Sarah Jenkins (Tech Lead)',
      time: 'Tomorrow, 10:00 AM - 11:00 AM',
      round: 'Round 1: DSA & System Problem Solving',
      meetUrl: 'https://meet.google.com/xyz-abcd-efg',
      status: 'Confirmed'
    },
    {
      id: 'INT-02',
      candidate: 'Aarav Patel',
      roll: 'CS2021-012',
      role: 'Associate Software Engineer',
      interviewer: 'David Chen (Staff Engineer)',
      time: 'Tomorrow, 02:00 PM - 03:00 PM',
      round: 'Round 2: Distributed Systems Deep Dive',
      meetUrl: 'https://meet.google.com/uvw-ijkl-mno',
      status: 'Confirmed'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Technical Interview Schedules & Panels"
        subtitle="Conduct verified candidate interview assessments with direct access to student code repositories."
        breadcrumbs={[{ label: 'Recruiter', href: '/recruiter' }, { label: 'Interviews' }]}
      />

      <div className="space-y-4">
        {interviews.map((item) => (
          <Card key={item.id} className="p-6 border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar name={item.candidate} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">{item.candidate}</h4>
                    <Badge variant="indigo" size="sm">{item.round}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Role: {item.role} • Panelist: <strong>{item.interviewer}</strong>
                  </div>
                  <div className="text-xs text-slate-600 mt-2 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={item.meetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-2xs"
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>Join Meet Room</span>
                </a>
                <Button to="/recruiter/feedback" variant="outline" size="sm">
                  <MessageSquare className="h-3.5 w-3.5 mr-1" />
                  Submit Feedback
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
