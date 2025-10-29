# Slate 📝

A modern, web-based note-taking app inspired by the simplicity of Google Keep, with powerful, unobtrusive features for power users.

---

## About The Project

Slate is a personal note-taking application built on the philosophy that a tool should be simple by default, but powerful when you need it to be. It provides a clean, uncluttered space for capturing thoughts, mimicking the ease of use of Google Keep.

However, where Slate differs is in its seamless integration of advanced features. Formatting with Markdown and leveraging AI-powered assistance are powerful additions that remain completely unobtrusive, ensuring a simple and intuitive experience for basic note-taking while empowering users who need more.

## ✨ Key Features

*   **📇 Card-Based Interface**: A responsive, grid-based layout of note cards, just like Google Keep. Quickly view, create, and edit your notes in a clean and visual way.

*   **✍️ Seamless Markdown Support**: Unlike traditional plain-text notes, Slate embraces Markdown without complicating the user experience.
    *   **Smart Rendering**: Notes are automatically rendered as formatted HTML if they contain Markdown syntax, but look like plain text otherwise.
    *   **Simple Editing**: A standard `textarea` is used for editing, allowing you to focus on the content, whether you're writing plain text or structured Markdown.

*   **🏷️ Flexible Tag-Based Organization**: Instead of rigid folders, Slate uses a flexible tagging system (similar to Google Keep's "Labels").
    *   **Multi-Dimensional**: Assign multiple tags to a single note (e.g., `#work`, `#ideas`) for powerful organization.
    *   **Intuitive Filtering**: Tags appear as subtle "chips" on each note. A sidebar lists all unique tags, allowing you to filter your notes with a single click.
    *   **Completely Optional**: Tagging is not required, preserving the simplicity of the main note view for users who don't need it.

*   **🤖 Unobtrusive AI Integration (Gemini)**: Powerful AI features are available but hidden behind a single, subtle "sparkle" icon (✨) in the note editor. The AI is an assistant you call upon, not one that interrupts your workflow.
    *   **Summarize Note**: Generate a concise summary of long notes.
    *   **Extract Action Items**: Automatically create a Markdown checklist from tasks mentioned in your text.
    *   **Suggest Tags**: Intelligently recommend relevant tags based on the note's content.
    *   **Improve Writing**: Correct grammar and spelling, and enhance the clarity of your text.

*   **🔄 Seamless Sync**: Your notes are automatically and seamlessly synced across all your logged-in devices. (Support for native Android and iOS apps is planned for the future).

## 🛠️ Tech Stack

This project is built with a modern, type-safe, and highly efficient stack:

*   **Framework & Backend**: [TanStack Start](https://tanstack.com/start/latest) (React)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Routing**: [TanStack Router](https://tanstack.com/router/latest)
*   **Data Fetching / State Management**: [TanStack Query](https://tanstack.com/query/latest)
*   **Database**: [Convex](https://www.convex.dev/)
*   **Authentication**: [Clerk](https://clerk.com/)
*   **Deployment**: [Netlify](https://www.netlify.com/)
