**🧩 Feature Summary**

**Objective:**\
Introduce an advanced prompt-building system that allows users to select
files or directories from their local environment (via browser), inject
file content and metadata into prompt templates, run prompts through AI
models, receive diff-based output suggestions, and apply those diffs
selectively.

**Scope:**

- Fully web-based (Electron-compatible if needed)

- Cross-platform (Windows, macOS)

- Secure, local-first file access using browser APIs + backend

- Compatible with local and remote LLMs (OpenAI, Claude, Gemini, etc.)

- Extensible for later support of teams, rollback, plugin-based
  workflows

**⚙️ Functional Requirements**

**1. File Context Selection UI**

**1.1 Tree-Structured File Explorer**

- Allow users to connect a local project folder (via browser sandboxed
  FS API, or a helper app)

- Display hierarchical view of file structure

- Show:

  - File size

  - Token estimate (based on encoding model)

  - File type icon

  - Language syntax for code files

- Support:

  - Multi-select (files, folders)

  - Expand/collapse folders

  - File filtering (regex, glob, extension, token size limit)

**1.2 .gitignore and Custom Ignore Support**

- Parse .gitignore files in root of selected directory

- Support custom .repoignore file with override rules

- Visually dim or hide ignored files

**1.3 File Previews**

- Show preview panel (read-only) for selected files

- Enable syntax highlighting

- Provide \"include/exclude from context\" toggles

**2. Context Builder Engine**

**2.1 Token Budget Management**

- Display running token total of included files

- Warn when token limits of selected model are exceeded

- Allow max token override per file (e.g., truncate to N tokens)

- Support \"head-only\", \"tail-only\", \"custom excerpt\" modes

**2.2 Metadata Injection**

- Auto-generate file tree structure (Markdown/ASCII-art format or JSON)

- Inject as preamble into prompt

- Include:

  - Filenames

  - Relative paths

  - Directory nesting

  - File types

**2.3 Prompt Assembly**

- Combine selected:

  - System prompt

  - User instruction

  - File tree

  - File contents

- Option to wrap each section in XML/Markdown or other format required
  by LLM

- Allow "prompt preview" before submission

- Optionally collapse large files using "\<truncated\>" tag for partial
  input

**3. Prompt Execution Pipeline**

**3.1 Template System**

- Store predefined prompt templates (PLAN, ACT, EXPLAIN, DOC, FIX, etc.)

- Allow dynamic variables (e.g. {{filename}}, {{file_tree}},
  {{main_file}})

- Support multi-phase prompting (e.g. PLAN -\> ACT)

**3.2 Multi-Model Compatibility**

- Define model targets per template:

  - GPT-4-turbo, Claude 3, Gemini Pro, DeepSeek, Ollama

- Use adapters for formatting prompts per model's requirements

- Allow user selection and fallback if rate limit or error occurs

**3.3 Output Token Streaming (Optional)**

- Display streamed output from model with token-level progress

- Maintain streaming UI until full message is received

**4. Diff-Based Output Handling**

**4.1 Diff Format Normalization**

- AI returns code suggestions either:

  - Inline diffs (e.g., Git-style unified diffs)

  - Full replacement code blocks

- Parse and normalize outputs into:

  - Unified diff format (e.g., using diff-match-patch lib)

  - JSON-patch or internal AST-diff format for IDE integration

**4.2 Interactive Diff Viewer**

- Display side-by-side and inline views of changes

- Highlight additions/deletions

- Allow:

  - Accept all changes

  - Reject all changes

  - Line-level toggles

  - File-level toggles

**4.3 Apply Diff to Local Files**

- Via helper app (Electron or local agent):

  - Write changes to local file system

  - Create backup of original files in .repoprompt-backups/

- Alternatively (fully web version):

  - Allow download of patched version

  - Provide Git-style patch file

**5. Prompt History & Versioning**

**5.1 Prompt Logs**

- Store full prompt input, selected files, model, output, and metadata

- Allow "Replay", "Fork", or "Compare" with later prompt versions

**5.2 Versioning System**

- Allow saving and labeling each prompt run

- Associate output with a diff ID

- Provide rollback options:

  - Restore previous version

  - View change history

**6. Security & Privacy**

- All file handling must occur **locally** or with explicit upload
  confirmation

- Clearly show what files and contents will be sent to the cloud

- Option for **local-only mode** with offline models (e.g., Ollama)

- Encrypt prompt history and config in browser storage (IndexedDB +
  WebCrypto)

**✅ Non-Functional Requirements**

- **Cross-platform compatibility**: Must run in all Chromium-based
  browsers on Windows and macOS

- **Performance**: File parsing, preview, and diff rendering must remain
  snappy up to 1000 files or 50 MB

- **Responsiveness**: UI fully responsive, supports 13\" to 4K displays

- **Accessibility**: Full keyboard navigation and screen reader support

- **Scalability**: Should support large mono repos or microservice
  architectures
