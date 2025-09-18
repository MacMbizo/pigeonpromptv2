# PigeonPrompt Enhanced Features

This is a living document tracking all implemented and planned features for PigeonPrompt. Update this file as new features are added or enhanced.

---

## Phase 1 Features (Complete)

### Visual Context Engineering
- File/folder tree browser in the prompt builder
- Select files and code snippets for AI prompt context
- Preview and selection UI for files/snippets

### Clipboard & XML Workflow
- "Copy as XML" and "Copy as Text" buttons to export selected context for LLMs
- One-click clipboard integration for all context (files + snippets)

### Code Maps
- Auto-generate and display a visual map of code structure (file tree, function/class diagrams)
- Interactive Mermaid diagrams for code structure
- Supports JS/TS and Python

### AI Context Builder
- UI for crafting system/user instructions, including file trees, file contents, and custom instructions
- Save/load context presets (local)
- Combine files, code maps, snippets, and notes into a context package

### Saved Prompt Templates
- Library of 20+ high-quality prompt templates (auto-populated for new users)
- Full CRUD for user templates (create, edit, delete, insert)

### Git & Ignore Support
- Parse `.gitignore` and custom ignore files to filter the file tree/context selection
- Only relevant files are shown for context and code maps

### Theming & Accessibility
- Animated theme toggle (light/dark mode)
- Full, consistent dark mode support across all pages
- All UI refactored to use theme variables for color and background
- Dashboard and prompt page parity in design system
- Accessibility improvements (keyboard navigation, color contrast)

### Navigation & Layout
- Sidebar layout with context provider for all main pages
- Enhanced sidebar navigation (404 links fixed and audited)
- Bug fixes for sidebar context and navigation

---

## Future/Phase 2+ Features (Planned)

- Advanced context sharing and collaboration
- Real-time multi-user editing
- Cloud sync and team workspaces
- Enhanced analytics and usage insights
- More advanced code map/call graph visualizations
- ...and more!

---

**Please update this document as new features are implemented or planned.** 