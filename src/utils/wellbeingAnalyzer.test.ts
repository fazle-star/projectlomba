import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeImpulseBuckets,
  analyzeWellbeingCheckIn,
  computeScreenOffCorrelation,
  getFocusRecommendation,
  splitTaskIntoMicroSteps,
} from './wellbeingAnalyzer';
import type { ImpulseEvent, LocalWellbeingLog } from '../types/wellbeing';

test('analyzeWellbeingCheckIn maps sleep/physical fatigue and adjusts gentle focus', () => {
  const result = analyzeWellbeingCheckIn(['kurang_tidur', 'fisik_capek'], 'Semalam begadang mata lelah');
  assert.equal(result.conditionCategory, 'Kelelahan Fisik & Tidur');
  assert.ok(result.energyScore <= 2);
  assert.equal(result.focusRecommendation.modeName, 'Gentle Focus');
  assert.equal(result.focusRecommendation.defaultMinutes, 10);
});

test('analyzeWellbeingCheckIn maps balanced state to Deep Flow', () => {
  const result = analyzeWellbeingCheckIn(['pikiran_tenang'], 'Pagi ini terasa segar dan siap', 4, 5);
  assert.equal(result.conditionCategory, 'Kondisi Seimbang');
  assert.equal(result.energyScore, 4);
  assert.equal(result.moodScore, 5);
  assert.equal(result.focusRecommendation.modeName, 'Deep Flow');
  assert.equal(result.focusRecommendation.defaultMinutes, 25);
});

test('getFocusRecommendation returns Steady Focus for energy 3', () => {
  const rec = getFocusRecommendation(3);
  assert.equal(rec.modeName, 'Steady Focus');
  assert.equal(rec.defaultMinutes, 15);
});

test('splitTaskIntoMicroSteps generates 3-4 actionable 5-10 min steps for writing tasks', () => {
  const steps = splitTaskIntoMicroSteps('Menulis bab tinjauan pustaka');
  assert.ok(steps.length >= 3 && steps.length <= 4);
  assert.ok(steps.every((s) => s.minutes >= 5 && s.minutes <= 10));
  assert.ok(steps[0].label.toLowerCase().includes('kerangka'));
});

test('analyzeImpulseBuckets identifies peak distraction hour range and recommends sunset', () => {
  const events: ImpulseEvent[] = [
    { timestamp: '2026-11-20T09:10:00.000Z', hour: 9, context: 'focus' },
    { timestamp: '2026-11-20T20:10:00.000Z', hour: 20, context: 'sunset' },
    { timestamp: '2026-11-20T21:15:00.000Z', hour: 21, context: 'sunset' },
    { timestamp: '2026-11-20T22:40:00.000Z', hour: 22, context: 'sunset' },
  ];
  const summary = analyzeImpulseBuckets(events);
  assert.equal(summary.peakBucket.id, 'malam');
  assert.equal(summary.peakBucket.count, 3);
  assert.equal(summary.recommendedSunset, '21:00');
});

test('computeScreenOffCorrelation rewards earlier screen-off times', () => {
  const logs: LocalWellbeingLog[] = [
    { logDate: '2026-11-18', conditionCategory: 'Kondisi Seimbang', screenOffTime: '21:15', sunsetCompleted: true, energyScore: 4, moodScore: 4, morningFocusScore: 5 },
    { logDate: '2026-11-19', conditionCategory: 'Kelelahan Fisik & Tidur', screenOffTime: '23:30', sunsetCompleted: false, energyScore: 2, moodScore: 3, morningFocusScore: 2 },
  ];
  const summary = computeScreenOffCorrelation(logs, []);
  assert.ok(summary.avgFocusEarlyScreenOff > summary.avgFocusLateScreenOff);
});
