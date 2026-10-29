# Digital Journal App

**CodTech IT Solutions Internship Project**

## Intern details
- **Intern ID:** CITS9948
- **Full Name:** MEKALA ANUDEEP
- **Duration:** 4 weeks
- **Project Name:** Digital Journal App

## Overview
A responsive digital journal built with HTML, CSS, and vanilla JavaScript. Users can create, edit, delete, search, and review journal entries with a date and mood.

## Features
- Create journal entries with title, date, mood, and content
- Edit existing entries
- Delete entries with a confirmation prompt
- Search by title, content, date, or mood
- Choose from 20 feelings when writing an entry
- Display entry count and latest entry date
- Save entries in browser `localStorage`
- Optional local-device password lock
- Responsive layout for desktop and mobile screens

## Requirements
A modern browser (Chrome, Edge, Firefox, etc.). No package installation or server is required.

## Run locally
1. Download or extract the project folder.
2. Open `index.html` in a browser.
3. On first open, create a password, then add a journal entry and click **Save entry**.

Recommended: Open the folder in VS Code and use the Live Server extension if it is already installed. The app also works by opening `index.html` directly.

## Files
- `index.html` — page structure
- `style.css` — layout and styling
- `script.js` — journal functionality and localStorage
- `README.md` — project documentation

## Data storage note
Entries are saved in the browser's localStorage on the current browser profile and device. Clearing browser site data or using a different browser/device may remove or hide the entries. This is a frontend-only app; it does not use a server, account system, or cloud database.

The password lock is only a casual convenience screen. Its password verifier is stored in localStorage, and journal entries remain unencrypted there. Someone with access to the browser profile or developer tools can bypass the lock or read the entries. Do not use this version for sensitive information; real privacy requires server-side authentication and encrypted storage.

## Testing checklist
- [ ] Create a password on first open and confirm an incorrect password is rejected
- [ ] Lock the journal and unlock it with the correct password
- [ ] Create an entry
- [ ] Refresh the browser and confirm the entry remains
- [ ] Search for a word in an entry
- [ ] Edit an entry and confirm changes are saved
- [ ] Delete an entry and confirm it disappears
- [ ] Check the layout on a narrow/mobile window
