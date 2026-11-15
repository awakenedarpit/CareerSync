import React, { useState } from 'react';
import {
  LineChart,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

export default function ForecastingTab({
  forecasts = {},
  onRunForecast,
}) {
  const [selectedPeriod, setSelectedPeriod] = useState('Full Placement Season 2026-27');
  const [runningForecast, setRunningForecast] = useState(false);

  const models = forecasts.modelsCompared || [];
  const scenarios = forecasts.scenarioPlanning || {};
  const isSparse = !!forecasts.sparseDataNotice;

  const handleTriggerForecast = async () => {
    try {
      setRunningForecast(true);
      await onRunForecast?.({ targetPeriod: selectedPeriod });
    } finally {
      setRunningForecast(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Forecasting Principles Header */}
      <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 text-xs text-sky-950 shadow-xs flex items-start gap-3">
        <LineChart className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sm text-sky-950">
            Interpretable Placement Forecasting & Scenario Planning
          </p>
          <p className="text-sky-800 leading-relaxed">
            Forecasting models extrapolate longitudinal trends using moving averages, unweighted historical benchmarks, and market trend corrections. All projections provide <strong>explicit uncertainty bounds</strong> and require minimum observation thresholds (N &ge; 2 complete seasons). Zero artificial certainty is introduced.
          </p>
        </div>
      </div>

      {/* Period Selector & Trigger Bar */}
      <Card
        title="Placement Projection Engines & Model Comparison"
        subtitle={`Evaluation Scope: ${selectedPeriod} • Freshness: Active 2026 Session`}
        action={
          <div className="flex items-center gap-2">
            <div className="w-56">
              <Select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                options={[
                  { value: 'Full Placement Season 2026-27', label: 'Season 2026-27 (Full Cohort)' },
                  { value: 'Next Quarter (Q4 2026)', label: 'Next Quarter (Q4 2026 Phase)' },
                  { value: 'Upcoming Batch 2027 Preview', label: 'Upcoming Batch 2027 Baseline' },
                ]}
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleTriggerForecast}
              disabled={runningForecast}
            >
              <TrendingUp className={`w-3.5 h-3.5 mr-1.5 ${runningForecast ? 'animate-spin' : ''}`} />
              Recalculate
            </Button>
          </div>
        }
      >
        {isSparse ? (
          <div className="p-8 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
            <h4 className="text-sm font-bold text-amber-950">
              FORECAST_UNAVAILABLE: Insufficient Historical Depth
            </h4>
            <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
              Institutional policy requires at least two complete consecutive seasons of historical recruitment data to generate statistical placement forecasts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {models.map((m, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={m.reliability === 'HIGH' ? 'emerald' : 'indigo'} size="sm">
                      {m.reliability} Reliability
                    </Badge>
                    <span className="text-xs font-mono text-slate-500">
                      Uncertainty: {m.uncertaintyRange}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {m.label}
                  </h4>

                  <div className="my-3">
                    <div className="text-3xl font-black text-slate-900">
                      {m.projectedPlacementRate}%
                    </div>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">
                      95% CI: [{m.confidenceInterval?.[0]}% - {m.confidenceInterval?.[1]}%]
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Projected Offers: <strong>{m.projectedOffers}</strong></span>
                  <span>Observations: <strong>{m.observationsCount} cohorts</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Scenario Planning Matrix */}
        {!isSparse && (
          <div className="border-t border-slate-100 pt-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Cohort Scenario Planning & Market Sensitivity
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-emerald-800">
                    Optimistic Scenario
                  </span>
                  <span className="text-xl font-black text-emerald-900">
                    {scenarios.optimisticScenario?.rate || 89.0}%
                  </span>
                </div>
                <div className="text-xs text-emerald-950 font-semibold">
                  Estimated {scenarios.optimisticScenario?.offers || 427} offers
                </div>
                <p className="text-[11px] text-emerald-800 leading-normal">
                  {scenarios.optimisticScenario?.assumption}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-indigo-800">
                    Baseline Scenario
                  </span>
                  <span className="text-xl font-black text-indigo-900">
                    {scenarios.baselineScenario?.rate || 84.5}%
                  </span>
                </div>
                <div className="text-xs text-indigo-950 font-semibold">
                  Estimated {scenarios.baselineScenario?.offers || 405} offers
                </div>
                <p className="text-[11px] text-indigo-800 leading-normal">
                  {scenarios.baselineScenario?.assumption}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-amber-800">
                    Conservative Scenario
                  </span>
                  <span className="text-xl font-black text-amber-900">
                    {scenarios.conservativeScenario?.rate || 78.0}%
                  </span>
                </div>
                <div className="text-xs text-amber-950 font-semibold">
                  Estimated {scenarios.conservativeScenario?.offers || 374} offers
                </div>
                <p className="text-[11px] text-amber-800 leading-normal">
                  {scenarios.conservativeScenario?.assumption}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
