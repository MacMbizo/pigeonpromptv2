**1. Design Philosophy & Strategy**

As Alex, the Lead Product Designer for PigeonPrompt, my vision is to
craft a UI/UX that is not only visually appealing but also deeply
functional and intuitive for our target audience of AI enthusiasts,
developers, and content creators. The design will be a seamless blend of
modern aesthetics and robust usability, ensuring that every interaction
feels purposeful and efficient. We will leverage the power of our chosen
tech stack (Next.js, Tailwind CSS, Shadcn/ui) to build a system that is
both beautiful and technically sound, ready for AI code generation.

**1.1 Brand Personality & Tone**

Our brand personality for PigeonPrompt is built on the following
keywords:

- **Intelligent:** Reflecting the advanced nature of AI and the
  thoughtful design of our platform.

- **Accessible:** Ensuring ease of use for both technical and
  non-technical users.

- **Efficient:** Streamlining the prompt management workflow to save
  users time.

- **Collaborative:** Fostering a community where users can share and
  benefit from collective knowledge.

- **Professional:** A clean, polished aesthetic that inspires trust and
  credibility.

- **Empowering:** Providing users with the tools to master AI
  interactions.

**Voice & Tone Guidelines for UI copy:**

Our language will be clear, concise, and encouraging. We aim to be
helpful and supportive, never condescending. Technical terms will be
explained when first introduced, balancing precision with accessibility.

**1.2 Target Audience Personas (Detailed)**

**Primary: The AI Enthusiast/Developer**

- **Demographics:** Age 25-40, predominantly male, technical background
  (software engineers, data scientists, researchers), early adopters of
  new AI technologies.

- **Pain Points:**

  - Struggling to craft effective and consistent prompts for various AI
    models.

  - Lack of version control for prompt iterations, leading to lost
    progress or difficulty tracking improvements.

  - Time-consuming process of creating prompts from scratch for new use
    cases.

  - Difficulty organizing and sharing personal prompt libraries.

- **Goals:**

  - Increase productivity and efficiency in AI-driven workflows.

  - Build a robust, searchable personal library of high-quality prompts.

  - Share expertise and contribute to a community of like-minded
    individuals.

  - Stay updated on best practices and new prompt engineering
    techniques.

- **Preferred Interaction Patterns:** Keyboard shortcuts for rapid
  navigation and actions, bulk operations for managing multiple prompts,
  detailed metadata views, code-like interfaces for prompt content.

- **Device Usage:** Primarily desktop (large monitors, multiple screens)
  for deep work, occasional mobile for quick discovery or sharing on the
  go.

**Secondary: The Content Creator/Marketer**

- **Demographics:** Age 28-45, balanced gender representation,
  marketing, writing, or creative background, growing interest in
  leveraging AI for content generation.

- **Pain Points:**

  - Inconsistent AI outputs due to poorly formulated prompts.

  - Lack of prompt templates specifically tailored for marketing copy,
    social media, or creative writing.

  - Difficulty maintaining brand voice and consistency across
    AI-generated content.

  - Struggling to scale content creation without compromising quality.

- **Goals:**

  - Streamline content creation processes using AI.

  - Access a library of proven, high-quality prompt templates for
    various content types.

  - Ensure brand consistency and quality in AI-generated outputs.

  - Scale creative output efficiently.

- **Preferred Interaction Patterns:** Visual feedback on prompt
  effectiveness, easy-to-use templates, collaborative features for team
  workflows, intuitive search and filtering.

- **Device Usage:** Desktop and tablet for content creation, mobile for
  inspiration browsing and quick edits.

**Tertiary: The Prompt Engineer/Educator**

- **Demographics:** Age 30-50, strong AI/ML background, often in
  teaching, training, or consulting roles.

- **Pain Points:**

  - Organizing and structuring prompt engineering curricula.

  - Tracking student or team progress in prompt development.

  - Sharing best practices and advanced techniques effectively.

  - Lack of tools for demonstrating prompt variations and their
    outcomes.

- **Goals:**

  - Create comprehensive and structured educational content around
    prompt engineering.

  - Build and manage structured prompt libraries for teaching purposes.

  - Mentor and guide others in developing effective AI interaction
    skills.

  - Demonstrate the impact of prompt variations and versioning.

- **Preferred Interaction Patterns:** Detailed analytics on prompt usage
  and effectiveness, export capabilities for curriculum development,
  annotation features for explaining prompt nuances,
  presentation-friendly interfaces.

- **Device Usage:** Primarily desktop for content creation and teaching,
  projection/presentation needs for classrooms or workshops, mobile for
  personal reference.

**1.3 Core Design Principles**

1.  **Clarity Over Clutter:** Every element on the screen must serve a
    purpose. We will prioritize clear information hierarchy, intuitive
    navigation, and ample whitespace to reduce cognitive load.

2.  **Efficiency Through Flow:** The user journey should be seamless and
    logical. We will optimize common workflows (e.g., prompt creation,
    discovery, copying) to minimize steps and maximize productivity.

3.  **Confidence Through Consistency:** A consistent visual language and
    interaction patterns across the entire application will build user
    trust and reduce the learning curve. This includes consistent
    component states, typography, and spacing.

4.  **Delight in the Details:** Subtle animations, thoughtful
    micro-interactions, and encouraging microcopy will create a positive
    and engaging user experience, fostering a sense of craftsmanship and
    care.

**1.4 Microcopy & Messaging Guidelines**

Our microcopy will be:

- **Concise:** Get straight to the point.

- **Action-oriented:** Guide the user on what to do next.

- **Supportive:** Reassure users and provide help when needed.

- **On-brand:** Reflect the intelligent, accessible, and empowering
  personality of PigeonPrompt.

**Tone Examples:**

- **Success:** \"Great job! Your prompt has been saved and is ready to
  use.\" or \"Prompt copied to clipboard!\"

- **Error:** \"Oops! We couldn\'t save your prompt. Please check your
  connection and try again.\" or \"Invalid input. Please review the
  highlighted fields.\"

- **Empty State:** \"No prompts here yet. Ready to create your first
  one?\" or \"Your search didn\'t find any matches. Try broadening your
  criteria!\"

- **Loading:** \"Crafting something awesome\...\" or \"Just a moment
  while we fetch your prompts\...\"

- **Tooltip:** \"Click to copy this prompt to your clipboard.\"

- **Form Error:** \"Title is required.\" or \"Content cannot exceed
  10,000 characters.\"

**1.5 Content Strategy & Voice**

- **Technical Language Policy:** We will balance accessibility with
  precision. While we cater to AI enthusiasts, we will avoid overly
  jargon-filled language where simpler terms suffice. When technical AI
  terms are necessary, they will be introduced clearly, potentially with
  tooltips for further explanation.

- **Emotional Tone:** Encouraging and supportive, never condescending.
  We want users to feel empowered and successful in their AI endeavors.

- **Internationalization Notes:** Design will account for potential
  future localization. This includes considering text expansion (e.g.,
  German words are often longer than English), right-to-left (RTL)
  languages, and cultural nuances in iconography and imagery. Layouts
  will be flexible enough to accommodate varying text lengths.

**2. Design System Foundations (The Atoms)**

Our design system is built on a robust set of design tokens, ensuring
consistency and easy translation into code, particularly with Tailwind
CSS and Shadcn/ui.

**2.1 Color System**

Our color system is meticulously crafted to reflect our brand identity
while ensuring accessibility and usability.

- **Primary Palette:**

  - **Deep Purple:** **#7c3aed** (Primary brand color)

  - **Electric Blue:** **#3b82f6** (Secondary brand color)

  - **Gradient:** **linear-gradient(135deg, #7c3aed 0%, #3b82f6
    100%)** - This gradient will be the cornerstone of our primary
    calls-to-action and hero elements.

- **Secondary & Accent Palette:**

  - **Light Purple:** **#a78bfa** (For subtle accents, hover states on
    secondary elements)

  - **Light Blue:** **#93c5fd** (For subtle accents, hover states on
    secondary elements)

  - **Dark Purple:** **#6d28d9** (For active states, darker accents)

  - **Dark Blue:** **#2563eb** (For active states, darker accents)

- **Semantic Palette:**

  - **Success:** **#10b981** (Green) - For positive feedback, successful
    operations.

  - **Warning:** **#f59e0b** (Orange) - For cautionary messages,
    non-critical alerts.

  - **Error:** **#ef4444** (Red) - For critical errors, destructive
    actions.

  - **Info:** **#3b82f6** (Blue) - For informational messages, general
    notifications.

- **Neutral Palette:** A slightly cool grayscale ramp to complement the
  vibrant primary gradient, creating a professional and focused
  atmosphere.

  - **Gray 50:** **#f9fafb** (Lightest background, subtle borders)

  - **Gray 100:** **#f3f4f6** (Light backgrounds, disabled states)

  - **Gray 200:** **#e5e7eb** (Borders, dividers)

  - **Gray 300:** **#d1d5db** (Input borders, subtle text)

  - **Gray 400:** **#9ca3af** (Placeholder text, secondary icons)

  - **Gray 500:** **#6b7280** (Body text, primary icons)

  - **Gray 600:** **#4b5563** (Stronger body text, headings)

  - **Gray 700:** **#374151** (Darker headings, primary text)

  - **Gray 800:** **#1f2937** (Darkest text, backgrounds in dark mode)

  - **Gray 900:** **#111827** (Deepest backgrounds in dark mode)

- **Color Usage Rules:**

  - **Primary Gradient:** Reserved for main calls-to-action, hero
    elements, and brand highlights. Avoid overuse to maintain impact.

  - **Semantic Colors:** Strictly for their defined purposes (success,
    warning, error, info).

  - **Neutral Palette:** Used for text, backgrounds, borders, and
    dividers. Provides structure and readability.

  - **Accessibility:** All text and interactive elements must meet WCAG
    2.1 AA contrast ratios (minimum 4.5:1 for small text, 3:1 for large
    text/graphics). Automated tools will be used, and manual checks
    performed for gradients.

  - **Forbidden:** No yellow tones are to be used anywhere in the UI.

**2.1.1 Performance & Technical Specifications**

- **Gradient Rendering:** For browsers that do not fully support linear
  gradients, a fallback solid color (e.g., **#7c3aed**) will be
  provided.

- **Print Styles:** All brand colors will have defined grayscale
  equivalents for optimal print readability.

- **High Contrast Mode:** An alternative color scheme will be provided
  for users with visual impairments, ensuring all information is
  conveyed without relying solely on color.

- **Animation Performance:** Colors are chosen to be suitable for 60fps
  animations, avoiding complex or expensive gradient transitions that
  could hinder performance.

- **CSS Custom Properties:** All colors will be exposed as CSS variables
  (design tokens) for easy theming and consistent application across the
  codebase.

  - **\--color-primary-purple: #7c3aed;**

  - **\--color-primary-blue: #3b82f6;**

  - **\--color-success: #10b981;**

  - **\--color-error: #ef4444;**

  - **\--color-neutral-50: #f9fafb;** (and so on for all grays)

**2.2 Typography System**

Our typography system prioritizes readability and clear hierarchy, using
a modern sans-serif font for UI elements and a distinct monospace font
for code-like content.

- **Font Families:**

  - **Primary UI Font:** **Inter**, **system-ui**, **sans-serif** (for
    all general UI text, headings, body copy).

  - **Monospace Font:** **\'Fira Code\'**, **\'Courier
    New\'**, **monospace** (for prompt content, code snippets, and any
    fixed-width text).

- **Type Scale (Desktop):**

  ------------------------------------------------------------------------
  Element         Size (px)   Line Height (px)      Font Weight
  --------------- ----------- --------------------- ----------------------
  H1              32          40                    700 (Bold)

  H2              24          32                    600 (Semi-bold)

  H3              20          28                    600 (Semi-bold)

  H4              18          26                    500 (Medium)

  Body Large      18          28                    400 (Regular)

  Body            16          24                    400 (Regular)

  Body Small      14          20                    400 (Regular)

  Caption         12          16                    400 (Regular)
  ------------------------------------------------------------------------

- **Type Scale (Mobile - under 768px):**

  - H1: 28px / 36px / 700

  - H2: 22px / 30px / 600

  - H3: 18px / 26px / 600

  - H4: 16px / 24px / 500

  - Body Large: 16px / 26px / 400

  - Body: 15px / 22px / 400

  - Body Small: 13px / 18px / 400

  - Caption: 11px / 14px / 400

- **Styling & Usage:**

  - **Alignment:** Left-aligned by default for readability. Centered
    text used sparingly for titles or short statements.

  - **Character Spacing:** Default browser spacing. No custom
    letter-spacing unless for specific, large display text.

  - **Weights:** Use defined weights consistently. Bold for emphasis,
    semi-bold for subheadings, regular for body copy.

  - **Monospace:** Used exclusively for prompt content, code examples,
    and any fixed-width text to ensure consistent character alignment.

**2.3 Spacing & Grid System**

A consistent spacing system is crucial for visual harmony and
predictability.

- **Base Unit & Scale:** We will use a **4px base unit** for all
  spacing, allowing for precise and consistent alignment.

  - **space-xs**: 4px

  - **space-sm**: 8px

  - **space-md**: 16px

  - **space-lg**: 24px

  - **space-xl**: 32px

  - **space-2xl**: 48px

  - **space-3xl**: 64px

  - **space-4xl**: 80px

  - **space-5xl**: 96px

- **Layout Grid:**

  - **Column Count:** A 12-column grid system will be used for main
    content areas, providing flexibility for various layouts.

  - **Gutter Widths:** 24px between columns.

  - **Max Container Widths:**

    - **Mobile:** 100% width, with 16px horizontal padding.

    - **Tablet (768px - 1024px):** Max width 720px, centered.

    - **Desktop (1024px - 1280px):** Max width 960px, centered.

    - **Wide Desktop (1280px+):** Max width 1200px, centered.

- **Breakpoints:**

  - **sm**: 640px (Small mobile landscape)

  - **md**: 768px (Tablet portrait)

  - **lg**: 1024px (Desktop)

  - **xl**: 1280px (Large Desktop)

  - **2xl**: 1536px (Extra Large Desktop)

**2.4 Iconography**

Icons will be clean, modern, and easily recognizable, complementing our
minimalist aesthetic.

- **Icon Style:** Line-based, simple, and consistent. We will primarily
  use icons from **Lucide** or **Heroicons** for their clean aesthetic
  and comprehensive library.

- **Usage Guidelines:**

  - **Sizing:** Icons will typically be 16px, 20px, or 24px, scaled
    proportionally.

  - **Color:** Default to **Gray 500** for general use. Use **Gray
    700** for emphasis or primary actions. Semantic colors (Success,
    Error, Info) for status indicators. Primary gradient for
    brand-specific icons or active states.

  - **Placement:** Always align icons visually with accompanying text.
    Use **space-xs** (4px) or **space-sm** (8px) for spacing between
    icon and text.

**2.5 Effects & Styles**

Subtle effects will add depth and interactivity without distracting the
user.

- **Border Radius:**

  - **rounded-sm**: 2px (for small elements, e.g., badges)

  - **rounded-md**: 6px (default for buttons, inputs, cards)

  - **rounded-lg**: 10px (for larger containers, modals)

  - **rounded-full**: 9999px (for avatars, pills)

- **Shadows:** A set of elevation styles using **box-shadow** to create
  subtle depth and hierarchy.

  - **shadow-sm**: **0 1px 2px 0 rgba(0, 0, 0, 0.05)** (for subtle lift,
    e.g., on hover)

  - **shadow-md**: **0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px
    rgba(0, 0, 0, 0.06)** (default for cards)

  - **shadow-lg**: **0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px
    rgba(0, 0, 0, 0.05)** (for modals, dropdowns)

  - **shadow-xl**: **0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px
    -5px rgba(0, 0, 0, 0.04)** (for prominent elements, e.g., hero
    cards)

  - **Glow Effect (Primary Button Hover):** A custom shadow that uses
    the primary purple color, creating a soft, blurred halo effect.
    Example: **0 0 15px rgba(124, 58, 237, 0.4)**

**2.6 Design Tokens**

All design decisions will be codified into design tokens, making them
easily consumable by developers and AI code generation systems.

- **Colors:**

  - **\--color-primary-purple: #7c3aed;**

  - **\--color-primary-blue: #3b82f6;**

  - **\--color-success: #10b981;**

  - **\--color-error: #ef4444;**

  - **\--color-neutral-50: #f9fafb;** \... **\--color-neutral-900:
    #111827;**

- **Typography:**

  - **\--font-family-sans: \'Inter\', system-ui, sans-serif;**

  - **\--font-family-mono: \'Fira Code\', \'Courier New\', monospace;**

  - **\--font-size-h1: 32px;** **\--line-height-h1:
    40px;** **\--font-weight-h1: 700;** (and so on for all type scale
    elements)

- **Spacing:**

  - **\--space-xs: 4px;** **\--space-sm: 8px;** \... **\--space-5xl:
    96px;**

- **Border Radius:**

  - **\--radius-sm: 2px;** **\--radius-md: 6px;** **\--radius-lg:
    10px;** **\--radius-full: 9999px;**

- **Shadows:**

  - **\--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);** (and so on for
    all shadow levels)

- **Animation:**

  - **\--transition-duration-fast: 150ms;**

  - **\--transition-duration-normal: 300ms;**

  - **\--ease-out: cubic-bezier(0.25, 0.8, 0.25, 1);**

**2.7 Dark Mode Palette**

Dark mode will provide a comfortable viewing experience in low-light
conditions, maintaining brand consistency.

- **Backgrounds:** Neutral Grays will be inverted, using darker shades
  for backgrounds and lighter shades for text.

  - **\--color-background-dark: #111827;** (Gray 900)

  - **\--color-background-card-dark: #1f2937;** (Gray 800)

  - **\--color-background-subtle-dark: #374151;** (Gray 700)

- **Text:** Lighter grays for text.

  - **\--color-text-primary-dark: #f9fafb;** (Gray 50)

  - **\--color-text-secondary-dark: #d1d5db;** (Gray 300)

  - **\--color-text-placeholder-dark: #9ca3af;** (Gray 400)

- **Primary Gradient:** The gradient will remain the same, but its
  contrast against the dark background will be carefully checked to
  ensure readability and vibrancy.

- **Semantic Colors:** Will be slightly adjusted to maintain vibrancy
  and contrast on dark backgrounds.

- **Components:**

  - **Buttons:** Primary buttons will retain their gradient. Secondary
    buttons will have a lighter border and text.

  - **Cards:** Will
    use **\--color-background-card-dark** with **\--shadow-md**.

  - **Modals:** Will
    use **\--color-background-card-dark** with **\--shadow-lg**.

**2.8 Motion & Animation**

Subtle and purposeful motion will enhance the user experience, providing
feedback and guiding attention.

- **Easing Curves:**

  - **ease-out**: **cubic-bezier(0.25, 0.8, 0.25, 1)** (for most UI
    transitions, smooth start, gentle end)

  - **ease-in-out**: **cubic-bezier(0.42, 0, 0.58, 1)** (for elements
    that move in and out)

- **Durations:**

  - **fast**: 150ms (for quick feedback, e.g., button presses)

  - **normal**: 300ms (for most component transitions, e.g., hover
    states, modal fades)

  - **slow**: 500ms (for more deliberate transitions, e.g., page
    transitions)

- **Rules for Interactive Feedback:**

  - **Button Press:** Scale down slightly (**scale(0.98)**)
    with **fast** duration.

  - **Hover States:** Subtle color shifts or shadow changes
    with **normal** duration.

  - **Modals:** Fade in and scale up
    from **scale(0.95)** to **scale(1)** with **normal** duration.

- **Motion Usage Principles:** Animations should be used to:

  - Provide immediate feedback to user actions.

  - Guide the user\'s eye to important information.

  - Enhance the sense of direct manipulation.

  - Avoid unnecessary or distracting animations. Users
    with **prefers-reduced-motion** will receive simplified transitions.

**2.9 Illustrations & Imagery**

Illustrations will be used sparingly to enhance understanding and add
personality.

- **Style:** Clean, modern line art with subtle fills, using the
  brand\'s primary purple and blue, and a limited palette of neutral
  grays. No complex, photorealistic imagery.

- **Color Usage:** Illustrations will primarily use the Deep Purple and
  Electric Blue, with accents from the neutral palette. No yellow tones.

- **Where to Use:** Empty states, onboarding screens, hero sections, and
  occasional blog/marketing content.

**2.10 Audio / Haptics Guidelines**

Audio cues will be used minimally and purposefully to provide non-visual
feedback.

- **When to Use:**

  - **Success:** A subtle, positive chime for successful actions (e.g.,
    prompt copied, form submitted).

  - **Error:** A short, distinct sound for critical errors (e.g., failed
    submission).

- **Volume and Tone:** Sounds should be low-volume, non-intrusive, and
  pleasant. Avoid harsh or startling sounds.

- **Haptics:** Not a primary focus for the web application, but
  considered for future mobile app development (e.g., subtle vibrations
  for successful actions).

**3. Component Library (The Molecules & Organisms)**

This section details the visual anatomy, states, variants, and usage
rules for key UI components. All components will adhere to the defined
design tokens and accessibility standards.

**3.1 Buttons**

All buttons will have a consistent height of 40px (for standard size)
and a **rounded-md** (6px) border radius. Padding will be **px-4 py-2**
to ensure ample touch targets.

**1. Primary Button (The \"Do It\" Button)**

- **Visual Anatomy:** A button consists of a container
  with **rounded-md** corners, a text label, and an optional icon
  positioned to the left or right of the label. The padding within the
  button must be generous enough for easy clicking on touch devices.

- **Use Case:** For the main call-to-action on a page or in a modal
  (e.g., \"Create Prompt,\" \"Save Changes,\" \"Upgrade Now\").

- **States:**

  - **Default State:** Container has a **linear-gradient(135deg, #7c3aed
    0%, #3b82f6 100%)** background. Text is **white
    (#FFFFFF)**, **font-weight: 700** (Bold).

  - **Hover State:** The gradient slightly shifts or brightens (e.g., by
    5% lightness). A soft, blurred shadow in the primary purple color
    appears, giving it a \"glow\" effect to signify
    interactivity. **box-shadow: 0 0 15px rgba(124, 58, 237, 0.4);** The
    cursor becomes a **pointer**. Transition: **transition-all
    duration-normal ease-out**.

  - **Focus State:** A visible, solid outline/ring (2px) in the primary
    Electric Blue (**#3b82f6**) appears around the button, ensuring
    clear keyboard navigation accessibility. **outline: 2px solid
    #3b82f6; outline-offset: 2px;**.

  - **Active State:** When clicked, the button scales down slightly
    (**transform: scale(0.98)**) and an inner shadow is applied to give
    a \"pressed\" feel. **box-shadow: inset 0 2px 4px
    rgba(0,0,0,0.1);**. Transition: **transition-transform duration-fast
    ease-out**.

  - **Disabled State:** The gradient background is desaturated and
    opacity is reduced to 50%. The text color remains white but with
    reduced opacity. The cursor changes to **not-allowed**.

  - **Loading State:** The text label is replaced by a centered,
    spinning loader icon (white, 20px). The button\'s dimensions remain
    fixed to prevent layout shifts.

**2. Secondary Button (The \"Also Consider\" Button)**

- **Use Case:** For secondary actions that are important but not primary
  (e.g., \"Cancel,\" \"View History,\" \"Export\").

- **States:**

  - **Default State:** Transparent background with a solid 1px border in
    the primary Deep Purple (**#7c3aed**). Text is colored with the same
    purple.

  - **Hover State:** The background fills with a very light,
    semi-transparent purple (**rgba(124, 58, 237, 0.1)**). The border
    and text become slightly darker (**#6d28d9**).

  - **Focus State:** A visible blue ring, same as the primary button.

  - **Active State:** The background fill becomes slightly more opaque
    (**rgba(124, 58, 237, 0.2)**).

  - **Disabled State:** Border and text are **Gray 300**. Opacity is
    reduced to 50%. Cursor is **not-allowed**.

**3. Tertiary/Ghost Button (The \"Subtle Action\" Button)**

- **Use Case:** For low-emphasis actions, often within cards or tables
  (e.g., \"Share,\" \"Discuss\").

- **States:**

  - **Default State:** No background, no border. Text is **Gray 500**.

  - **Hover State:** The text color changes to the primary Deep Purple
    (**#7c3aed**) and a very light gray background appears (**Gray
    100**).

  - **Focus State:** A visible blue ring.

  - **Active State:** The light gray background becomes slightly darker
    (**Gray 200**).

**4. Destructive Button (The \"Be Careful\" Button)**

- **Use Case:** For actions that delete data or are irreversible (e.g.,
  \"Delete Prompt,\" \"Delete Account\").

- **Variants:**

  - **Solid Red:** **background: #ef4444; text: white;** (for high
    warning).

  - **Outline Red:** **background: transparent; border: 1px solid
    #ef4444; text: #ef4444;** (for lower warning).

- **States:** Follow the same logic as Primary/Secondary buttons but
  using the semantic Error Red color (**#ef4444**) for all states.

**3.2 Form Elements**

All form elements will share a consistent height of 40px, **rounded-md**
(6px) border radius, and a clear focus state. Font size will be 16px to
prevent mobile zoom.

- **Inputs (Text, Email, Password) & Textareas:**

  - **Anatomy:** Container with a **Gray 50** background, a 1px solid
    border (**Gray 300**), and placeholder text in **Gray 400**.
    Padding: **px-3 py-2**.

  - **Default State:** As described above.

  - **Hover State:** The border color subtly darkens to **Gray 400**.

  - **Focus State:** The border becomes 2px thick and changes to the
    primary Electric Blue (**#3b82f6**). Any associated label also
    changes to this color. **outline: none; box-shadow: 0 0 0 2px
    #3b82f6;**.

  - **Error State:** The border becomes 2px thick and changes to the
    semantic Error Red (**#ef4444**). An error message in the same red
    color (**font-size: 12px;**) appears below the input.

  - **Disabled State:** The background becomes **Gray 100**, and the
    text color is muted to **Gray 400**. Cursor: **not-allowed**.

- **Selects (Dropdowns):**

  - **Anatomy:** Styled identically to Inputs but with a chevron-down
    icon (20px, **Gray 500**) on the right side. The dropdown panel
    itself should have a **shadow-lg** and match the application\'s
    theme (**Gray 50** background, **Gray 200** borders).

- **Checkboxes:**

  - **Anatomy:** A small, **rounded-sm** (2px) square container (18px x
    18px) next to a text label (**Body Small**).

  - **Unchecked State:** A 1px **Gray 300** border.
    Background: **white**.

  - **Checked State:** The container background fills with the
    purple-to-blue gradient. A white checkmark icon (12px) appears
    inside.

  - **Focus State:** A visible blue ring (**outline: 2px solid #3b82f6;
    outline-offset: 2px;**) appears around the checkbox container.

- **Toggles (Switches):**

  - **Anatomy:** A pill-shaped track (40px width, 24px
    height, **rounded-full**) with a circular nub (20px
    diameter, **rounded-full**).

  - **Off State:** The track is **Gray 300**. The nub is **white** with
    a **shadow-sm**.

  - **On State:** The track fills with the primary Deep Purple
    (**#7c3aed**). The nub remains **white** and slides to the right.

  - **Focus State:** A visible blue ring (**outline: 2px solid #3b82f6;
    outline-offset: 2px;**) appears around the entire toggle component.

**3.3 Cards**

Cards are the primary containers for content, providing visual
separation and organization. All cards will have **rounded-md** (6px)
corners and a **shadow-md**.

**1. Prompt Card (The Core Component)**

- **Anatomy:** A container with a **white** (**Gray 50** in dark mode)
  background and a subtle **Gray 200** border. Divided into three
  sections:

  - **Header:** Contains the prompt title (**H4**, **font-weight:
    600**), and a cluster of Pills on the right for platform
    compatibility (e.g., \"ChatGPT,\" \"Claude\").

  - **Body:** A snippet of the prompt\'s description or content (**Body
    Small**, **Gray 600**), truncated with an ellipsis after 2-3 lines.

  - **Footer:** A row containing two groups. Left group: stats icons
    (e.g., star for rating, copy icon for usage) and numbers
    (**Caption**, **Gray 500**). Right group: a Secondary Button for
    \"Copy\" and a Tertiary/Ghost kebab menu button for more actions
    (View, Share, History).

- **States:**

  - **Default:** As described.

  - **Hover:** The card lifts with an enhanced **shadow-lg**, and

Continue.

a subtle border in the primary purple appears to indicate it\'s
interactive.

**2. Stat Cards (Dashboard)**

- **Anatomy:** Smaller, simpler cards (e.g., 200px x 120px). They
  contain a large, bold number (**H2**), a descriptive title below it
  (**Body**), and an optional icon (24px, **Gray 500**). The background
  can have a very subtle version of the brand gradient
  (**linear-gradient(45deg, rgba(124, 58, 237, 0.05) 0%, rgba(59, 130,
  246, 0.05) 100%)**) to make them stand out.

- **States:**

  - **Default:** As described.

  - **Hover:** A slight increase in **shadow-md** and a subtle border
    in **Gray 300**.

**3. User Profile Cards**

- **Anatomy:** Used in community sections. Contains a user\'s circular
  avatar (48px diameter), their username (**Body**, **font-weight:
  600**), and their reputation score displayed in a prominent Badge.

- **States:**

  - **Default:** As described.

  - **Hover:** A subtle **shadow-sm** to indicate interactivity.

**3.4 Navigation**

Navigation elements are designed for clarity, consistency, and ease of
use across different screen sizes.

**1. Header**

- **Anatomy:** A full-width bar at the top (64px height) with a
  subtle **Gray 200** bottom border. It contains:

  - **Logo:** (left) The PigeonPrompt logo, a combination of the brand
    icon and wordmark.

  - **Primary Navigation
    Links:** (center) **Workspace**, **Discover**, **Analytics**, **Settings**.
    These are **Body** text, **Gray 600**.

  - **Global Search Bar:** (center/right) A prominent input field with a
    search icon, styled like a standard input.

  - **User Profile Dropdown:** (far right) With the user\'s circular
    avatar (32px diameter).

- **Active State:** The active navigation link must be clearly indicated
  with **font-weight: 700** (Bold) and a 2px solid underline in the
  primary Deep Purple (**#7c3aed**).

**2. Collapsible Sidebar**

- **Anatomy:** Positioned on the left. It lists user-created folders and
  main categories. Each item has an icon (16px), a label (**Body**), and
  a real-time count of the prompts inside (**Caption**, **Gray 500**).

- **Collapsed State:** When collapsed (via a toggle button in the
  header), it shrinks to only show the icons (48px width), expanding on
  hover to show the full label in a tooltip.

- **Active State:** The currently selected folder/category has a
  highlighted background (**Gray 100**) and the text/icon color changes
  to Deep Purple (**#7c3aed**).

**3. Tabs**

- **Anatomy:** Used for sectioning content on a page (e.g., Settings).
  Tabs are **Body** text, **Gray 500**.

- **Active State:** The active tab has **font-weight: 600** (Semi-bold)
  and a solid, 2px underline in the primary Deep Purple (**#7c3aed**).
  Inactive tabs have lighter **Gray 500** text.

**4. Pagination**

- **Anatomy:** A series of numbered buttons, \"Previous\" and \"Next\"
  buttons, and an ellipsis (\...) for truncating long lists of pages.
  Each button is 40px x 40px.

- **Current Page State:** The button for the current page is styled like
  a Primary Button (solid gradient background) to make it stand out
  clearly. Other page numbers are Secondary/Ghost Buttons.

- **Disabled State:** \"Previous\" or \"Next\" buttons are **Gray
  300** text with **not-allowed** cursor.

**3.5 Modals & Dialogs**

Modals will provide focused interactions, ensuring user attention.

- **Anatomy:** All modals must consist of:

  - **Overlay:** A semi-transparent black background
    (**rgba(0,0,0,0.5)**) that covers the entire viewport to focus the
    user\'s attention. Clicking it should close the modal.

  - **Content Box:** A centered container with a **white** (**Gray
    800** in dark mode) background, **rounded-lg** (10px) corners, and
    a **shadow-xl**. It must have a Header with a title (**H3**) and a
    close (X) icon (24px, **Gray 500**), a Body for the main content,
    and a Footer for action Buttons (typically Primary and Secondary).

- **Animation:** Modals should appear with a subtle **scale-up** (**from
  scale(0.95) to scale(1)**) and **fade-in** animation (**from
  opacity(0) to opacity(1)**) over **normal** duration (**300ms**) and
  disappear with the reverse.

**3.6 Notifications & Toasts**

Toasts provide non-intrusive feedback to user actions.

- **Anatomy:** Small cards that appear in the top-right corner of the
  screen. They consist of a semantic icon (20px, e.g., checkmark for
  success, \'!\' for error), a title (**Body**, **font-weight: 600**), a
  brief description (**Body Small**), and a close button (X icon, 16px).

- **Variants:**

  - **Success:** Green accent color (**#10b981**) and icon.
    Background: **rgba(16, 185, 129, 0.1)**.

  - **Error:** Red accent color (**#ef4444**) and icon.
    Background: **rgba(239, 68, 68, 0.1)**.

  - **Info:** Blue accent color (**#3b82f6**) and icon.
    Background: **rgba(59, 130, 246, 0.1)**.

  - **Warning:** Orange accent color (**#f59e0b**) and icon.
    Background: **rgba(245, 158, 11, 0.1)**.

- **Behavior:** They should stack vertically if multiple appear and be
  dismissible both manually (by clicking the close button) and via a
  5-second timer. Fade out animation over **normal** duration.

**3.7 Badges & Pills**

Small, informative elements for categorization and status.

- **Anatomy:** Small, pill-shaped containers with text
  inside. **rounded-full** border radius.

- **Usage:**

  - **Tags/Categories:** Use a light, neutral background (**Gray 100**)
    with **Gray 700** text.

  - **Platform Tags:** Specific colors for each platform (e.g.,
    \"ChatGPT\" - light blue, \"Claude\" - light purple, \"Gemini\" -
    light green, \"Midjourney\" - light pink). These will be defined in
    a separate platform-specific color palette.

  - **Reputation/Status:** Use semantic colors. A \"Trusted\" badge
    could use the primary purple gradient. A \"Premium\" badge could
    have a golden or gradient look (**linear-gradient(45deg, #FFD700,
    #FFA500)**).

**3.8 Data Visualization**

For the Analytics section, data visualization will be clean and easy to
interpret.

- **Preferred Chart Types:** Bar charts for comparisons, line charts for
  trends over time, donut charts for proportions.

- **Color Palette for Charts:** Will primarily use shades derived from
  the primary purple and blue, along with a selection of **Gray
  500** to **Gray 700** for neutral data. Semantic colors will be used
  for specific data points (e.g., **Success** for positive
  growth, **Error** for negative trends).

- **Styling Rules:**

  - **Labels:** **Caption** font size, **Gray 600** color.

  - **Gridlines:** Thin, light **Gray 200** lines.

  - **Legends:** Clear, concise, positioned to avoid obscuring data.

- **Dark Mode Variations:** Chart colors will be adjusted to maintain
  readability and visual appeal against dark backgrounds.

**4. Page Layouts & User Experience Flows**

This section details the structure and flow of key pages, including
their various states.

**4.1 The Dashboard**

- **User Goal:** Get a quick, personalized overview of my activity and
  what\'s new.

- **Layout Structure:** A responsive grid layout. On desktop, it will
  typically be a two-column layout with a main content area and a
  sidebar for quick actions/recent activity.

  - **Hero Section:** A personalized welcome message (**H2**, \"Good
    morning, \[User\]!\") with a large, inviting headline (**H1**).

  - **Quick Stats:** A horizontal row of 4 Stat Cards (e.g., \"Prompts
    Created,\" \"Total Copies,\" \"Avg. Rating,\" \"Community
    Submissions\").

  - **Quick Actions:** A section with large, icon-driven buttons
    (**Primary Button** style, but larger icons) for primary tasks like
    \"Create New Prompt,\" \"Browse Community,\" \"View My Favorites.\"

  - **Activity Feed:** A list of recent activities (e.g., \"You copied
    \'React Component Generator\',\" \"Your prompt \'API Documentation\'
    received a new vote\"). Each item will be a simple list entry with
    an icon and **Body** text.

- **States:**

  - **Loading:** Skeleton loaders will mimic the layout of the stat
    cards and activity feed. Stat cards will show animated gray boxes,
    and activity feed will show lines of varying lengths.

  - **Empty (New User):** The activity feed is replaced by a friendly
    illustration and a component that prompts the user to take their
    first action, linking them to the discovery page or the creation
    modal. Text: \"Welcome to PigeonPrompt! Start by exploring our
    community prompts or create your own.\"

**Wireframe Mockup: Desktop Dashboard**

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| HEADER (Logo \| Nav Links \| Search Bar \| User Profile) \|

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| \|

\| Good morning, \[User\]! \|

\| H1: Your AI Prompt Hub \|

\| \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| \| STAT CARD 1 \| \| STAT CARD 2 \| \| STAT CARD 3 \| \| STAT CARD 4
\|

\| \| (Prompts Created) \| \| (Total Copies) \| \| (Avg. Rating) \| \|
(Community Submissions)\|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| \|

\| Quick Actions \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| \| Create New Prompt \| \| Browse Community \| \| View My Favorites
\| \|

\| \| (Large Button) \| \| (Large Button) \| \| (Large Button) \| \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| \|

\| Recent Activity \|

\|
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\|

\| \| Activity Item 1 (e.g., \"You copied \'React Component
Generator\'\") \|

\| \| Activity Item 2 (e.g., \"Your prompt \'API Documentation\'
received a new vote\") \|

\| \| Activity Item 3 \|

\|
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\|

\| \|

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

**Wireframe Mockup: Mobile Dashboard**

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| HEADER (Hamburger \| Logo \| Search Icon \| User Profile Icon) \|

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| \|

\| Good morning, \[User\]! \|

\| H2: Your AI Prompt Hub \|

\| \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| \| STAT CARD 1 \| \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| \| STAT CARD 2 \| \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| \| STAT CARD 3 \| \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| \| STAT CARD 4 \| \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| \|

\| Quick Actions \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| \| Create New Prompt \| \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| \| Browse Community \| \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| \| View My Favorites \| \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| \|

\| Recent Activity \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| \| Activity Item 1 \| \|

\| \| Activity Item 2 \| \|

\| \| Activity Item 3 \| \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| \|

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

**4.2 Prompt Discovery Page**

- **User Goal:** Find the perfect prompt for my task.

- **Layout Structure:**

  - **Header Area:** Contains a prominent Search Bar (**Input** with
    search icon) and a button (**Secondary Button**) to toggle the
    Advanced Search Filters panel.

  - **Filters Panel:** When open, this panel (collapsible, positioned to
    the left of the main content or as a modal on mobile) contains
    Checkboxes for categories/platforms, Inputs for date ranges, and
    Selects for sorting options.

  - **Main Content:** A responsive grid displaying the 12 Prompt Cards
    for the current page. On desktop, this will be a 3-column grid. On
    tablet, 2 columns. On mobile, 1 column.

  - **Footer:** A Pagination component centered below the grid.

- **States:**

  - **Loading:** The grid is filled with 12 PromptCard skeleton loaders
    (animated gray boxes mimicking the card structure).

  - **Empty (No Results):** A friendly, centered message with an icon
    (e.g., a magnifying glass with a sad face), saying \"No prompts
    found. Try adjusting your filters or search term.\"

**Wireframe Mockup: Desktop Discovery Page**

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| HEADER (Logo \| Nav Links \| Search Bar \| User Profile) \|

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| \|

\|
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\|

\| \| Search Bar (Global) \[Advanced Filters Button\] \|

\|
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\|

\| \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| \| FILTERS PANEL \| \| PROMPT CARD 1 \| PROMPT CARD 2 \| PROMPT CARD
3 \|

\| \| (Categories, \| \| \| \| \|

\| \| Platforms, etc.) \| \| PROMPT CARD 4 \| PROMPT CARD 5 \| PROMPT
CARD 6 \|

\| \| \| \| \| \| \|

\| \| \| \| PROMPT CARD 7 \| PROMPT CARD 8 \| PROMPT CARD 9 \|

\| \| \| \| \| \| \|

\| \| \| \| PROMPT CARD 10 \| PROMPT CARD 11 \| PROMPT CARD 12 \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| \|

\| \[Pagination Component\] \|

\| \|

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

**Wireframe Mockup: Mobile Discovery Page**

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| HEADER (Hamburger \| Logo \| Search Icon \| User Profile Icon) \|

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| \|

\|
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\|

\| \| Search Bar (Global) \[Filters Button\] \|

\|
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\|

\| \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| \| PROMPT CARD 1 \| \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| \| PROMPT CARD 2 \| \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| \... (12 cards total) \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| \| PROMPT CARD 12 \| \|

\| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

\| \|

\| \[Pagination Component\] \|

\| \|

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

**4.3 Prompt Creation/Editing Modal**

- **User Goal:** Effortlessly create a new prompt or edit an existing
  one with immediate feedback.

- **Layout Structure:** A large Modal. Inside, a two-column layout on
  desktop:

  - **Left Column (The Form):** A well-spaced form containing all the
    necessary Form Elements: Input for Title, Textarea for Content,
    Selects for Category and Platforms, etc.

  - **Right Column (The Live Preview):** This is a critical feature. It
    displays a live, fully-rendered PromptCard that updates in real-time
    as the user types in the form on the left, showing them exactly how
    it will look to others.

- **Flow:** The \"Save\" button is disabled until all required fields
  are filled. Upon saving, a \"Success\" Toast appears.

- **States:**

  - **Loading:** The form fields will be disabled with a subtle loading
    overlay. The preview card will show a skeleton state.

  - **Error:** Form fields with validation errors will be highlighted
    with red borders and error messages below them. A global error
    message may appear at the top of the modal if the save operation
    fails.

**Wireframe Mockup: Desktop Prompt Creation Modal**

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| MODAL OVERLAY \|

\|
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\|

\| \| MODAL HEADER (Title: \"Create New Prompt\" \| Close (X) Icon) \|
\|

\|
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\|

\| \| \| \|

\| \| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\|

\| \| \| FORM (Left Column) \| \| LIVE PREVIEW (Right Column) \| \|

\| \| \| \| \| \| \|

\| \| \| Input: Title \| \|
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\| \|

\| \| \| Textarea: Content \| \| \| Live Prompt Card (updates in
real-time) \| \| \|

\| \| \| Select: Category \| \|
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\| \|

\| \| \| Select: Platforms \| \| \| \|

\| \| \| Toggle: Is Public \| \| \| \|

\| \| \| \| \| \| \|

\| \| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\|

\| \| \| \|

\| \| MODAL FOOTER (\[Cancel Button\] \[Save Button\]) \| \|

\|
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\|

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

**Wireframe Mockup: Mobile Prompt Creation Modal (Stacked Layout)**

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| MODAL OVERLAY \|

\|
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\|

\| \| MODAL HEADER (Title: \"Create New Prompt\" \| Close (X) Icon) \|
\|

\|
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\|

\| \| \| \|

\| \|
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\| \|

\| \| \| FORM (Stacked) \| \| \|

\| \| \| \| \| \|

\| \| \| Input: Title \| \| \|

\| \| \| Textarea: Content \| \| \|

\| \| \| Select: Category \| \| \|

\| \| \| Select: Platforms \| \| \|

\| \| \| Toggle: Is Public \| \| \|

\| \| \| \| \| \|

\| \|
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\| \|

\| \| \| \|

\| \|
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\| \|

\| \| \| LIVE PREVIEW (Stacked below form) \| \| \|

\| \| \| \| \| \|

\| \| \|
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\| \| \|

\| \| \| \| Live Prompt Card (updates in real-time) \| \| \| \|

\| \| \|
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\| \| \|

\| \| \| \| \| \|

\| \|
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\| \|

\| \| \| \|

\| \| MODAL FOOTER (\[Cancel Button\] \[Save Button\]) \| \|

\|
+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+
\|

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

**4.4 Settings Page**

- **User Goal:** Manage my profile, preferences, and account settings.

- **Layout Structure:** A main content area with a page title (**H1**,
  \"Settings\"). Below the title is a Tabs component with at least four
  tabs:

  - **Profile:** Inputs for name, username, bio. Displays read-only
    email and reputation stats.

  - **Preferences:** Toggles for settings like \"Dark Mode,\" \"Compact
    View,\" \"Auto-save prompts.\"

  - **Notifications:** Granular Checkboxes for enabling/disabling
    different email notifications.

  - **Account:** Contains the \"Danger Zone\" with the Destructive
    Button for \"Delete Account.\"

- **States:**

  - **Loading:** Each tab\'s content will display a skeleton loader
    while data is fetched.

  - **Error:** Error messages will appear next to relevant form fields
    or as a general error banner at the top of the tab content.

**4.5 User Onboarding Flow**

- **User Goal:** Understand the app\'s value and core features in under
  60 seconds.

- **Flow:** A step-by-step guided tour initiated on the first login.
  This will use a combination of modals and tooltips/spotlights.

  1.  **Step 1 (Welcome Modal):** A brief, friendly welcome message
      (**H2**, \"Welcome to PigeonPrompt!\") with a short explanation of
      the platform\'s purpose. \"Your ultimate hub for AI prompts.\"

  2.  **Step 2 (Highlight Discovery):** The modal closes, and a
      tooltip/spotlight points to the Search Bar in the header,
      explaining how to find prompts. \"Discover thousands of
      community-tested prompts.\"

  3.  **Step 3 (Highlight Copy):** The spotlight moves to the \"Copy\"
      button on a sample PromptCard (pre-loaded on the discovery page),
      explaining the core action. \"Copy prompts with a single click.\"

  4.  **Step 4 (Encourage Creation):** The final step highlights the
      \"Create Prompt\" button (e.g., in the header or dashboard),
      encouraging the user to contribute. \"Ready to share your own?
      Create your first prompt!\"

- **Dismissal:** The tour can be dismissed at any time via a \"Skip
  Tour\" button or by clicking outside the spotlighted area.

**4.6 Premium Upgrade & Checkout Flow**

- **User Goal:** Understand the benefits of premium and purchase a
  subscription securely.

- **Flow:**

  1.  **Trigger:** User clicks on a feature marked with a \"Premium\"
      Badge or clicks an \"Upgrade\" button in the header.

  2.  **Benefits Modal:** A Modal appears, clearly showing a
      side-by-side comparison of the Free vs. Premium tiers in a
      checklist format. Key benefits of premium (e.g., \"Unlimited
      Prompts,\" \"Private Collections,\" \"Advanced Analytics\") will
      be highlighted with icons.

  3.  **Checkout:** Clicking the \"Upgrade Now\" Primary Button
      navigates the user to a dedicated, clean checkout page that
      securely embeds the Stripe Checkout element. The page is simple,
      distraction-free, and reinforces the value proposition. It will
      include a clear summary of the chosen plan and price.

- **States:**

  - **Loading:** The checkout page will display a full-page skeleton
    loader while Stripe loads.

  - **Error:** Stripe\'s built-in error handling will be used for
    payment failures. A custom error message will appear if there are
    issues communicating with our backend.

**4.7 Success Metrics & UX Goals**

Our design decisions are directly tied to measurable outcomes.

- **Primary UX Metrics:**

  - **Time to first prompt copy:** \< 30 seconds for new users (from
    onboarding completion).

  - **Search to result satisfaction:** \< 3 search refinements (average
    number of filter/search adjustments before finding a relevant
    prompt).

  - **Prompt creation completion rate:** \> 85% (percentage of users who
    start creating a prompt and successfully save it).

  - **Mobile usability score:** 90+ (measured via Google PageSpeed
    Insights and Lighthouse audits).

- **User Experience Goals:**

  - Reduce cognitive load in prompt discovery by providing intuitive
    filtering and clear search results.

  - Increase user confidence in prompt creation through real-time
    preview and clear validation.

  - Minimize friction in sharing and collaboration by simplifying
    sharing options and community interaction.

  - Create moments of delight in everyday interactions through subtle
    animations and encouraging microcopy.

- **Business Impact Measurements:**

  - User retention correlation with design elements (e.g., do users who
    engage with community features stay longer?).

  - Premium conversion influenced by UI/UX (e.g., A/B test different
    premium benefits modal designs).

  - Community engagement driven by interface design (e.g., increase in
    ratings, comments, and prompt submissions).

**5. Accessibility & Responsiveness**

Accessibility and responsiveness are not afterthoughts but core tenets
of our design process, ensuring an inclusive experience for all users on
any device.

**5.1 Accessibility (WCAG 2.1 AA)**

We are committed to meeting WCAG 2.1 Level AA compliance, ensuring our
application is usable by individuals with diverse abilities.

- **Keyboard Navigation:**

  - A logical and predictable tab order must be enforced. The flow
    should be: Header Logo -\> Nav Links -\> Search -\> User Menu -\>
    (if open) Sidebar -\> Main Content interactive elements.

  - All interactive elements, including custom ones like Toggles, must
    be focusable and operable with the keyboard (Enter/Space). Focus
    indicators (blue ring) will be clearly visible.

- **Screen Reader Support:**

  - All icon-only buttons must have an **aria-label** (e.g., **\<button
    aria-label=\"Close\"\>X\</button\>**).

  - All form inputs must be associated with
    a **\<label\>** using **for** and **id** attributes.

  - Dynamic error messages must be linked to inputs
    using **aria-describedby**.

  - Semantic HTML
    (**\<nav\>**, **\<main\>**, **\<aside\>**, **\<footer\>**, **\<header\>**)
    must be used to define page structure, aiding screen reader
    navigation.

  - **aria-live** regions will be used for dynamic content updates
    (e.g., success messages, search results loading).

- **Color Contrast:** All color combinations for text and interactive
  elements will be checked to meet WCAG 2.1 AA contrast ratios (minimum
  4.5:1 for normal text, 3:1 for large text and graphical objects). This
  includes ensuring sufficient contrast for text over gradients.

- **Reduced Motion:** Users who have **prefers-reduced-motion** enabled
  in their system settings will experience simplified transitions and
  animations, minimizing potential discomfort.

**5.2 Responsiveness**

Our design is inherently responsive, adapting seamlessly to various
screen sizes and orientations.

- **Mobile (Under 768px):**

  - The Collapsible Sidebar is hidden by default and triggered by a
    hamburger icon in the Header.

  - The main content grid becomes a single column of full-width Prompt
    Cards.

  - The Header may hide the text labels for navigation, showing icons
    only, or place them in the hamburger menu.

  - The two-column layout in the Prompt Creation Modal stacks
    vertically.

  - Touch targets will be a minimum of 44px x 44px (iOS) / 48px x 48px
    (Android).

- **Tablet (768px - 1024px):**

  - The Sidebar may be visible but in its collapsed (icon-only) state.

  - The main content grid may expand to 2 columns.

  - Form layouts may adjust to optimize space.

- **Desktop (1024px+):**

  - The full experience is displayed, with the Sidebar visible by
    default. The grid can expand to 3 or more columns depending on
    screen width.

  - Complex data tables may show more columns.

**5.2 Responsive Design Strategy**

Our strategy employs a mobile-first approach, designing for the smallest
screen and progressively enhancing for larger viewports. This ensures
core functionality is always accessible and performant. Layouts are
built using flexible box (**flexbox**) and grid (**grid**) properties in
CSS, leveraging Tailwind CSS\'s responsive utility classes. Breakpoints
are defined at **sm**, **md**, **lg**, **xl**, **2xl** to provide
granular control over layout adjustments.

**5.3 Accessibility Testing Guidance**

- **Screen Reader Testing:**

  - **Test flows:** Login → Discovery → Prompt Creation → Settings.

  - **Validation:** Ensure all interactive elements are announced
    properly (role, name, state). Verify correct reading order of
    content.

  - **Focus Management:** Confirm that focus is correctly managed in
    modals, dropdowns, and dynamic content updates (e.g., when search
    results load).

- **Keyboard Navigation Testing:**

  - **User Journeys:** Complete all critical user journeys using only
    the keyboard (Tab, Shift+Tab, Enter, Space, Arrow keys).

  - **Tab Order:** Verify a logical and predictable tab order on all
    pages and within components.

  - **Functionality:** Ensure all interactive elements are operable via
    keyboard. Test escape key functionality for closing modals and
    menus.

- **Color Contrast Validation:**

  - **Automated Testing:** Use tools like Axe DevTools or Lighthouse for
    automated contrast checks during development.

  - **Manual Validation:** Manually check contrast for text over
    gradients or complex backgrounds, as automated tools may struggle.

  - **High Contrast Mode:** Test the application in system high contrast
    modes to ensure all information remains discernible.

**5.4 Performance & Technical Requirements**

- **Loading Performance:**

  - **Initial page load:** Target under 3 seconds on a simulated 3G
    connection.

  - **Component lazy loading:** Implement lazy loading for components
    and images that are below the fold or not immediately visible.

  - **Skeleton loading states:** Provide skeleton loading states for all
    asynchronous content (e.g., prompt cards, dashboard stats, settings
    tabs) to improve perceived performance.

- **Animation Performance:**

  - **Maintain 60fps:** All interactive animations (hovers, clicks,
    transitions) must maintain a smooth 60 frames per second.

  - **CSS Transforms:** Prioritize
    CSS **transform** and **opacity** properties for animations over
    properties that trigger layout recalculations
    (e.g., **width**, **height**, **margin**).

  - **Reduced Motion:** Respect **prefers-reduced-motion** media query
    to provide a less animated experience for users who prefer it.

- **Browser Support:**

  - **Tier 1 (Full Support):** Chrome 90+, Firefox 88+, Safari 14+, Edge
    90+, Opera, Brave.

  - **Graceful Degradation:** For older or less common browsers, ensure
    core functionality remains accessible, even if some advanced styling
    or animations are degraded.

  - **Progressive Enhancement:** Build core functionality first, then
    layer on advanced features and styling.

- **Device Considerations:**

  - **Touch Targets:** Minimum 44px (iOS) / 48px (Android) for all
    interactive elements to ensure usability on touch devices.

  - **Hover States:** Hover states will be disabled or adapted for touch
    devices, as they do not have a direct \"hover\" interaction.

  - **High-DPI Displays:** All assets (icons, images) will be optimized
    for high-DPI (Retina) displays to ensure crisp visuals.

**6. Design System Governance**

A well-governed design system is a living document that evolves with the
product and its users. Our governance model will ensure consistency,
quality, and
scalability.[penpot.app+5](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHrWUMLze8HQxzDmiSp7s8lreWVED8pEj_xJqonULGOiAEBitGNO_6_y74_ajPD2z0Ge-G5abkYsULO2Ax4qtvApzWdZS83_k4gVsHXP19oGWH3IIMYi3vamR85LvCIvxp_hGN9drA76Brs57CVndPprlN8s3EkyjMlfuD7jWx45eGMPmFW0XOOrA==)

- **Versioning Policy:** We will implement semantic versioning
  (MAJOR.MINOR.PATCH) for the design system. Major versions for breaking
  changes, minor for new features/components, patch for bug fixes/small
  improvements. A clear changelog will be maintained.

- **Changelog Approach for Updates:** Every update to the design system
  (components, tokens, guidelines) will be documented in a publicly
  accessible changelog, detailing changes, their impact, and migration
  notes if applicable.

- **Communication Process for New Tokens/Components:**

  - **Proposal:** Designers/developers can propose new tokens or
    components via a dedicated Slack channel or GitHub issue.

  - **Review:** A weekly \"Design System Sync\" meeting with
    representatives from design, frontend development, and product will
    review proposals, discuss feasibility, and ensure alignment with
    existing principles.

  - **Approval:** Approved items will be added to a backlog for
    implementation.

  - **Documentation:** New items must be fully documented before being
    integrated into the main system.

- **Contribution Model:** We will encourage contributions from across
  the team. A clear process for submitting changes, including code
  standards and review guidelines, will be
  established.[medium.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHx1veRBZxSWQq6GMyyGvFE6RGFMza-eWs455v8u-o1-vKPCtIQih_7vQE9ZhX8wxDdqKcuh0O_HrjCL3jSsH6a3bHDqphjcPJxFY58RI_HgfKpV8xo3ypJhyZcMVsp-buDRsA1MJa3ZWnj06PbVKvlj5-mH35de0-YqNrxG4JipjyatXlKkmP9-MrH5bI=)

- **Roles & Responsibilities:**

  - **Design System Lead:** Oversees the entire design system, ensures
    adherence to principles, makes final decisions.

  - **Core Contributors:** Designers and developers dedicated to
    building and maintaining the system.

  - **Community Contributors:** Any team member who proposes or
    implements changes, subject to review.

- **Feedback Mechanism:** Open channels for feedback (e.g., dedicated
  Slack channel, direct messages) will be maintained to address issues
  and gather
  suggestions.[thedesignsystem.guide](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGVSS4FZC-57B4KFVVWliDbRTVVxkxo6mWoxN1QYhPMiXni4n88X7HX3hlI_9M1BSPD-TMx4w39NUFwTJjikpCwKGNmE6-aP3Vs18dz--0Cs4p52u4YSfjo1nr5B3qTI57jI4g-Eoc9Mt6ux1YA9TIOOvNcCbAEuQwhBJNVBKXXWiFN4lesKPTwGkYB5MlMSV2TWc1pQ8cBo9YH5lKrAA9O2XNPRnY=)

**7. Testing & Validation Framework**

Rigorous testing and validation are essential to ensure the quality,
accessibility, and usability of
PigeonPrompt.[frontiersin.org+2](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEu3-T6EwMzeNIPeBx3nAYU5dz-A0mTRIsSKx6IdTIClcAJgiuYRx58dFR401Jezdnnbf-QKZelQE-RmLMUhXS8o9048mFNzJwcyQ9kv87OdJ6Sv-RON1A1e9eaGbsOtmoDwttrGbo1XjCx9amF6K8zmcCAeLpG10D9SkOtUEOEQWa2PC2xiVDK-vzgb4LM5YYI)

**7.1 Accessibility Testing Checklist**

- **Screen Reader Testing:**

  - **Test Flows:** Conduct comprehensive screen reader tests for
    critical user flows: Login → Discovery → Prompt Creation → Settings.

  - **Validation:** Verify that all interactive elements (buttons,
    links, form fields) are correctly announced by screen readers (e.g.,
    NVDA, VoiceOver) with their role, name, and current state. Ensure
    dynamic content updates are announced appropriately.

  - **Focus Management:** Confirm that focus is logically managed within
    modals, dropdowns, and other dynamic components. For example, when a
    modal opens, focus should move inside it, and when it closes, focus
    should return to the element that triggered it.

  - **Keyboard Navigation Testing:**

  - **Complete User Journeys:** Navigate through the entire application
    using only the keyboard (Tab, Shift+Tab, Enter, Space, Arrow keys).
    This includes creating an account, finding and copying a prompt,
    creating a new prompt, and changing settings.

  - **Verify Logical Tab Order:** Ensure the focus order follows a
    logical sequence that matches the visual layout of the page. There
    should be no \"focus traps\" where a user cannot escape a component.

  - **Test Escape Key Functionality:** Confirm that the **Escape** key
    correctly closes modals, dropdown menus, and tooltips.

  - **Color Contrast Validation:**

  - **Automated Testing:** Integrate automated contrast checking tools
    (like Axe) into the CI/CD pipeline to catch violations early.

  - **Manual Validation:** Manually inspect all text over gradients,
    images, or other complex backgrounds using a color contrast analyzer
    tool to ensure WCAG 2.1 AA compliance.

  - **High Contrast Mode Compatibility:** Test the application in
    system-level high contrast modes (Windows/macOS) to ensure all UI
    elements remain visible and usable.

  - **7.2 Responsive Testing Protocol**

  - Our responsive testing will ensure a seamless and consistent
    experience across all supported devices and browsers.

  - **Device Testing Matrix:** We will perform manual testing on a core
    set of physical devices to capture real-world usage nuances.

  - **Mobile:** iPhone 14 (iOS Safari), Samsung Galaxy S22 (Chrome
    Android), Google Pixel 7 (Chrome Android).

  - **Tablet:** iPad Air/Pro (Safari, both portrait and landscape).

  - **Desktop:** Test on various screen resolutions, including
    1920x1080, 1440x900, and 1366x768, using browser developer tools and
    physical monitors.

  - **Cross-Browser Testing:**

  - **Core Functionality:** Verify that all critical user flows work
    flawlessly on the latest versions of our supported browsers (Chrome,
    Firefox, Safari, Edge).

  - **Visual Regression Testing:** Use automated tools like Percy or
    Chromatic to detect unintended visual changes in the UI across
    different browsers and breakpoints, ensuring layout consistency.

  - **Performance Benchmarking:** Measure key performance metrics (LCP,
    FID, CLS) on each platform to identify and address any
    browser-specific performance bottlenecks.

  - **7.3 Usability Testing Guidelines**

  - Usability testing will provide invaluable qualitative feedback,
    helping us understand user behavior and identify pain points in our
    design.

  - **Test Scenarios:** We will conduct moderated and unmoderated
    usability tests with users from our target personas, asking them to
    complete specific tasks.

  - **First-Time User Onboarding:** \"You\'ve just signed up for
    PigeonPrompt. Explore the platform and find a prompt for generating
    a marketing email.\"

  - **Prompt Discovery and Refinement:** \"You need a prompt to help you
    write a Python script. Find a suitable prompt, and then refine your
    search to only show prompts compatible with ChatGPT 4.\"

  - **Prompt Creation and Editing:** \"Create a new prompt for
    generating social media posts. Make it public and add at least two
    platform tags.\"

  - **Community Interaction and Sharing:** \"Find a prompt you like,
    copy it, and then leave a rating and a helpful comment for the
    creator.\"

  - **Success Criteria:** We will measure the success of these tests
    based on a combination of quantitative and qualitative data.

  - **Task Completion Rates:** Target \> 90% of users successfully
    completing each task without assistance.

  - **Average Time on Task:** Establish baseline targets for how long
    each task should take and identify areas where users are struggling
    or getting delayed.

  - **User Satisfaction Scores:** Use post-test surveys (like the System
    Usability Scale - SUS) to gather subjective feedback on ease of use,
    with a target score \> 80.

  - **Error Rate:** Track the number of errors users make while
    attempting a task.

  - **Qualitative Insights:** Collect direct quotes and observations
    about user frustrations, moments of delight, and overall
    impressions. This feedback is crucial for iterative design
    improvements.

## PP-001 — Context Workspace: Preview Panel v1

This section anchors the Preview Panel v1 design and points to the detailed spec for implementers.

- Primary doc: design/preview-panel-v1.md
- IA snapshot: Left rail = FileList (virtualized, include toggles, excerpt selector); Right pane = PreviewPanel (actions + content preview); Footer/HUD = Token totals + cost, aria-live updates.
- Stable data-testids: context-file-list, context-file-row, include-toggle, excerpt-mode-select, excerpt-start, excerpt-end, preview-panel, token-hud.
- Accessibility: Full keyboard navigation, labelled controls, visible focus. Token HUD uses aria-live="polite".
- Performance: Virtualization + lazy preview render. Target <100ms perceived response on toggles/excerpt changes for typical projects.

See the component API and interaction details in design/preview-panel-v1.md (kept as the SSOT for PP-001).
