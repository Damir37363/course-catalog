"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import type { Enrollment, Student } from "@/lib/courses";

const API = process.env.NEXT_PUBLIC_API_URL;

type EnrollFormProps = {
  courseId: string;
};

type Notice = { ok: boolean; text: string } | null;

// The API answers errors as { detail: "text" } (404, 409) or as
// { detail: [{ msg, ... }] } (422): turn both shapes into one line of text.
async function errorText(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) return body.detail[0].msg;
  } catch {
    // the body is not JSON: fall through to the status code
  }
  return `API error: ${res.status}`;
}

function NoticeLine({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return (
    <p role="status" className={notice.ok ? "" : "text-red-600"}>
      {notice.text}
    </p>
  );
}

const inputClass = "rounded-md border border-input bg-card px-3 py-2";

export function EnrollForm({ courseId }: EnrollFormProps) {
  // enrolling: the student number is the only thing the API needs
  const [studentId, setStudentId] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrollNotice, setEnrollNotice] = useState<Notice>(null);

  // registering: creates a student and fills in the number for us
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerNotice, setRegisterNotice] = useState<Notice>(null);

  async function handleEnroll(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^\d+$/.test(studentId.trim())) {
      setEnrollNotice({ ok: false, text: "Enter your student number (digits only)" });
      return;
    }
    setEnrolling(true);
    setEnrollNotice(null);
    try {
      const res = await fetch(`${API}/enrollments`, {
        method: "POST",
        // JSON body + this header make the request "non-simple" -> preflight
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, studentId: Number(studentId) }),
      });
      if (!res.ok) {
        setEnrollNotice({ ok: false, text: await errorText(res) });
        return;
      }
      const enrollment: Enrollment = await res.json();
      setEnrollNotice({
        ok: true,
        text: `You are enrolled. Enrollment number: ${enrollment.id}`,
      });
    } catch {
      setEnrollNotice({ ok: false, text: "Could not submit the enrollment" });
    } finally {
      setEnrolling(false);
    }
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRegistering(true);
    setRegisterNotice(null);
    try {
      const res = await fetch(`${API}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) {
        setRegisterNotice({ ok: false, text: await errorText(res) });
        return;
      }
      const student: Student = await res.json();
      setStudentId(String(student.id));
      setEnrollNotice(null); // an old message about the number no longer applies
      setRegisterNotice({
        ok: true,
        text: `Registered. Your student number is ${student.id}.`,
      });
    } catch {
      setRegisterNotice({ ok: false, text: "Could not register the student" });
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div className="flex max-w-sm flex-col gap-6">
      <form onSubmit={handleEnroll} className="flex flex-col gap-2">
        <label htmlFor="studentId">Your student number</label>
        <input
          id="studentId"
          inputMode="numeric"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className={inputClass}
        />
        <Button type="submit" disabled={enrolling}>
          Enroll
        </Button>
        <NoticeLine notice={enrollNotice} />
      </form>

      <form onSubmit={handleRegister} className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          No number yet? Register first, and it will be filled in above.
        </p>
        <label htmlFor="studentName">Name</label>
        <input
          id="studentName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <label htmlFor="studentEmail">Email</label>
        <input
          id="studentEmail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <Button type="submit" variant="outline" disabled={registering}>
          Register
        </Button>
        <NoticeLine notice={registerNotice} />
      </form>
    </div>
  );
}
