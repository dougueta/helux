// Global test setup: provide env vars required by healthSyncRoutes at plugin registration time.
// Tests that exercise the health-sync route directly should override these via vi.mock / mockReturnValue.
process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? 'test-anon-key';
