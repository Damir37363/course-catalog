export type Course = {
  id: string;
  title: string;
  description: string;
  credits: number;
  isElective: boolean;
  likes: number;
};

export type Enrollment = {
  id: number;
  courseId: string;
  studentName: string;
};

const API_URL = process.env.API_URL;
if (!API_URL) throw new Error("API_URL is not set: create .env.local");

export async function getCourses(): Promise<Course[]> {
  // no-store: request fresh data on every visit (otherwise the page may be
  // built in advance and the data would "freeze")
  const res = await fetch(`${API_URL}/courses`, { cache: "no-store" });
  // fetch does not throw on 404/500 — check res.ok by hand
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getCourse(id: string): Promise<Course | undefined> {
  const res = await fetch(`${API_URL}/courses/${id}`, { cache: "no-store" });
  // 404 is not an error here, it means "no such course"
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
