"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Course } from "@/lib/courses";

const API = process.env.NEXT_PUBLIC_API_URL;

type LikeButtonProps = {
  courseId: string;
  initialLikes: number;
};

export function LikeButton({ courseId, initialLikes }: LikeButtonProps) {
  const [likes, setLikes] = useState<number>(initialLikes);
  const [failed, setFailed] = useState(false);

  async function handleClick() {
    setFailed(false);
    try {
      const res = await fetch(`${API}/courses/${courseId}/like`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const course: Course = await res.json();
      // the server's number, not likes + 1
      setLikes(course.likes);
    } catch {
      setFailed(true);
    }
  }

  return (
    <div>
      <Button variant="outline" onClick={handleClick} className="w-fit">
        ❤ {likes}
      </Button>
      {failed && <p className="text-red-600">Failed to like the course</p>}
    </div>
  );
}
