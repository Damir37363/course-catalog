import { notFound } from "next/navigation";
import { getCourse } from "@/lib/courses";
import LikeButton from "@/components/LikeButton";
import { Button } from "@/components/ui/button";
import { COURSERA_URLS } from "@/lib/coursera";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourse(id);

  if (!course) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <h1 className="text-3xl font-bold font-heading">{course.title}</h1>
      <p className="text-muted-foreground">{course.description}</p>
      <span className="text-sm text-muted-foreground">{course.credits} credits</span>
      <div className="flex flex-wrap items-center gap-3">
        <LikeButton initialLikes={course.likes} />
        {COURSERA_URLS[course.id] && (
          <Button asChild>
            <a
              href={COURSERA_URLS[course.id]}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Coursera ↗
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
