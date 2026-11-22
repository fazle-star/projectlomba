export interface ApiRequestLike {
  method?: string;
}

export interface ApiResponseLike {
  status: (code: number) => ApiResponseLike;
  json: (payload: unknown) => void;
}

export default function handler(_req: ApiRequestLike, res: ApiResponseLike): void {
  res.status(200).json({
    ok: true,
    service: 'selaras-wellbeing-api',
    timestamp: new Date().toISOString(),
  });
}
