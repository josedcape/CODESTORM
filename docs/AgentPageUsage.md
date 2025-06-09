# Agent Page Usage Guide

This document explains how to view directories and the code editor on the **Agent** page.

## 1. Start the application

```bash
npm install
npm run start
```

This runs the proxy on port `3001` and the Vite dev server on `5173`.

## 2. Open the Agent page

Navigate to [http://localhost:5173/agent](http://localhost:5173/agent) in your browser.

## 3. Load a project

Use the **Project Loader** panel to load a GitHub repository or upload a ZIP file. Once a project is loaded, the directory tree appears under the **Project** tab and you can open files in the editor.

If no project is loaded, a placeholder is shown with the message "No project loaded".

## 4. Verify file changes

After loading a project you can create, modify, delete or rename files from the file tree or via the interactive chat instructions. The editor updates automatically so you can confirm that modifications were applied.
