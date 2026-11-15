/**
 * CarrerSync Predictive Placement Analytics Dashboard
 * Phase 14 TPO & Admin Placement Intelligence Suite
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  HeartHandshake,
  Building2,
  CheckCircle2,
  TrendingUp,
  LineChart,
  ShieldCheck,
  FileSpreadsheet,
  RotateCw
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';

// Modular Tab Components
import OverviewReadinessTab from './predictive/OverviewReadinessTab';
import PlacementPredictionsTab from './predictive/PlacementPredictionsTab';
import StudentSupportTab from './predictive/StudentSupportTab';
import CohortDepartmentTab from './predictive/CohortDepartmentTab';
import MockDriveIntelligenceTab from './predictive/MockDriveIntelligenceTab';
import PlacementTrendsTab from './predictive/PlacementTrendsTab';
import ForecastingTab from './predictive/ForecastingTab';
import FairnessBiasTab from './predictive/FairnessBiasTab';
import InterventionsReportingTab from './predictive/InterventionsReportingTab';

// Service Integration
import predictiveAnalyticsService from '../../services/predictiveAnalyticsService';

export default function PredictiveAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pipelineRunning, setPipelineRunning] = useState(false);

  // Core Data States
  const [overview, setOverview] = useState(null);
  const [readinessList, setReadinessList] = useState([]);
  const [predictionsData, setPredictionsData] = useState({ predictions: [], validation: {} });
  const [supportRecs, setSupportRecs] = useState([]);
  const [batchAnalytics, setBatchAnalytics] = useState([]);
  const [departmentAnalytics, setDepartmentAnalytics] = useState([]);
  const [mockData, setMockData] = useState({});
  const [skillImprovement, setSkillImprovement] = useState({});
  const [trendsData, setTrendsData] = useState({});
  const [recruiterData, setRecruiterData] = useState({});
  const [forecasts, setForecasts] = useState({});
  const [fairnessData, setFairnessData] = useState({});
  const [interventions, setInterventions] = useState([]);
  const [reports, setReports] = useState([]);

  // Fetch all Phase 14 predictive analytics datasets
  const fetchAllData = async () => {
    try {
      const [
        ovRes,
        readinessRes,
        predsRes,
        supportRes,
        batchesRes,
        deptsRes,
        mocksRes,
        skillsRes,
        trendsRes,
        recruitersRes,
        forecastsRes,
        fairnessRes,
        interventionsRes,
        reportsRes,
      ] = await Promise.all([
        predictiveAnalyticsService.getPredictiveOverview(),
        predictiveAnalyticsService.getReadinessList(),
        predictiveAnalyticsService.getPredictions(),
        predictiveAnalyticsService.getStudentSupportRecommendations(),
        predictiveAnalyticsService.getBatchAnalytics(),
        predictiveAnalyticsService.getDepartmentAnalytics(),
        predictiveAnalyticsService.getMockDriveIntelligence(),
        predictiveAnalyticsService.getSkillImprovementTracking(),
        predictiveAnalyticsService.getPlacementTrends(),
        predictiveAnalyticsService.getRecruiterEngagement(),
        predictiveAnalyticsService.getPlacementForecasts(),
        predictiveAnalyticsService.getFairnessMonitoring(),
        predictiveAnalyticsService.getInterventions(),
        predictiveAnalyticsService.getPlacementReports(),
      ]);

      setOverview(ovRes);
      setReadinessList(readinessRes);
      setPredictionsData(predsRes);
      setSupportRecs(supportRes);
      setBatchAnalytics(batchesRes);
      setDepartmentAnalytics(deptsRes);
      setMockData(mocksRes);
      setSkillImprovement(skillsRes);
      setTrendsData(trendsRes);
      setRecruiterData(recruitersRes);
      setForecasts(forecastsRes);
      setFairnessData(fairnessRes);
      setInterventions(interventionsRes);
      setReports(reportsRes);
    } catch (err) {
      console.error('Failed to load predictive analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  // Pipeline Execution Action
  const handleRunPipeline = async (params) => {
    try {
      setPipelineRunning(true);
      await predictiveAnalyticsService.runPredictionPipeline(params);
      // Refresh predictions
      const updated = await predictiveAnalyticsService.getPredictions();
      setPredictionsData(updated);
    } finally {
      setPipelineRunning(false);
    }
  };

  // Review Student Support Action
  const handleReviewSupport = async (id, payload) => {
    await predictiveAnalyticsService.reviewStudentSupport(id, payload);
    setSupportRecs((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: payload.status,
              assignedMentor: payload.assignedMentor || item.assignedMentor,
              reviewNotes: payload.reviewNotes || item.reviewNotes,
            }
          : item
      )
    );
  };

  // Create Institutional Intervention Action
  const handleCreateIntervention = async (payload) => {
    const created = await predictiveAnalyticsService.createIntervention(payload);
    setInterventions((prev) => [created, ...prev]);
  };

  // Update Intervention Status Action
  const handleUpdateInterventionStatus = async (id, payload) => {
    await predictiveAnalyticsService.updateInterventionStatus(id, payload);
    setInterventions((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: payload.status,
              reviewNotes: payload.reviewNotes || item.reviewNotes,
            }
          : item
      )
    );
  };

  // Run Forecast Action
  const handleRunForecast = async (payload) => {
    const res = await predictiveAnalyticsService.runPlacementForecast(payload);
    if (res.results) {
      setForecasts(res.results);
    }
  };

  // Generate Report Action
  const handleGenerateReport = async (payload) => {
    const rep = await predictiveAnalyticsService.generatePlacementReport(payload);
    setReports((prev) => [rep, ...prev]);
  };

  const tabsConfig = [
    { id: 'overview', label: 'Overview & Readiness', icon: LayoutDashboard },
    { id: 'predictions', label: 'Outcome Predictions', icon: Sparkles },
    { id: 'support', label: 'Support Recommendations', icon: HeartHandshake, count: supportRecs.filter(r => r.status === 'IDENTIFIED' || r.status === 'UNDER_TPO_REVIEW').length || undefined },
    { id: 'cohorts', label: 'Cohort & Departments', icon: Building2 },
    { id: 'mocks', label: 'Mock Intelligence', icon: CheckCircle2 },
    { id: 'trends', label: 'Trends & Recruiters', icon: TrendingUp },
    { id: 'forecasting', label: 'Placement Forecasting', icon: LineChart },
    { id: 'fairness', label: 'Fairness & Bias Audit', icon: ShieldCheck },
    { id: 'interventions', label: 'Interventions & Reports', icon: FileSpreadsheet, count: interventions.length || undefined },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Predictive Placement Analytics & Cohort Intelligence"
        subtitle="Institutional statistical modeling, multi-tier readiness diagnostics, fairness auditing, and proactive intervention management."
        breadcrumbs={[
          { label: 'TPO Portal', href: '/tpo' },
          { label: 'Predictive Analytics' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
            >
              <RotateCw className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Analytics
            </Button>
          </div>
        }
      />

      {/* Navigation Tabs Bar */}
      <div className="overflow-x-auto pb-1">
        <Tabs
          tabs={tabsConfig}
          activeTab={activeTab}
          onChange={setActiveTab}
          size="md"
        />
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          <div className="inline-flex items-center gap-2">
            <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading Predictive Placement Analytics...</span>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <OverviewReadinessTab
              overview={overview}
              readinessList={readinessList}
              loading={loading}
            />
          )}

          {activeTab === 'predictions' && (
            <PlacementPredictionsTab
              predictionsData={predictionsData}
              onRunPipeline={handleRunPipeline}
              pipelineRunning={pipelineRunning}
            />
          )}

          {activeTab === 'support' && (
            <StudentSupportTab
              recommendations={supportRecs}
              onReviewSupport={handleReviewSupport}
            />
          )}

          {activeTab === 'cohorts' && (
            <CohortDepartmentTab
              batchAnalytics={batchAnalytics}
              departmentAnalytics={departmentAnalytics}
            />
          )}

          {activeTab === 'mocks' && (
            <MockDriveIntelligenceTab
              mockData={mockData}
              skillImprovement={skillImprovement}
            />
          )}

          {activeTab === 'trends' && (
            <PlacementTrendsTab
              trendsData={trendsData}
              recruiterData={recruiterData}
            />
          )}

          {activeTab === 'forecasting' && (
            <ForecastingTab
              forecasts={forecasts}
              onRunForecast={handleRunForecast}
            />
          )}

          {activeTab === 'fairness' && (
            <FairnessBiasTab
              fairnessData={fairnessData}
            />
          )}

          {activeTab === 'interventions' && (
            <InterventionsReportingTab
              interventions={interventions}
              reports={reports}
              onCreateIntervention={handleCreateIntervention}
              onUpdateInterventionStatus={handleUpdateInterventionStatus}
              onGenerateReport={handleGenerateReport}
            />
          )}
        </>
      )}
    </div>
  );
}
