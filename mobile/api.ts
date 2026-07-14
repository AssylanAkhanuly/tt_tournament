// The one thing the mobile app shares with the web app: the shape of the API.
//
// This is DUPLICATED from front/lib/{api,types}.ts on purpose, for now. Sharing it means
// npm workspaces + a Metro monorepo config (watchFolders / nodeModulesPaths), which is a
// well-known source of baffling bundler errors. Not worth paying for one screen. Promote to
// a shared packages/api the moment the duplication actually costs something.

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://back-production-d8c8.up.railway.app";

export type Tournament = {
  id: string;
  name: string;
  description: string;
  status: string;
  participant_count: number;
  created_at: string;
  starts_at: string | null;
};

export async function getTournaments(): Promise<Tournament[]> {
  const res = await fetch(`${API_URL}/api/tournaments/`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data = await res.json();
  // DRF is configured unpaginated here, but tolerate either shape rather than crash.
  return Array.isArray(data) ? data : (data.results ?? []);
}
