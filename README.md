# Slate: A Modern, Minimalist Note-Taking App

**Live Demo:** [**https://slate.nunnarivulabs.in**](https://slate.nunnarivulabs.in)

> Slate is a modern note-taking web app that combines the simplicity of Google Keep with powerful, unobtrusive features like rich Markdown support and a flexible tagging system, all powered by a real-time backend.

https://github.com/user-attachments/assets/c532a5ac-25bb-43dd-9f08-411e5e4afd5a

---

## 1. Project Goal

The goal was to build a note-taking tool that feels clean and simple for everyday use but provides powerful features for advanced users without cluttering the interface. The core philosophy is: "simple by default, powerful when you need it."

## 2. My Solution

I built Slate, a full-stack application designed for capturing thoughts with ease. The backend, powered by Convex, provides a real-time database, ensuring that notes sync instantly and seamlessly across devices. User authentication is securely managed by Clerk.

The application, built with React and TanStack Start, features a responsive, card-based interface that is both beautiful and functional. The focus was on creating a polished user experience, from the way notes are organized to the smart rendering of Markdown.

## 3. Key Features

*   **Intuitive Card-Based Interface:** A responsive, grid-based layout for a clean and visual way to view, create, and edit notes.
*   **Rich Text Formatting with Smart Markdown:** Notes are automatically rendered as formatted HTML, keeping the editing experience simple while allowing for powerful formatting.
*   **Flexible Tag-Based Organization:** Instead of rigid folders, Slate uses a flexible tagging system.
     *   **Full Tag Management:** Tags can be edited or deleted, with changes instantly cascading across all associated notes for a seamless and intuitive organizational experience.
     *   Assign multiple tags to a single note for powerful, multi-dimensional organization.
*   **Real-Time Sync Across Devices:** Built on the Convex real-time database, notes are automatically and instantly synced across all logged-in sessions.

* **Exclusive AI Capabilities (Available for Live Demo)**
This project includes a seamless integration with the Google Gemini API to create a smart, context-aware writing assistant. These premium features are available to be demonstrated in a live walkthrough:
    *   **Intelligent Tag Suggestions:** The AI analyzes the content of a note and suggests relevant tags. It intelligently prioritizes the user's existing tags but will also create new ones, providing personalized and efficient organization.
    *   **One-Click Summarization:** Generate a concise summary of long notes.
    *   **Action-Item Extraction:** Automatically create a Markdown checklist from unstructured text.

## 4. Tech Stack

*   **Framework & Backend:** TanStack Start (React)
*   **Database:** Convex (Real-time Database)
*   **Authentication:** Clerk
*   **Styling:** Tailwind CSS
*   **Routing & State Management:** TanStack Router, TanStack Query
*   **AI (Live Demo):** Google Gemini
*   **Deployment:** Netlify

## 5. Challenges & Lessons Learned

A key strategic decision for this portfolio piece was how to demonstrate the powerful, API-driven AI features without enabling them in the public guest demo.

I chose to showcase the robust core functionality of the app, while positioning the AI capabilities as a premium feature set available for a live walkthrough. This approach protects backend resources and reduces API costs, while creating a compelling reason for interested clients to initiate a conversation.
