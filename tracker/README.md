# Diksha's Tracker — Career Preparation & Daily Checklist Tracker

A premium, interactive career preparation checklist, syllabus tracker, and daily habit manager with automatic Cloud Sync (Firebase Firestore) and local storage persistence. Originally designed with a comprehensive UPSC syllabus checklist, it is fully extensible for any career preparation path (e.g., tech placements, Civil Services, or custom exam prep).

## Features
- **Flexible Syllabus Checklist:** Track progress of complex exams like UPSC Civil Services or custom topics. Add, delete, and customize root topics dynamically.
- **Daily Goals & Checklist:** Create repeating daily goals (e.g., LeetCode sheets, news reading, mock tests) and date-specific one-time tasks, tracked across a 31-day sliding calendar timeline.
- **Two-Section Stacked Lists:** Bilateral HTML5 drag-and-drop row reordering between **MANDATORY** and **TRY** categories for daily tasks.
- **Cloud Sync:** Progress is synchronized to Firebase Firestore when signed in with Google.
- **Mass Import/Export:** Easily mass add list items or export and import backup files (`.json`) locally.

---

## How to Run Locally

Because the application uses Google Authentication and Firestore, it needs to be served from a local web server (running it by opening `index.html` directly in the browser will cause Google Auth to fail).

### Option 1: Using Firebase CLI (Recommended)
Since this is a Firebase project, you can use the Firebase CLI to serve the application:
```bash
# Serve locally
npx firebase serve
```
This will start a local server, usually at `http://localhost:5000` or `http://localhost:5002`.

### Option 2: Using a generic lightweight server
If you don't want to use Firebase commands, you can use any Node.js static file server:
```bash
# Using npx to run http-server without installing it globally
npx http-server .
```
This will host it at `http://localhost:8080`.

---

## How to Deploy Updates

To deploy new features, styling, or database updates to the live site:

```bash
# Deploy hosting and rules updates
npx firebase deploy
```

