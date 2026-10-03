# Slate: A Modern, Minimalist Note-Taking App

**Website:** [**https://slate.nunnarivulabs.in**](https://slate.nunnarivulabs.in)

> Slate is a modern note-taking web app that combines the simplicity of Google Keep with powerful, unobtrusive features like rich Markdown support and a flexible tagging system, all powered by a real-time backend.

https://github.com/user-attachments/assets/c532a5ac-25bb-43dd-9f08-411e5e4afd5a

---

## 1. Project Goal

The goal was to build a note-taking tool that feels clean and simple for everyday use but provides powerful features for advanced users without cluttering the interface. The core philosophy is: "simple by default, powerful when you need it."

## 2. My Solution

I built Slate, a full-stack application designed for capturing thoughts with ease. The backend, powered by Convex, provides a real-time database, ensuring that notes sync instantly and seamlessly across devices. User authentication is securely managed by Clerk.

The application, built with React and TanStack Start, features a responsive, card-based interface that is both beautiful and functional. The focus was on creating a polished user experience, from the way notes are organized to the smart rendering of Markdown.

## 3. Key Features

- **Intuitive Card-Based Interface:** A responsive, grid-based layout for a clean and visual way to view, create, and edit notes.
- **Rich Text Editing with Markdown Storage:** A Tiptap editor provides bold, italic, strikethrough, headings, lists, checklists, links, quotes, and code formatting, plus undo and redo. Notes are saved as Markdown. A single formatted editor supports tables, and Tiptap renders note cards and AI results. Cmd/Ctrl-click opens links while editing.
- **Flexible Tag-Based Organization:** Instead of rigid folders, Slate uses a flexible tagging system.
  - **Full Tag Management:** Tags can be edited or deleted, with changes instantly cascading across all associated notes for a seamless and intuitive organizational experience.
  - Assign multiple tags to a single note for powerful, multi-dimensional organization.
- **Real-Time Sync Across Devices:** Built on the Convex real-time database, notes are automatically and instantly synced across all logged-in sessions.

- **AI Capabilities**
  This project uses the OpenAI SDK with a configurable model and API endpoint to provide a context-aware writing assistant. Custom endpoints must support the Responses API and structured outputs for tag suggestions:
  - **Intelligent Tag Suggestions:** The AI analyzes the content of a note and suggests relevant tags. It intelligently prioritizes the user's existing tags but will also create new ones, providing personalized and efficient organization.
  - **One-Click Summarization:** Generate a concise summary of long notes.
  - **Action-Item Extraction:** Automatically create a Markdown checklist from unstructured text.
  - **Editable AI Results:** Insert generated content into the note as formatted, editable text and undo the insertion when needed.

## 4. Tech Stack

- **Framework & Backend:** TanStack Start (React)
- **Database:** Convex (Real-time Database)
- **Authentication:** Clerk
- **Styling:** Tailwind CSS
- **Routing & State Management:** TanStack Router, TanStack Query
- **Editor:** Tiptap with its Markdown extension
- **Markdown Display:** react-markdown, remark-gfm, remark-breaks
- **AI:** OpenAI SDK with configurable model and endpoint
- **Deployment:** Netlify

## 5. Local Development

With Docker running, dependencies installed, and `.env.local` configured, start the full local stack on macOS or Linux:

```sh
npm run dev:all
```

This waits for the Docker services to be ready, then runs Convex and Vite together. Press **Ctrl+C** to stop both processes and the Docker Compose services. Your Docker data is preserved. If either development process exits, the rest of the stack is stopped as well.

The individual `npm run convex` and `npm run dev` commands remain available.

AI features use `AI_API_KEY` and `AI_MODEL` from `.env.local`. Set `AI_API_BASE_URL` when using a custom endpoint; omit it to use the SDK's default endpoint. Keep the API key server-side.

## 6. Editor Behavior and Checks

The editor runs in the browser and initializes after hydration. Note cards and AI results support server rendering. Formatting changes are serialized to Markdown and saved through the existing Convex note flow; opening an untouched note preserves its original Markdown. Press **Enter** for a new paragraph or **Shift+Enter** for a line break.

The toolbar supports common note formatting and table insertion, row and column controls, and deletion. Images remain unsupported. Editing Markdown with unsupported structures may normalize or lose those structures.

Run the integration tests, TypeScript checks, and production build with:

```sh
npm run test
npx tsc --noEmit
npm run build
```

Tests cover Markdown round trips, checklist state, AI insertion and undo/redo, table editing, server rendering, and shared spacing between the editor and static content.

## 7. Local Observability

With `grafana/otel-lgtm` exposing port 4318, `npm run dev` (and `npm run dev:all`)
exports server traces, AI metrics, and AI logs to `http://localhost:4318`.
Restart Vite after adding this setup. The SDK initializes only for development;
the production build does not initialize an exporter.

Optional `.env.local` settings:

```dotenv
OTEL_ENABLED=true
SLATE_OTEL_SERVICE_NAME=slate
SLATE_OTEL_ENDPOINT=http://localhost:4318
```

Set `OTEL_ENABLED=false` to disable local export. Shell environment settings take
precedence over `.env.local`. The endpoint is the base OTLP HTTP URL; the SDK
appends `/v1/traces`, `/v1/metrics`, and `/v1/logs`.
Slate deliberately uses `SLATE_OTEL_*` for its service name and destination:
some IDEs/dev tools inject generic `OTEL_SERVICE_NAME` and
`OTEL_EXPORTER_OTLP_ENDPOINT` settings that point to their own telemetry collector.
The startup message shows Slate's effective destination. Restart the Vite process
after changing these settings, because providers persist across config reloads.

Open Grafana at http://localhost:3000 and use Explore:

- **Tempo:** find service `slate`. Server request spans contain child AI spans
  named `ai.summarize`, `ai.extract_action_items`, or `ai.suggest_tags`.
- **Prometheus:** search for `slate_ai` metrics: requests by operation/outcome,
  duration histograms in seconds, and input/output token counts when returned by
  the provider. Metrics export every five seconds.
- **Loki:** filter `{service_name="slate"}` for browser and AI completion/error logs.
  Logs carry the active trace and span IDs for correlation.

Run `npm run telemetry:check` to send a synthetic success and failure, with sample
token counts, without calling the AI provider. Look up the printed trace ID in
Tempo. The metrics from this check are synthetic; restart LGTM with fresh storage
if you need a clean measurement baseline.

Telemetry captures operation names, model names, duration, outcomes, token counts,
HTTP method/status and URLs, complete AI inputs and instructions, provider responses,
parsed results, and exception messages/stacks. Content appears in traces and logs;
metric labels contain only operation/model/outcome/token type. API keys and auth
headers are not explicitly collected. AI latency covers the complete operation,
including SDK retries and result parsing. Server spans cover middleware/handler
execution, not the time to finish sending a streamed response. Handled server-function
errors may use HTTP 200; the child AI span and its outcome metric identify AI failures.

### Frontend telemetry

Browser and server telemetry share service `slate`. The resource attribute
`slate.runtime` distinguishes `browser` and `server`; `SLATE_OTEL_SERVICE_NAME`
configures the name for both runtimes. Browser telemetry sends OTLP through Vite's
same-origin `/__otel/v1` proxy to the existing LGTM collector. No collector CORS
configuration or additional containers are required. Reload the page after
restarting Vite; `OTEL_ENABLED=false` also disables browser instrumentation.

- **Traces:** document loads, router navigation, same-origin fetch requests, note
  saves (including archive/trash through the save flow), search navigation, and AI
  operations. Same-origin fetch requests propagate trace context to the TanStack
  server, allowing browser and server spans to appear in one trace.
- **Logs:** operation outcomes/duration/results, note save inputs, search terms,
  Web Vitals, uncaught errors, unhandled promise rejections, and errors caught by
  the router's React boundary. Error records include messages and stacks.
- **Metrics:** operation counts and duration histograms, browser error counts,
  and Web Vitals (CLS, FCP, INP, LCP, TTFB). Metrics export every five seconds.
  Web Vitals emit when their measurements become available; some finalize when
  the page becomes hidden. Content and URLs are not metric labels.

In Tempo use `{ resource.service.name = "slate" }`, or add
`&& resource.slate.runtime = "browser"` inside the braces to filter by runtime.
In Loki use `{service_name="slate"}`; append `| slate_runtime="browser"` when
you need only browser logs. In Prometheus search for metrics beginning with
`slate_browser`.

With Vite running, open `/__telemetry-check` for a synthetic browser-to-server fetch
and browser error. The page prints the trace ID to inspect in Tempo. It makes no
AI requests and changes no notes; the check endpoint is available only in dev.

Navigation/search durations measure router resolution, and note saves measure the
user-facing operation; they do not measure Convex's internal execution. Convex
instrumentation and log/metric collection are intentionally left out.
