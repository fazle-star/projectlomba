export interface WellbeingSummaryBody {
  logs?: Array<{
    screenOffTime?: string;
    energyScore?: number;
    moodScore?: number;
    morningFocusScore?: number;
    sunsetCompleted?: boolean;
  }>;
  impulseHours?: number[];
}

export interface ApiRequestLike {
  method?: string;
  body?: unknown;
}

export interface ApiResponseLike {
  status: (code: number) => ApiResponseLike;
  json: (payload: unknown) => void;
}

function parseMinutes(timeStr?: string): number | null {
  if (typeof timeStr !== 'string' || !/^\d{2}:\d{2}$/.test(timeStr)) return null;
  const [hStr, mStr] = timeStr.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h > 23 || m > 59) return null;
  return h < 6 ? (h + 24) * 60 + m : h * 60 + m;
}

export default function handler(req: ApiRequestLike, res: ApiResponseLike): void {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as WellbeingSummaryBody;
  const logs = Array.isArray(body.logs) ? body.logs.slice(0, 60) : [];
  const impulseHours = Array.isArray(body.impulseHours)
    ? body.impulseHours.filter((h): h is number => typeof h === 'number' && h >= 0 && h <= 23).slice(0, 200)
    : [];

  let earlyTotal = 0;
  let earlyCount = 0;
  let lateTotal = 0;
  let lateCount = 0;
  let sunsetCompletedCount = 0;

  for (const item of logs) {
    if (item.sunsetCompleted) sunsetCompletedCount += 1;
    const mins = parseMinutes(item.screenOffTime);
    const focus = typeof item.morningFocusScore === 'number' ? item.morningFocusScore : item.energyScore;
    if (mins !== null && typeof focus === 'number' && focus >= 1 && focus <= 5) {
      if (mins <= 21 * 60 + 45) {
        earlyTotal += focus;
        earlyCount += 1;
      } else {
        lateTotal += focus;
        lateCount += 1;
      }
    }
  }

  const buckets = { pagi: 0, siang: 0, sore: 0, malam: 0 };
  for (const h of impulseHours) {
    if (h >= 6 && h < 11) buckets.pagi += 1;
    else if (h >= 11 && h < 15) buckets.siang += 1;
    else if (h >= 15 && h < 19) buckets.sore += 1;
    else buckets.malam += 1;
  }

  res.status(200).json({
    ok: true,
    earlyAvgFocus: earlyCount > 0 ? Number((earlyTotal / earlyCount).toFixed(2)) : null,
    lateAvgFocus: lateCount > 0 ? Number((lateTotal / lateCount).toFixed(2)) : null,
    sunsetCompletedCount,
    impulseBuckets: buckets,
  });
}
