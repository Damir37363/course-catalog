# Course Catalog

Next.js frontend of the "Advanced Web Technologies" semester project. Since Lab 5 the courses come from the FastAPI backend (`course-catalog-api`) instead of a mock file, and the browser itself sends likes and enrollments to it.

## What's implemented

**Lab 1** — pages `/`, `/about`, `/courses`, `/courses/[id]` (`params` typed as a `Promise`), `loading.tsx`, `not-found.tsx`, a shared navigation in `app/layout.tsx`.

**Lab 3** — shadcn/ui (`components.json`, `lib/utils.ts`, `Button`, `Card`), `CourseCard` built from `Card`/`Button`, a responsive course grid, a brand color and the Sora heading font via `@theme` in `globals.css`.

**Lab 5**
- `lib/courses.ts`: `getCourses` / `getCourse` call the API (`cache: "no-store"`, manual `res.ok` check, `404` → `undefined`).
- `app/courses/error.tsx` (Client Component) with a "Try again" button that calls `retry`.
- `components/ElectiveFilter.tsx` + `app/filter/page.tsx`: the "Electives only" checkbox, SWR, requests sent by the browser.
- `components/LikeButton.tsx`: `POST /courses/{id}/like`, shows the number from the server's response.
- `components/EnrollForm.tsx`: `POST /enrollments` with a JSON body, shows the enrollment number or the server's `422` message.
- `lib/coursera.ts`: links to real Coursera courses (the backend does not store them).

## How to run

Start the **backend first**, then the frontend.

```bash
# terminal 1 — backend (see course-catalog-api/README.md)
cd course-catalog-api
source .venv/bin/activate        # Windows: .venv\Scripts\Activate.ps1
fastapi dev main.py

# terminal 2 — frontend
cd course-catalog
npm install
npm run dev
```

Open http://localhost:3000 (exactly this address: the backend allows only the `http://localhost:3000` origin).

## Environment variables

Create `.env.local` in the project root (next to `package.json`). The file is **not** in git (`.env*.local` is in `.gitignore`).

```text
API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

| Variable | Visible to | Used by |
| --- | --- | --- |
| `API_URL` | the Next.js server only (Server Components) | `getCourses`, `getCourse` in `lib/courses.ts` |
| `NEXT_PUBLIC_API_URL` | also the browser (it is written into the JS bundle at build time — never put secrets in it) | `ElectiveFilter`, `LikeButton`, `EnrollForm` |

Restart `npm run dev` after creating or changing the file.

## Decisions

**Why `generateStaticParams` was removed from the course page.** It calls `getCourses()` while `next build` runs, so the build needed a running backend: with the backend off it failed with `ECONNREFUSED` / `Failed to collect page data for /courses/[id]`. Besides, the list of courses now belongs to the backend and changes without rebuilding the frontend, while a page built in advance would show stale likes. After removing it the build passes without the backend and `/courses`, `/courses/[id]` are dynamic (`ƒ`). The Lab 1 criterion about `generateStaticParams` was met when the data was a mock function; it was removed deliberately when the data moved to the backend.

**Why the like gets by without a preflight and the enrollment does not.** A `POST` without a body and without custom headers is a "simple" request, so the browser just sends it and checks `access-control-allow-origin` in the response. The enrollment sends JSON (`Content-Type: application/json`), which is outside the "simple" kind, so the browser first asks the server with an `OPTIONS` preflight (`Access-Control-Request-Method`, `Access-Control-Request-Headers`) and sends the `POST` only after a positive answer; the permission is remembered for `access-control-max-age: 600` seconds.

## Breakage journal

Each breakage was introduced one at a time in `course-catalog-api/main.py`, then rolled back with `git restore main.py`. Algorithm (Lecture 5, section 7): 1) is there a row in Network? 2) status; 3) `access-control-allow-origin` in the response and its exact value; 4) is there an `OPTIONS` before the request and its status; 5) the FastAPI terminal.

### Breakage 1: CORS removed entirely

- What I did: commented out the whole block `app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["*"], allow_headers=["*"])`.
- Console: `Access to fetch at 'http://localhost:8000/courses' from origin 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.` followed by `Failed to load resource: net::ERR_FAILED` (the same on ❤; for the form: `... Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.`).
- Network: `courses` is red (CORS error; Chrome's reason: `MissingAllowOriginHeader`), but the backend log says `GET /courses 200 OK`; the page shows "Failed to load courses". ❤: the same CORS error, the number stays 21 and "Failed to like the course" appears, yet the log says `POST /courses/web-security/like 200 OK` — the like was counted on the server. Form: `OPTIONS /enrollments` → `405 Method Not Allowed`, the `POST` is never sent (no `POST /enrollments` in the backend log) and the form says "Could not submit the enrollment". The `/courses` page works (the Next.js server's `GET /courses 200 OK` is in the backend log).
- Cause: there is no `access-control-allow-origin` in any response because `CORSMiddleware` is not connected; the server still executes requests (the browser only hides the response), and requests made by Server Components are not affected by CORS at all.
- How I found it: step 3 (no `access-control-allow-origin` in Response Headers) and step 4 (`OPTIONS` got 405 — not 400 — which means CORS is not connected at all).

### Breakage 2: trailing slash in `allow_origins`

- What I did: `allow_origins=["http://localhost:3000"]` → `allow_origins=["http://localhost:3000/"]`.
- Console: the same as in breakage 1 on `/filter`; on the form `... Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
- Network: `courses` red, backend log `200 OK`; `OPTIONS /enrollments` → `400 Bad Request`, the `POST` is not sent. By hand: `curl -i -X OPTIONS ... -H "Origin: http://localhost:3000" ...` → `400`, body `Disallowed CORS origin`, no `access-control-allow-origin`.
- Cause: the value `http://localhost:3000/` (with a slash) is not equal to the page's origin `http://localhost:3000`, so permission is granted to nobody; an origin has no path.
- How I found it: step 4 (the preflight status is 400, not 405, so CORS is connected) and the preflight body `Disallowed CORS origin`; fixed by removing the slash.

### Breakage 3: `allow_methods` removed

- What I did: deleted the line `allow_methods=["*"],` (by default only `GET` is allowed).
- Console: `/filter` and ❤ work; on the form `... Response to preflight request doesn't pass access control check: It does not have HTTP ok status.`
- Network: `GET courses` and `POST like` are fine (200, both responses have `access-control-allow-origin: http://localhost:3000`; the like is a simple request, so no preflight). `OPTIONS /enrollments` → `400 Bad Request` (Chrome's reason: `PreflightInvalidStatus`), the `POST` is not sent. The preflight response has `access-control-allow-origin` and `access-control-allow-methods: GET`; the body (via curl) is `Disallowed CORS method`.
- Cause: the origin is allowed, but the method `POST` requested by the preflight is not in `allow_methods`.
- How I found it: step 4 (preflight 400) plus step 3 (the origin header is present and correct, so the problem is not the origin): the response header `access-control-allow-methods: GET` points to the methods.

### Breakage 4: the page is opened at `http://127.0.0.1:3000`

- What I did: `main.py` unchanged; opened `http://127.0.0.1:3000/filter` (and added `allowedDevOrigins: ["127.0.0.1"]` to `next.config.ts` for the experiment, removed afterwards).
- Console: `Access to fetch at 'http://localhost:8000/courses' from origin 'http://127.0.0.1:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
- Network: `courses` is red, the backend log says `GET /courses 200 OK`; the request carries `Origin: http://127.0.0.1:3000`, the response has no `access-control-allow-origin`. The preflight with this origin gets `400`, body `Disallowed CORS origin`. Without `allowedDevOrigins` the dev server page hangs on "Loading…" (Console: `WebSocket connection to 'ws://127.0.0.1:3000/_next/hmr?...' failed`) and no request to `localhost:8000` is sent at all — CORS only shows up after adding the line.
- Cause: to the browser `localhost` and `127.0.0.1` are different hosts, so they are different origins; only `http://localhost:3000` is in `allow_origins`.
- How I found it: step 3 — the console message names the origin `http://127.0.0.1:3000`, which is not the allowed one character for character. Fixed by opening the page at `http://localhost:3000` (or adding the second address to `allow_origins`).

### Breakage 5: a Python error that looks like CORS

- What I did: in `list_courses` replaced the first `p["offset"]` with `p["ofset"]` (`offset, limit = p["ofset"], p["limit"]`).
- Console: on `/filter` (which shows "Failed to load courses") the same message as in breakage 1: `Access to fetch at 'http://localhost:8000/courses' from origin 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`, although CORS is configured correctly.
- Network: `courses` is red; ❤ and the form work as before (their routes are untouched: `POST like` → 200, `OPTIONS /enrollments` → 200). The `/courses` page shows `error.tsx`, because the Next.js server got an error from the backend: `GET /courses` → `500 Internal Server Error` in the backend log.
- Cause: an unhandled exception in the route (`KeyError: 'ofset'`) becomes a `500` response produced outside `CORSMiddleware`, so it has no `access-control-*` headers (checked with `curl -i -H "Origin: http://localhost:3000" /courses`: `500`, no `access-control-allow-origin`); the browser reports it as a CORS error.
- How I found it: the page that does not use CORS (`/courses`, requested by the Next.js server) also fails, so the cause is not CORS (steps 1 and 5); the backend terminal shows `500` and the traceback ending with `File ".../main.py", line 47, in list_courses` / `KeyError: 'ofset'`. Lesson: status and the backend terminal first, CORS settings after.

## Deployment

_Add a link here once deployed to Vercel._
