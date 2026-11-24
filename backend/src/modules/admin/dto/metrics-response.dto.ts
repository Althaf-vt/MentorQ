export interface GlobalMetricsResponseDto {
  students: { total: number; suspended: number; active: number };
  mentors: { total: number; suspended: number; active: number };
  sessions: { total: number };
  tickets: { pending: number };
}
