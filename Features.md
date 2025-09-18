**File System**

The application will follow a monolithic repository structure using
Next.js 14's App Router. This approach simplifies development,
deployment, and type-sharing between the frontend and backend (API
routes), which is ideal for the initial product phases. The structure is
designed for clear separation of concerns and future extensibility.

/pigeonprompt-app

├── /app/

│ ├── /api/ # Backend API Routes

│ │ ├── /auth/ # Authentication endpoints (NextAuth.js)

│ │ ├── /projects/ # Project management (connecting local folders)

│ │ ├── /context/ # Context packaging and processing

│ │ └── /codemaps/ # Code map generation

│ ├── /(app)/ # Main authenticated application routes

│ │ ├── /project/[projectId]/ # Main workspace view for a connected
project

│ │ │ ├── /layout.tsx # Main layout with sidebars and main view

│ │ │ └── /page.tsx # Default page for a project

│ │ ├── /settings/ # User settings page

│ │ └── /dashboard/ # User's main dashboard (future use)

│ ├── /layout.tsx # Root layout

│ └── /page.tsx # Landing/Login page

│

├── /components/

│ ├── /ui/ # Shadcn/ui components (Button, Input, etc.)

│ ├── /core/ # Core application components (Header, Sidebar)

│ ├── /features/ # Components specific to a major feature

│ │ ├── /file-explorer/

│ │ ├── /context-builder/

│ │ ├── /code-maps/

│ │ └── /prompt-templates/

│ └── /icons/ # Custom icon components

│

├── /lib/

│ ├── /auth.ts # NextAuth.js configuration

│ ├── /db.ts # Drizzle ORM setup and schema

│ ├── /local-fs.ts # Abstractions for File System Access API

│ ├── /parser/ # Parsers for .gitignore, code files (AST)

│ ├── /token-estimator.ts # Token counting logic

│ └── /utils.ts # General utility functions

│

├── /hooks/ # Custom React hooks

│ ├── /useProjectFS.ts # Hook for managing local file system state

│ └── /useContextBuilder.ts # Hook for managing the context building
state

│

├── /public/ # Static assets (images, fonts)

│

├── /styles/

│ └── /globals.css # Global styles (Tailwind CSS base)

│

├── /types/ # TypeScript type definitions

│ ├── /api.ts

│ ├── /db.ts

│ └── /features.ts

│

├── /tests/ # Testing suite (Vitest, Playwright)

│ ├── /components/

│ └── /e2e/

│

├── .env.local # Environment variables

├── next.config.js # Next.js configuration

└── tsconfig.json # TypeScript configuration

**Feature Specifications**

**Feature 1: Visual Context Engineering (File Explorer & Selection)**

- **Feature Goal:** To provide users with a secure, intuitive, and
  powerful interface for connecting a local project folder and selecting
  specific files and code snippets to be used as context for an AI
  prompt. The system must respect user-defined ignore rules and provide
  immediate feedback on the context being built.

- **API Relationships:**

  - **Frontend-Only (Primary):** This feature primarily uses the
    browser's File System Access API. All file reading, parsing, and
    tree generation happens client-side for maximum security and
    privacy. No file contents are sent to the backend API until the user
    explicitly builds and sends a prompt.

  - **/api/projects/**: While file contents are local, the metadata
    about a connected project (e.g., folder name, handle to the
    directory) might be stored in the user's database record to allow
    for "recent projects" functionality. This would involve **POST
    /api/projects** to save a reference and **GET /api/projects** to
    list them.

- **Detailed Feature Requirements:**

  1.  **Connect Local Project:**

      - A "Connect Folder" button will trigger
        the **window.showDirectoryPicker()** API.

      - The application must request persistent read permissions for the
        selected directory.

      - The directory handle will be stored in IndexedDB to allow for
        quick re-access across sessions without prompting the user
        again.

  2.  **Hierarchical File Explorer UI:**

      - Display the selected folder's contents in a tree structure,
        similar to VS Code's explorer.

      - Each item in the tree (file or folder) must be selectable via a
        checkbox.

      - Selecting a folder will recursively select all its non-ignored
        children.

      - Each file item must display:

        - A file type icon (e.g., JS, PY, MD icon).

        - The file name.

        - An estimated token count (client-side calculation).

        - File size (in KB).

  3.  **Git & Ignore Support:**

      - Upon connecting a folder, the system must automatically scan for
        a **.gitignore** file in the root.

      - It must also look for a custom **.pigeonpromptignore** file.
        Rules in this file override **.gitignore**.

      - The parser must handle standard **.gitignore** syntax
        (wildcards, directory rules, negations).

      - Ignored files and folders must be visually de-emphasized (e.g.,
        grayed out, reduced opacity) in the file tree and be
        unselectable by default.

      - A toggle must exist to "Show/Hide Ignored Files".

  4.  **File Preview & Snippet Selection:**

      - Clicking on a file name (not the checkbox) will open its content
        in a read-only preview panel.

      - The preview panel must feature syntax highlighting (using a
        library like **react-syntax-highlighter** or Monaco Editor's
        read-only mode).

      - Within the preview, users can select specific lines or blocks of
        code.

      - When a snippet is selected, a "+" or "Add to Context" button
        should appear, allowing the user to add just that snippet to the
        context instead of the whole file.

      - Selected snippets will be listed in the "Context Builder" UI.

- **Detailed Implementation Guide:**

  1.  **State Management:** Use a state management library (like Zustand
      or Jotai) or React Context to manage the file system state. The
      state should include the directory handle, the file tree
      structure, the set of selected file paths, the set of selected
      snippets, and the parsed ignore rules.

  2.  **Recursive File Traversal:** Create an **async** function that
      takes a directory handle and recursively traverses it to build a
      nested JSON object representing the file tree. For each entry,
      check it against the parsed ignore rules before adding it to the
      tree.

      - *Pseudo-code for traversal:*

      - async function buildFileTree(directoryHandle, ignorePatterns) {

      - let tree = [];

      - for await (const entry of directoryHandle.values()) {

      - if (isIgnored(entry.name, ignorePatterns)) continue;

      - if (entry.kind === 'file') {

      - const file = await entry.getFile();

      - tree.push({

      - name: entry.name,

      - kind: 'file',

      - path: /* construct relative path */,

      - size: file.size,

      - tokens: await estimateTokens(file)

      - });

      - } else if (entry.kind === 'directory') {

      - tree.push({

      - name: entry.name,

      - kind: 'directory',

      - path: /* construct relative path */,

      - children: await buildFileTree(entry, ignorePatterns)

      - });

      - }

      - }

      - return tree;

      - }

  3.  **Ignore Rule Parsing:** Use a library like **ignore** (from npm)
      to parse **.gitignore** and **.pigeonpromptignore** files. Create
      a filter function that can be applied during the file traversal.

  4.  **UI Implementation:**

      - Use a recursive React component to render the file tree.
        Each **DirectoryNode** component would map over
        its **children** and render either a **FileNode** or
        another **DirectoryNode**.

      - Use a library like **react-virtualized** or **react-window** if
        performance becomes an issue with very large directories (1000+
        files) to only render the visible nodes.

      - The preview panel will be a separate component that receives a
        file handle, reads the content, and passes it to the syntax
        highlighter.

**Feature 2: AI Context Builder & Clipboard Workflow**

- **Feature Goal:** To provide a dedicated UI where users can assemble
  the final prompt context from various sources (selected files,
  snippets, code maps, instructions), manage the token budget, and
  export the complete context to the clipboard in multiple formats.

- **API Relationships:** This feature is also primarily client-side. It
  assembles text content locally. The only API interaction is when the
  final, assembled prompt is sent to an external LLM API (e.g., OpenAI,
  Claude), which is handled by a later feature.

- **Detailed Feature Requirements:**

  1.  **Context Assembly UI:**

      - A dedicated panel, separate from the file explorer, that shows
        all items added to the context.

      - This panel should have distinct sections for:

        - System Instructions (a dedicated textarea).

        - User Instructions (a dedicated textarea).

        - Context Files & Snippets (a list of added items).

        - Code Maps (if any are added).

  2.  **Token Budget Management:**

      - A running total of the estimated tokens for the entire context
        must be displayed prominently.

      - A dropdown will allow the user to select a target model (e.g.,
        "GPT-4 Turbo - 128k", "Claude 3 Sonnet - 200k"), which sets
        the token limit.

      - The token count display should change color (e.g., to orange,
        then red) as it approaches and exceeds the selected model's
        limit.

      - Each file added to the context must have options to manage its
        contribution:

        - "Full File"

        - "Truncate to N tokens" (with an input for N).

        - "Head-only" (first N tokens).

        - "Tail-only" (last N tokens).

  3.  **Context Presets:**

      - A mechanism to save the current state of the Context Builder
        (instructions, file selections, truncation settings) as a named
        preset.

      - These presets must be stored locally in the browser's
        IndexedDB.

      - A dropdown or list should allow users to load their saved
        presets.

  4.  **Clipboard & XML Workflow:**

      - Two primary action buttons must be available: "Copy as Text"
        and "Copy as XML".

      - **"Copy as Text"** will concatenate all parts of the context
        into a single string, using Markdown for structure (e.g., **##
        System Prompt**, **### File: src/index.js**).

      - **"Copy as XML"** will wrap each part of the context in
        descriptive XML tags as preferred by models like Claude.

        - Example: **<system_prompt>...</system_prompt><file
          path="src/index.js">...</file>**

      - The copy action must be a one-click operation that places the
        entire formatted context onto the user's clipboard.

- **Detailed Implementation Guide:**

  1.  **State Management:** The **useContextBuilder** hook will manage
      the state, including the content of the instruction textareas, an
      array of context items (files, snippets, maps), and their
      individual settings (e.g., truncation mode).

  2.  **Context Assembler Logic:** Create a
      function **assembleContext(format: 'text' | 'xml')**. This
      function will iterate through the context items in a predefined
      order (System Prompt -> User Instructions -> Code Maps ->
      Files/Snippets).

      - It will read the content for each file/snippet asynchronously
        using the stored file handles.

      - It will apply any truncation rules.

      - It will wrap the content in the appropriate formatting (Markdown
        headers or XML tags) based on the **format** argument.

      - It will return a single, large string.

  3.  **Token Calculation:** The **token-estimator.ts** library will use
      a tokenizer like **gpt-tokenizer**. The **useContextBuilder** hook
      will have a **useEffect** that re-calculates the total token count
      whenever the context items or their settings change, updating the
      UI accordingly.

  4.  **Preset Storage:** Use a simple key-value store library
      like **idb-keyval** to wrap IndexedDB
      operations. **savePreset(name, state)** will serialize the context
      builder's state to JSON and store it. **loadPreset(name)** will
      retrieve and deserialize it, updating the application state.

  5.  **UI Implementation:**

      - The Context Builder panel will be a multi-section component.

      - Each item in the "Context Files" list will be a component
        itself, displaying the file path and the truncation controls.

      - The "Copy" buttons will trigger
        the **assembleContext** function and then use
        the **navigator.clipboard.writeText()** API to copy the result.
        A success toast notification should be shown to the user.

**Feature 3: Code Maps**

- **Feature Goal:** To automatically generate and display interactive,
  visual representations of the selected code's structure, helping both
  the user and the AI to quickly understand the project's architecture.

- **API Relationships:**

  - **Client-Side Processing:** All code parsing and diagram generation
    happens locally in the browser using WebAssembly-powered parsers for
    performance.

  - **/api/codemaps/**: This is a potential future extension. For
    extremely large projects, the client could send the file tree
    structure (NOT file contents) to a backend service that orchestrates
    a more powerful, parallelized analysis, but the primary
    implementation is local-first.

- **Detailed Feature Requirements:**

  1.  **Automatic Generation:**

      - When files are added to the context, the system should
        automatically detect if they are of a supported language (JS/TS,
        Python).

      - A "Generate Code Map" button should appear in the Context
        Builder.

  2.  **Visual Representation:**

      - The primary output will be a Mermaid.js diagram.

      - **File Tree Map:** A graph diagram showing the folder and file
        structure of the selected context.

      - **Function/Class Diagram (for a single file):** When a user
        focuses on a single file, generate a class diagram showing
        classes, methods, properties, and their relationships. For
        functional files, show a graph of function calls.

  3.  **Interactive Diagrams:**

      - The rendered Mermaid diagram must be interactive (pan, zoom).

      - Clicking on a node in the diagram (e.g., a file name or function
        name) should highlight the corresponding file in the file
        explorer or scroll to the relevant code in the preview panel.

  4.  **Integration with Context Builder:**

      - The generated Mermaid diagram's source text (**graph TD;
        ...**) can be added to the AI context as a separate item. This
        provides the LLM with a high-level summary of the code's
        structure.

- **Detailed Implementation Guide:**

  1.  **AST Parsing:**

      - Use a library like **@babel/parser** for JavaScript/TypeScript
        and a WASM-compiled Python parser (e.g., a wrapper
        around **tree-sitter**) to parse the code into an Abstract
        Syntax Tree (AST). This is the most complex part and requires
        careful dependency management.

      - The parsing should happen in a Web Worker to avoid blocking the
        main UI thread.

  2.  **AST Traversal and Diagram Generation:**

      - Write visitor functions that traverse the AST and extract the
        necessary information (class names, method names, function
        declarations, import/export statements).

      - Create a **generateMermaidSyntax(ast)** function that takes the
        parsed AST and outputs a string of valid Mermaid syntax.

        - *Pseudo-code for class diagram:*

        - function generateClassDiagram(ast) {

        - let mermaidString = 'classDiagramn';

        - traverse(ast, {

        - ClassDeclaration(path) {

        - const className = path.node.id.name;

        - mermaidString += `class ${className} {n`;

        - path.get('body.body').forEach(member => {

        - if (member.isClassMethod()) {

        - mermaidString += ` +${member.node.key.name}()n`;

        - }

        - });

        - mermaidString += '}n';

        - }

        - });

        - return mermaidString;

        - }

  3.  **Rendering:**

      - Use the **mermaid** library. When the Mermaid syntax is
        generated, call **mermaid.render()** to generate an SVG.

      - Inject the SVG into a dedicated component for display. Add event
        listeners to the SVG nodes to handle interactivity (e.g., click
        events).

  4.  **Interactivity Linkage:** Use a shared state or event bus. When a
      diagram node is clicked, it fires an event with the relevant
      identifier (e.g., **filePath** or **functionName**). Other
      components (File Explorer, Preview Panel) listen for these events
      and update their own state (e.g., by highlighting or scrolling).

**Feature 4: Saved Prompt Templates**

- **Feature Goal:** To accelerate the user's workflow by providing a
  library of high-quality, pre-built prompt templates and allowing users
  to create, manage, and reuse their own custom templates. This feature
  turns repetitive prompting tasks into a one-click operation.

- **API Relationships:**

  - **GET /api/templates/system**: An unauthenticated endpoint to fetch
    the initial, system-provided templates. This allows new users to
    have immediate value.

  - **GET /api/templates/user**: An authenticated endpoint to fetch the
    user's saved custom templates.

  - **POST /api/templates/user**: Authenticated endpoint to create a new
    custom template.

  - **PUT /api/templates/user/{templateId}**: Authenticated endpoint to
    update an existing custom template.

  - **DELETE /api/templates/user/{templateId}**: Authenticated endpoint
    to delete a custom template.

- **Detailed Feature Requirements:**

  1.  **System Template Library:**

      - The application will ship with a default library of 20+
        high-quality templates covering common development tasks (e.g.,
        "Generate Unit Tests," "Explain This Code," "Refactor for
        Readability," "Write API Documentation," "Generate a
        Dockerfile").

      - These system templates are read-only for the user but can be
        "forked" or "duplicated" to create a new custom template.

  2.  **Template Structure:** A template is a data object containing:

      - **name**: A user-friendly name (e.g., "Jest Unit Test
        Generator").

      - **description**: A brief explanation of what the template does.

      - **system_prompt**: The content for the system
        prompt/instructions.

      - **user_prompt_template**: The content for the user prompt, which
        must support dynamic variables.

      - **variables**: An array of defined variables
        (e.g., **{{filePath}}**, **{{selectedCode}}**, **{{fileTree}}**).
        This allows the UI to validate the template.

      - **tags**: Keywords for categorization and search (e.g.,
        "testing", "javascript", "refactor").

  3.  **Full CRUD for User Templates:**

      - **Create:** A dedicated UI (likely a modal) for creating a new
        template. It will include fields for all properties in the
        template structure.

      - **Read:** A searchable and filterable view of both system and
        user-created templates. Users should be able to filter by tags
        or search by name/description.

      - **Update:** Users must be able to edit their own templates.

      - **Delete:** Users must be able to delete their own templates,
        with a confirmation step.

  4.  **Template Insertion Workflow:**

      - In the Context Builder UI, a "Use Template" button will open
        the template library.

      - Selecting a template will automatically populate the "System
        Prompt" and "User Prompt" textareas in the Context Builder.

      - The application will intelligently attempt to substitute
        variables. For example, if one file is selected in the context,
        its path will automatically replace **{{filePath}}**.

- **Detailed Implementation Guide:**

  1.  **Database Schema:** Create a **templates** table in the database
      with columns for **id**, **user_id** (nullable for system
      templates), **name**, **description**, **system_prompt**, **user_prompt_template**, **variables** (JSONB
      type), and **tags** (array type).

  2.  **API Logic:** Implement the standard RESTful CRUD endpoints.
      The **POST** and **PUT** endpoints must validate the incoming
      data, ensuring the template structure is correct.
      The **DELETE** endpoint must verify that the requesting user is
      the owner of the template.

  3.  **UI for Template Management:** Build a full-page interface under
      a **/templates** route or a large modal. This UI will feature a
      list view of templates with search/filter controls and buttons for
      creating a new template. Clicking a template could show its
      details in a side panel.

  4.  **Variable Substitution:** Implement a client-side
      function **applyTemplate(template, context)**. This function will
      take the template string and use a simple regex or string
      replacement to substitute the **{{variable}}** placeholders with
      data from the current context (e.g., selected file paths, code
      snippets).

**Feature 5: Advanced Git & Ignore Support**

- **Feature Goal:** To deeply integrate with the user's version control
  practices by not only parsing ignore files but also by providing
  context-aware features related to the Git repository state, ensuring
  the AI context is always relevant and clean.

- **API Relationships:** This feature remains entirely client-side,
  leveraging local file system access and potentially a WASM-compiled
  version of Git to read repository data without involving a backend.

- **Detailed Feature Requirements:**

  1.  **Comprehensive Ignore Parsing (Expansion of Feature 1):**

      - The system must correctly handle nested **.gitignore** files.
        Rules in a subdirectory's **.gitignore** apply to that
        directory and its children.

      - The UI must provide a visual indicator for *why* a file is
        ignored (e.g., a tooltip on the grayed-out file saying "Ignored
        by rule ***.log** in root .gitignore").

  2.  **Git Status Awareness:**

      - The file explorer must visually indicate the Git status of each
        file (Modified, New, Untracked, Staged). This can be done with
        color-coding the file name or adding a status letter (M, A, U)
        next to it, similar to VS Code.

      - This requires parsing the output of **git status** or reading
        the **.git** directory index.

  3.  **Context Scoping by Git Diff:**

      - A powerful new feature: A toggle/button "Use Git Staged as
        Context" or "Use Last Commit as Context".

      - When activated, this will automatically select only the files
        that have been modified (or staged) according to Git.

      - This is incredibly useful for tasks like "Write commit messages
        for my staged changes" or "Review the code I've just
        modified."

- **Detailed Implementation Guide:**

  1.  **WASM-Powered Git:** To avoid needing a local Git installation on
      the user's machine, integrate a library like **isomorphic-git**,
      which can read and interpret Git repositories directly from the
      file system handle provided by the browser. This runs entirely in
      the browser sandbox.

  2.  **File Status Logic:**

      - Use **isomorphic-git**'s **statusMatrix** function to get a
        detailed list of all files and their working directory vs. index
        status.

      - Create a mapping from file path to Git status.

      - The file tree component will consume this mapping and apply the
        appropriate CSS classes for styling (e.g., **color-green** for
        new, **color-orange** for modified).

  3.  **Context Scoping Implementation:**

      - When the "Use Git Staged as Context" button is clicked, call
        the **isomorphic-git** status function.

      - Iterate through the results and programmatically update the
        application's selection state to include only the files marked
        as "staged" (or "modified").

      - This should be a "one-shot" action that sets the selection,
        which the user can then further modify if needed.

**Architect-Recommended & Future-Proofing Features**

The following features are designed to elevate the application from a
utility to an indispensable, intelligent platform.

**Feature 6: Real-time Multi-User Editing & Collaboration (Team
Workspaces)**

- **Feature Goal:** To enable teams to collaborate on complex prompt
  engineering tasks in real-time. This transforms the tool from a solo
  utility into a collaborative hub for team-wide AI interaction.

- **API Relationships:** This requires a significant backend and
  real-time infrastructure.

  - **WebSockets:** A WebSocket gateway is needed to handle real-time
    communication.

  - **POST /api/workspaces**: Create a new shared workspace.

  - **POST /api/workspaces/{workspaceId}/invite**: Invite users to a
    workspace.

  - All context and prompt-related APIs would need to be nested under a
    workspace context, e.g., **GET
    /api/workspaces/{workspaceId}/templates**.

- **Detailed Feature Requirements:**

  1.  **Team Workspaces:** Users can create workspaces and invite team
      members. A workspace shares templates, prompt history, and
      billing.

  2.  **Real-time Context Syncing:** When multiple users are in the same
      "session," their file selections, context builder items, and
      instructions should be synchronized in real-time.

  3.  **Presence Indicators:** The UI should show the avatars of other
      users currently active in the session.

  4.  **Collaborative Cursors/Selections:** (Advanced) Show other
      users' cursors and text selections within the instruction
      textareas.

  5.  **Shared Prompt History:** All prompts run within a workspace
      session are logged to a shared history, allowing team members to
      see, fork, and learn from each other's work.

- **Detailed Implementation Guide:**

  1.  **Real-time Backend:** Use a service like Liveblocks, PartyKit, or
      a self-hosted solution with WebSockets and a pub/sub system (like
      Redis).

  2.  **CRDTs for Text:** For real-time text editing, use a
      Conflict-free Replicated Data Type (CRDT) library like Y.js. This
      ensures that concurrent edits merge correctly without conflicts.
      The state of the textareas would be managed by Y.js.

  3.  **State Synchronization:** The application's state (file
      selection, etc.) would be broadcast over the WebSocket connection.
      When a user joins, they receive the current full state.
      Subsequently, only diffs/patches of the state are sent to minimize
      network traffic.

  4.  **Authentication & Authorization:** The backend must have robust
      authorization checks to ensure a user can only access workspaces
      they are a member of and perform actions based on their role
      (e.g., admin, editor, viewer).

**Feature 7: Enhanced Analytics & Usage Insights**

- **Feature Goal:** To provide users and teams with actionable data on
  their prompting habits, helping them understand what works, optimize
  costs, and improve their AI interaction skills.

- **API Relationships:**

  - **POST /api/analytics/log**: An internal endpoint to log every
    prompt execution event.

  - **GET /api/analytics/dashboard**: An authenticated endpoint to fetch
    aggregated analytics data for the user or team.

- **Detailed Feature Requirements:**

  1.  **Personal Dashboard:** Each user gets a dashboard showing:

      - **Token Consumption:** Charts showing token usage over time,
        broken down by model.

      - **Cost Estimation:** An estimated cost based on public pricing
        for the models used.

      - **Most Used Templates:** A list of their most frequently used
        prompt templates.

      - **Prompt Success Rate:** (Advanced) Users can optionally mark a
        prompt's output as "successful" or "failed," and the system
        tracks this rate over time.

  2.  **Team Dashboard (for Workspaces):** Workspace admins can see
      aggregated data for the entire team, helping them manage costs and
      identify power users or areas for training.

  3.  **Prompt Performance Analysis:** For a given prompt, show its
      history of runs, including which models were used, the token
      counts, and the success ratings, allowing for A/B testing of
      prompts.

- **Detailed Implementation Guide:**

  1.  **Data Logging:** The backend service that executes or logs the
      prompt run must save detailed metadata to
      an **analytics_events** table: **user_id**, **workspace_id**, **model_used**, **input_tokens**, **output_tokens**, **estimated_cost**, **template_id_used**, **timestamp**, **user_marked_success** (boolean).

  2.  **Data Aggregation:** Create a separate, optimized analytics
      database (e.g., a read replica or a data warehouse like ClickHouse
      for high-volume events). Run periodic jobs (e.g., every hour) to
      pre-aggregate the raw event data into summary tables to make
      dashboard queries fast.

  3.  **Visualization:** Use a charting library like Recharts or
      Chart.js on the frontend to render the data fetched from
      the **/api/analytics/dashboard** endpoint.

**Feature 8: Advanced Code Map & Call Graph Visualizations**

- **Feature Goal:** To move beyond simple file trees and provide deep,
  semantic understanding of the codebase through interactive call graphs
  and dependency maps.

- **API Relationships:** This remains a client-side-focused feature, but
  the complexity of analysis justifies more advanced tooling.

- **Detailed Feature Requirements:**

  1.  **Inter-file Call Graphs:** Generate a diagram showing how
      functions and classes across different selected files call each
      other. This is invaluable for understanding control flow in a
      complex feature.

  2.  **Dependency
      Visualization:** Parse **package.json** and **import** statements
      to create a dependency graph, showing the relationships between
      internal modules and external libraries.

  3.  **"Focus" Mode:** Allow a user to right-click a function or
      class in the code preview and select "Show Call Graph." This
      would generate a new diagram centered on that specific node,
      showing what calls it and what it calls.

  4.  **Data Flow Analysis:** (Highly Advanced) Visualize how a specific
      variable or data structure is passed between functions.

- **Detailed Implementation Guide:**

  1.  **Advanced AST Analysis:** This requires more than just parsing.
      After generating the AST for all selected files, a second analysis
      pass is needed to resolve symbols and build a graph data
      structure.

      - **Step 1: Symbol Table:** Create a table of all declared
        functions, classes, and variables in the context.

      - **Step 2: Reference Resolution:** Traverse the ASTs again. For
        every function call or variable usage, look it up in the symbol
        table to find its origin.

      - **Step 3: Graph Construction:** Build a graph where nodes are
        functions/classes and edges represent calls or dependencies.

  2.  **Graph Visualization Library:** While Mermaid is good for simple
      diagrams, a more powerful library
      like **d3.js** or **react-flow** would be needed for these
      complex, interactive graphs. These libraries provide more control
      over layout (e.g., force-directed graphs) and custom node
      rendering.

  3.  **Performance:** All of this analysis must run in a Web Worker.
      For very large contexts, the UI should show a progress indicator
      and potentially offer a simplified analysis first, with a button
      to "Run Deeper Analysis."
