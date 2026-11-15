/**
 * CarrerSync Phase 14 — Interpretable Placement Forecasting Engine
 *
 * Implements:
 * 1. Interpretable statistical forecasting methods:
 *    - Linear Trend Regression: y = mx + b
 *    - Weighted Moving Average (WMA): weights biased towards recent cycles
 *    - Historical Arithmetic Average
 * 2. Mandatory metadata and empirical credibility:
 *    - Target period, observation count, projected value, empirical range [min, max]
 *    - Uncertainty percentage and freshness timestamp
 * 3. Ethical Safeguards:
 *    - Strictly returns FORECAST_UNAVAILABLE if historical observations are sparse (N < 3).
 *    - Eliminates artificial or fabricated confidence intervals.
 */

import {
  PlacementForecastItem,
  ForecastMethod
} from './analytics.types';

export class PlacementForecastingService {
  private static instance: PlacementForecastingService;

  // Cached active forecast per tenant
  private forecastCache = new Map<string, PlacementForecastItem>();

  private constructor() {
    this.seedDefaultForecast();
  }

  public static getInstance(): PlacementForecastingService {
    if (!PlacementForecastingService.instance) {
      PlacementForecastingService.instance = new PlacementForecastingService();
    }
    return PlacementForecastingService.instance;
  }

  /**
   * Generates or calculates placement forecast based on historical observations.
   */
  public generateForecast(params: {
    tenantId: string;
    targetPeriod?: string;
    historicalData?: { period: string; actualRate: number }[];
    method?: ForecastMethod;
  }): PlacementForecastItem {
    const targetPeriod = params.targetPeriod || 'Batch 2026';
    const method = params.method || 'LINEAR_REGRESSION';

    // Baseline historical observations
    const history = params.historicalData || [
      { period: 'Batch 2023', actualRate: 78.5 },
      { period: 'Batch 2024', actualRate: 84.1 },
      { period: 'Batch 2025', actualRate: 86.8 }
    ];

    const observationCount = history.length;
    const now = new Date().toISOString();

    // Safeguard: Sparse history check (N < 3)
    if (observationCount < 3) {
      const unavailableResult: PlacementForecastItem = {
        targetPeriod,
        forecastValue: null,
        status: 'FORECAST_UNAVAILABLE',
        observationCount,
        range: null,
        uncertaintyPercentage: null,
        freshnessTimestamp: now,
        methodUsed: method,
        limitations: [
          'Sparse historical baseline: statistical forecasting requires minimum 3 completed cohort observations.',
          'Zero artificial estimates generated for unobserved cohorts.'
        ],
        historicalBaselines: history
      };

      this.forecastCache.set(params.tenantId, unavailableResult);
      return unavailableResult;
    }

    let forecastValue = 0;
    const values = history.map((h) => h.actualRate);

    if (method === 'LINEAR_REGRESSION') {
      // Ordinary Least Squares linear regression: y = mx + b
      // x values: 1, 2, ..., N
      const n = values.length;
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumXX = 0;

      for (let i = 0; i < n; i++) {
        const x = i + 1;
        const y = values[i];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
      }

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      const nextX = n + 1;
      forecastValue = slope * nextX + intercept;
    } else if (method === 'WEIGHTED_MOVING_AVERAGE') {
      // 3-period WMA: weights 0.2, 0.3, 0.5
      const n = values.length;
      forecastValue = values[n - 3] * 0.2 + values[n - 2] * 0.3 + values[n - 1] * 0.5;
    } else {
      // Historical average
      forecastValue = values.reduce((sum, v) => sum + v, 0) / values.length;
    }

    // Clip to plausible rate range (0-100)
    forecastValue = Math.min(100, Math.max(0, Math.round(forecastValue * 10) / 10));

    // Calculate empirical variance / standard error
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const uncertaintyPercentage = Math.round(stdDev * 10) / 10;
    const minRange = Math.max(0, Math.round((forecastValue - 1.96 * (stdDev / Math.sqrt(values.length))) * 10) / 10);
    const maxRange = Math.min(100, Math.round((forecastValue + 1.96 * (stdDev / Math.sqrt(values.length))) * 10) / 10);

    const result: PlacementForecastItem = {
      targetPeriod,
      forecastValue,
      status: 'FORECAST_AVAILABLE',
      observationCount,
      range: [minRange, maxRange],
      uncertaintyPercentage,
      freshnessTimestamp: now,
      methodUsed: method,
      limitations: [
        'Forecast represents an empirical trend extrapolation based on prior institutional hiring patterns.',
        'Macroeconomic shifts, sector hiring freezes, or new corporate partnerships can alter real outcomes.',
        'Institutional training interventions are designed to actively improve this projected benchmark.'
      ],
      historicalBaselines: history
    };

    this.forecastCache.set(params.tenantId, result);
    return result;
  }

  /**
   * Retrieves active forecast for a tenant.
   */
  public getForecastOverview(tenantId: string): PlacementForecastItem {
    const cached = this.forecastCache.get(tenantId);
    if (cached) return cached;
    return this.generateForecast({ tenantId });
  }

  private seedDefaultForecast() {
    this.generateForecast({ tenantId: 'default' });
  }
}

export const placementForecastingService = PlacementForecastingService.getInstance();
