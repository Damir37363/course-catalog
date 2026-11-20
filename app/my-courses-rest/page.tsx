import { getJson } from "@/lib/api";

type Student = { id: number; name: string; email: string };
type Enrollment = { id: number; courseId: string };
type Course = { id: string; title: string; credits: number; level: string };

export default async function MyCoursesRestPage() {
  // round one: two independent requests go out in parallel
  const [student, enrollments] = await Promise.all([
    getJson<Student>("/students/2"),
    getJson<Enrollment[]>("/students/2/enrollments"),
  ]);
  // round two: the course codes are known only from the first round's answer
  const courses = await Promise.all(
    enrollments.map((e) => getJson<Course>(`/courses/${e.courseId}`)),
  );

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">My courses: {student.name}</h1>
      <ul className="mt-4 list-disc pl-6">
        {courses.map((c) => (
          <li key={c.id}>
            {c.title} — {c.credits} credits, level: {c.level}
          </li>
        ))}
      </ul>
    </main>
  );
}
