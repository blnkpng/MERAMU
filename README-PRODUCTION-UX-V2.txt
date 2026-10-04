MERAMU — Production UX / Responsive V2

Based on the latest MERAMU-PRODUCTION-IOS-NOTIFY-V2 project.

Changes:
1. Production table now switches to card layout on tablet/phone widths (<=900px), avoiding forced 760px horizontal table overflow.
2. Production header, search, filters, summary cards and action buttons are responsive.
3. Action buttons remain touch-friendly on mobile.
4. Fixed duplicate F1 play icon in Production action row.
5. Fixed Production loading handler to target #productionTableWrap instead of a non-existent #productionTableContainer.
6. Added search accessibility label.
7. No database/schema/workflow changes.
8. Existing D1 delete action and iOS-style notification are preserved.

Files changed:
- js/production.js
- css/production.css
