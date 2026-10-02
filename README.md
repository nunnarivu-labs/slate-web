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
- **Rich Text Editing with Markdown Storage:** A Tiptap editor provides bold, italic, strikethrough, headings, lists, checklists, links, quotes, and code formatting, plus undo and redo. Notes are saved as Markdown and displayed as formatted content in cards and previews. Switching to preview preserves the editor's undo history.
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

The editor runs in the browser and initializes after hydration. Note cards and previews support server rendering. Formatting changes are serialized to Markdown and saved through the existing Convex note flow; opening an untouched note preserves its original Markdown. Press **Enter** for a new paragraph or **Shift+Enter** for a line break.

The toolbar supports common note formatting. Tables and images do not currently have editor extensions or toolbar controls. Editing Markdown with unsupported structures may normalize or lose those structures.

Run the integration tests, TypeScript checks, and production build with:

```sh
npm run test
npx tsc --noEmit
npm run build
```

Tests cover Markdown round trips, checklist state, AI insertion and undo/redo, preview switching, server rendering, and shared spacing between edit and readonly modes.
