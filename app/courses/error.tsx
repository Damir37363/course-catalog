"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="p-6">
      <h1 className="mb-2 text-2xl font-bold font-heading">Something went wrong</h1>
      <p className="mb-4 text-muted-foreground">
        Could not load the data. The backend may not be running.
      </p>
      <Button variant="outline" onClick={() => retry()}>
        Try again
      </Button>
    </main>
  );
}
