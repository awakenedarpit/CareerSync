import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  FolderGit2,
  ArrowRight,
  Sparkles,
  Play,
  RotateCcw
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import Badge from '../../components/ui/Badge';

export default function LearningPath() {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Containerize Event Engine with Docker Compose',
      category: 'DevOps / Deployment',
      priority: 'High',
      estTime: '3.5 hrs',
      status: 'in_progress',
      resource: 'Official Docker MERN Guide',
      url: 'https://docs.docker.com',
      deliverable: 'Commit docker-compose.yml to GitHub repo'
    },
    {
      id: 2,
      title: 'Implement Redis Caching for Event Inventory',
      category: 'System Performance',
      priority: 'Medium',
      estTime: '2 hrs',
      status: 'not_started',
      resource: 'Redis Node.js Quickstart',
      url: 'https://redis.io',
      deliverable: 'Add Redis cache layer in Node.js routes'
    },
    {
      id: 3,
      title: 'Write Integration Tests with Vitest & Supertest',
      category: 'Code Quality',
      priority: 'High',
      estTime: '4 hrs',
      status: 'not_started',
      resource: 'Vitest Testing Guide',
      url: 'https://vitest.dev',
      deliverable: '>70% test coverage report in repo'
    },
    {
      id: 4,
      title: 'Study System Design: Scalable Rate Limiter',
      category: 'Interview Architecture',
      priority: 'Medium',
      estTime: '3 hrs',
      status: 'completed',
      resource: 'System Design Primer (GitHub)',
      url: 'https://github.com/donnemartin/system-design-primer',
      deliverable: 'Interactive architecture diagram submission'
    },
    {
      id: 5,
      title: 'TypeScript Strict Mode Migration',
      category: 'Languages',
      priority: 'Low',
      estTime: '2.5 hrs',
      status: 'completed',
      resource: 'TypeScript Handbook',
      url: 'https://www.typescriptlang.org',
      deliverable: 'Zero any types in devcollab repository'
    }
  ]);

  const toggleTaskStatus = (id) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'completed' ? 'in_progress' : t.status === 'in_progress' ? 'completed' : 'in_progress';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personalized Learning Path"
        subtitle="Curated micro-tasks and architectural modules to resolve your diagnosed skill gaps."
        breadcrumbs={[{ label: 'Student', href: '/student' }, { label: 'Learning Path' }]}
        action={
          <Button to="/student/skills" variant="outline" size="sm">
            Check Verified Skills
          </Button>
        }
      />

      {/* Progress Milestone Card */}
      <Card className="p-6 border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Track Progress</span>
            <h3 className="text-xl font-bold text-slate-900">Full Stack Placement Readiness Module</h3>
            <p className="text-xs text-slate-500 mt-1">
              {completedCount} of {tasks.length} core learning objectives completed.
            </p>
          </div>

          <div className="w-full md:w-64 space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Overall Completion</span>
              <span className="font-bold text-indigo-600">{progressPercent}%</span>
            </div>
            <ProgressBar value={progressPercent} variant="indigo" size="md" />
          </div>
        </div>

        {/* Milestone Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Milestone 1: Web Core</span>
            </div>
            <p className="text-[11px] text-slate-600">React, Node.js, SQL Database Design verified with code proof.</p>
            <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-700 uppercase">100% Completed</span>
          </div>

          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 mb-1">
              <Play className="h-4 w-4 text-indigo-600" />
              <span>Milestone 2: Containerization & Tests</span>
            </div>
            <p className="text-[11px] text-slate-600">Docker compose multi-container setup and test automation suites.</p>
            <span className="inline-block mt-2 text-[10px] font-semibold text-indigo-700 uppercase">In Progress (50%)</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>Milestone 3: Scale & System Design</span>
            </div>
            <p className="text-[11px] text-slate-600">Distributed caching, rate limiters, and mock technical interview rounds.</p>
            <span className="inline-block mt-2 text-[10px] font-semibold text-slate-400 uppercase">Next Up</span>
          </div>
        </div>
      </Card>

      {/* Task List */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3">Assigned Micro-Tasks</h3>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                task.status === 'completed'
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : task.status === 'in_progress'
                  ? 'border-indigo-200 bg-white shadow-2xs'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleTaskStatus(task.id)}
                  className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                    task.status === 'completed'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 hover:border-indigo-500'
                  }`}
                  aria-label="Toggle task status"
                >
                  {task.status === 'completed' && <CheckCircle2 className="h-4 w-4" />}
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-bold ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {task.title}
                    </h4>
                    <Badge variant={task.priority === 'High' ? 'rose' : 'amber'} size="sm">
                      {task.priority} Priority
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Deliverable: <strong className="text-slate-700">{task.deliverable}</strong>
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span>Est: {task.estTime}</span>
                    <span>•</span>
                    <a
                      href={task.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline flex items-center gap-0.5"
                    >
                      {task.resource} <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={() => toggleTaskStatus(task.id)}
                  variant={task.status === 'completed' ? 'outline' : 'primary'}
                  size="sm"
                >
                  {task.status === 'completed' ? 'Mark In Progress' : 'Complete & Verify'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
