Module Dependencies
Popup Modules (js/modules/)

All modules are ES6 exports imported by popup.js
ConnectionManager depends on utils.js
NetworkInfoManager depends on utils.js
UIManager depends on all other managers
ThemeManager operates independently
SettingsManager operates independently
DashboardManager depends on ConnectionManager and NetworkInfoManager

Dashboard Modules (dashboard/modules/)

All modules are loaded by dashboard.js via script injection
ChartManager depends on DashboardState
UIController depends on DashboardState and ChartManager
NetworkInfoManager operates independently
utils.js provides shared helpers for all modules

Key Files
Core Extension Files

manifest.json: Defines extension permissions, content security policy, and background service worker
popup.html: Main UI with modular CSS/JS imports, uses local libraries
background.js: Monitors network connectivity, handles captive portal detection

Dashboard Files

dashboard.html: Standalone analytics page with performance charts
dashboard.js: Orchestrates all dashboard modules and initialization
dashboard.css: Complete styling with dark mode and responsive design

Shared Libraries (libs/)

chart.umd.min.js: Chart.js v4.4.1 for data visualization
Sortable.min.js: Sortable.js v1.15.0 for drag-and-drop

Data Flow

Popup → Background: Connection test requests via chrome.runtime messages
Background → Storage: Network metrics saved to chrome.storage.local
Storage → Dashboard: Real-time updates via storage change listeners
Dashboard → Popup: Shared state through chrome.storage.local

Build & Deployment
No build process required - extension runs directly from source:

Load unpacked extension in Chrome developer mode
Point to project root directory
All modules load automatically via ES6 imports (popup) or script injection (dashboard)

Chrome Extension Compliance

✅ All scripts loaded locally (no external CDNs in production)
✅ Content Security Policy compliant
✅ Manifest V3 compatible
✅ All required permissions declared
✅ Service worker for background tasks