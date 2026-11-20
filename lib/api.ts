export const API_URL = process.env.API_URL;
if (!API_URL) throw new Error("API_URL is not set: create .env.local");

export async function getJson<T>(path: string): Promise<T> {
  // no-store: a personal screen must not be built in advance or cached
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
