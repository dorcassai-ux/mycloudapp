# StudyTrack — Student Task & Deadline Tracker

Responsive static web application for organizing student tasks and deadlines.

## Features
- Add, edit, complete/reopen, and delete tasks
- Dashboard totals for total, pending, completed, and overdue tasks
- Search by task, subject, or notes
- Status and priority filters
- Upcoming deadlines panel
- Browser localStorage persistence
- Responsive desktop, tablet, and mobile layout
- Bootstrap 5.0.2 for modal/toast components and custom CSS in `css/style.css`

## Files
- `index.html` — page structure
- `css/style.css` — all custom styling and responsive breakpoints
- `js/app.js` — task logic and localStorage
- `assets/` — reserved for optional local assets

## Run locally
Extract the ZIP and open `index.html` in a modern browser. Bootstrap and Google Fonts are loaded from external CDNs, so an internet connection is needed for those external assets. The app's custom CSS and JavaScript are included locally. For local server testing, use VS Code Live Server or run `python -m http.server 8000` from this directory.

## Storage limitation
Tasks are stored in localStorage for the current browser and device. They are not synchronized between devices or users. Clearing browser storage may remove saved tasks. This MVP has no login, shared account, backend, or database.

## AWS deployment
1. Create an S3 bucket for static website files.
2. Upload `index.html`, `css/style.css`, and `js/app.js`, preserving the directory structure.
3. For a recommended secure setup, keep the S3 bucket private and configure CloudFront with Origin Access Control (OAC).
4. Set CloudFront's default root object to `index.html`.
5. Open the CloudFront distribution URL and test the site on desktop and mobile.
6. Set an AWS Budget alert to monitor potential charges.

StudyTrack is a static app and does not require a server runtime or database for this MVP. Confirm the required architecture with your project coach before deployment.
