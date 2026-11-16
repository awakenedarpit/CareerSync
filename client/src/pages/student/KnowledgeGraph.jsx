import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import {
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
  Layers,
  Award,
  Sparkles,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';

export default function KnowledgeGraph() {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [currentLayout, setCurrentLayout] = useState('cose');

  const graphElements = [
    // Center Student
    { data: { id: 'student', label: 'Priya Sharma\n(Student)', type: 'student', color: '#4F46E5', details: 'B.Tech CS 2025 • CGPA: 8.42' } },

    // Career Goal & Target Roles
    { data: { id: 'goal_fs', label: 'Target Role:\nFull Stack Dev', type: 'goal', color: '#7C3AED', details: 'Primary Career Track • 78% Match' } },
    { data: { id: 'job_google', label: 'Google SWE\n(Tier-1)', type: 'job', color: '#2563EB', details: 'Drive on Nov 28 • Package: 24.5 LPA' } },
    { data: { id: 'job_tcs', label: 'TCS Digital\n(Selected)', type: 'job', color: '#16A34A', details: 'Offer Letter Verified' } },

    // Verified Skills (Green)
    { data: { id: 'skill_js', label: 'JavaScript\n[Verified]', type: 'skill', status: 'verified', color: '#16A34A', details: 'Advanced • Verified via 5 Repos & Exam' } },
    { data: { id: 'skill_sql', label: 'PostgreSQL\n[Verified]', type: 'skill', status: 'verified', color: '#16A34A', details: 'Advanced • Verified in DBMS Lab' } },

    // Evidence-linked Skills (Indigo)
    { data: { id: 'skill_react', label: 'React.js\n[Evidence-linked]', type: 'skill', status: 'evidence_linked', color: '#4F46E5', details: 'Intermediate • devcollab project linked' } },
    { data: { id: 'skill_ts', label: 'TypeScript\n[Evidence-linked]', type: 'skill', status: 'evidence_linked', color: '#4F46E5', details: 'Intermediate • GitHub repo linked' } },

    // Observed Skills (Blue)
    { data: { id: 'skill_node', label: 'Node.js\n[Observed]', type: 'skill', status: 'observed', color: '#0284C7', details: 'Lab Assignment 3 Activity' } },

    // Claimed Skills (Grey)
    { data: { id: 'skill_docker', label: 'Docker\n[Claimed]', type: 'skill', status: 'claimed', color: '#64748B', details: 'Self-declared • No code proof attached' } },

    // Expired Skills (Orange)
    { data: { id: 'skill_ml', label: 'ML 101\n[Expired]', type: 'skill', status: 'expired', color: '#EA580C', details: 'No active code in >18 months' } },

    // Evidence Projects
    { data: { id: 'proj_event', label: 'Project:\nevent-engine', type: 'project', color: '#0D9488', details: 'Distributed ticket booking engine' } },
    { data: { id: 'proj_collab', label: 'Project:\ndevcollab', type: 'project', color: '#0D9488', details: 'Real-time collaborative code editor' } },

    // Certifications
    { data: { id: 'cert_aws', label: 'Cert: AWS Cloud\nPractitioner', type: 'certificate', color: '#D97706', details: 'Verified Credential • Aug 2024' } },

    // Skill Gap & Learning Task
    { data: { id: 'gap_docker', label: 'Skill Gap:\nContainerization', type: 'gap', color: '#E11D48', details: 'Critical Gap for Tier-1 Google & Amazon drives' } },
    { data: { id: 'task_compose', label: 'Task: Docker\nCompose Setup', type: 'task', color: '#9333EA', details: 'Micro-task • Estimated 3.5 hrs' } },

    // Edges
    { data: { id: 'e1', source: 'student', target: 'goal_fs', label: 'PURSUES' } },
    { data: { id: 'e2', source: 'goal_fs', target: 'job_google', label: 'TARGETS' } },
    { data: { id: 'e3', source: 'goal_fs', target: 'job_tcs', label: 'TARGETS' } },
    { data: { id: 'e4', source: 'student', target: 'skill_js', label: 'HAS_SKILL' } },
    { data: { id: 'e5', source: 'student', target: 'skill_sql', label: 'HAS_SKILL' } },
    { data: { id: 'e6', source: 'student', target: 'skill_react', label: 'HAS_SKILL' } },
    { data: { id: 'e7', source: 'student', target: 'skill_ts', label: 'HAS_SKILL' } },
    { data: { id: 'e8', source: 'student', target: 'skill_node', label: 'HAS_SKILL' } },
    { data: { id: 'e9', source: 'student', target: 'skill_docker', label: 'HAS_SKILL' } },
    { data: { id: 'e10', source: 'student', target: 'skill_ml', label: 'HAS_SKILL' } },
    { data: { id: 'e11', source: 'skill_js', target: 'proj_event', label: 'PROVEN_BY' } },
    { data: { id: 'e12', source: 'skill_sql', target: 'proj_event', label: 'PROVEN_BY' } },
    { data: { id: 'e13', source: 'skill_react', target: 'proj_collab', label: 'PROVEN_BY' } },
    { data: { id: 'e14', source: 'skill_ts', target: 'proj_collab', label: 'PROVEN_BY' } },
    { data: { id: 'e15', source: 'student', target: 'cert_aws', label: 'ACCREDITED' } },
    { data: { id: 'e16', source: 'goal_fs', target: 'gap_docker', label: 'IDENTIFIES' } },
    { data: { id: 'e17', source: 'gap_docker', target: 'task_compose', label: 'RESOLVED_BY' } },
    { data: { id: 'e18', source: 'task_compose', target: 'skill_docker', label: 'UPGRADES' } },
  ];

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: graphElements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'background-color': 'data(color)',
            'color': '#1E293B',
            'font-size': '11px',
            'font-family': 'Inter, system-ui, sans-serif',
            'font-weight': 600,
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'width': 80,
            'height': 80,
            'border-width': 2,
            'border-color': '#FFFFFF',
            'border-opacity': 0.8,
            'text-outline-width': 2,
            'text-outline-color': '#FFFFFF',
            'shadow-blur': 8,
            'shadow-color': 'rgba(0,0,0,0.08)',
            'transition-property': 'background-color, line-color, target-arrow-color, width, height',
            'transition-duration': '0.2s'
          }
        },
        {
          selector: 'node[type = "student"]',
          style: {
            'width': 105,
            'height': 105,
            'font-size': '12px',
            'font-weight': 700,
            'border-width': 4,
            'border-color': '#818CF8'
          }
        },
        {
          selector: 'node[type = "gap"]',
          style: {
            'shape': 'diamond',
            'width': 85,
            'height': 85
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#CBD5E1',
            'target-arrow-color': '#94A3B8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '8px',
            'font-weight': 600,
            'color': '#64748B',
            'text-rotation': 'autorotate',
            'text-background-opacity': 0.9,
            'text-background-color': '#FFFFFF',
            'text-background-padding': 2,
            'text-background-shape': 'roundrectangle'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#4338CA',
            'shadow-blur': 16,
            'shadow-color': 'rgba(79, 70, 229, 0.4)'
          }
        }
      ],
      layout: {
        name: currentLayout,
        animate: true,
        padding: 50,
        nodeOverlap: 20
      }
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      setSelectedNode(node.data());
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [currentLayout]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit();
  const handleReset = () => {
    cyRef.current?.reset();
    cyRef.current?.fit();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Knowledge Graph"
        subtitle="Graph-memory representation connecting students, verified evidence, skill gaps, and job roles."
        breadcrumbs={[{ label: 'Student', href: '/student' }, { label: 'Knowledge Graph' }]}
        action={
          <div className="flex gap-2">
            <select
              value={currentLayout}
              onChange={(e) => setCurrentLayout(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700"
            >
              <option value="cose">Force Directed (CoSE)</option>
              <option value="circle">Circle Layout</option>
              <option value="concentric">Concentric Layout</option>
              <option value="breadthfirst">Hierarchical</option>
            </select>
            <Button onClick={handleFit} variant="outline" size="sm">
              <Maximize2 className="h-4 w-4 mr-1" /> Fit View
            </Button>
          </div>
        }
      />

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 text-xs">
        <span className="font-semibold text-slate-700 mr-2 flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-[#009669]" />
          Node Types:
        </span>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#02E8A7]" /><span>Student</span></div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /><span>Verified Skill</span></div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#BDF9F9]/300" /><span>Evidence-linked</span></div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" /><span>Observed</span></div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-500" /><span>Claimed</span></div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-600" /><span>Expired</span></div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-600" /><span>Skill Gap</span></div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-teal-600" /><span>Project Repo</span></div>
      </div>

      {/* Interactive Graph Canvas + Details Drawer */}
      <div className="relative rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs h-[600px] flex">
        {/* Cytoscape DOM container */}
        <div ref={containerRef} className="flex-1 h-full w-full bg-radial from-slate-50 to-slate-100/50" />

        {/* Floating Zoom Controls */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 shadow-md z-10">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            title="Reset View"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="w-80 border-l border-slate-200 bg-white/95 p-5 backdrop-blur-xs flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-start justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Node Inspector
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 mb-4">
                <span className="text-[10px] font-semibold text-[#009669] uppercase">
                  {selectedNode.type}
                </span>
                <h3 className="text-base font-bold text-slate-900 whitespace-pre-line mt-0.5">
                  {selectedNode.label}
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Metadata Details</span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed">{selectedNode.details}</p>
                </div>

                {selectedNode.status && (
                  <div>
                    <span className="text-slate-400 block font-medium mb-1">Skill Verification Status</span>
                    <StatusBadge status={selectedNode.status} />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
              Graph Entity ID: <code className="font-mono text-slate-600">{selectedNode.id}</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
