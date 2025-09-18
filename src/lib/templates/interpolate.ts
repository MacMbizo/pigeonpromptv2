// Shared template interpolation utilities for Studio Preview and server-side rendering
// Supports multiple placeholder syntaxes and dot-path resolution

export type MissingPolicy = "leave" | "empty" | "error" | "annotate";

export interface RenderOptions {
  // How to handle missing variables (undefined at the resolved path)
  onMissing?: MissingPolicy;
  // Annotation template used when onMissing = 'annotate'. Use {var} placeholder for variable name.
  missingAnnotation?: string;
}

export interface RenderMetadata {
  // Unique variable names detected in the input (normalized, without delimiters)
  variablesUsed: string[];
  // Variables that were missing in the provided context
  variablesMissing: string[];
  // Count of replacements applied per variable
  replacedCountByVar: Record<string, number>;
}

export interface RenderResult {
  rendered: string;
  meta: RenderMetadata;
}

const DEFAULT_OPTIONS: Required<Pick<RenderOptions, "onMissing" | "missingAnnotation">> = {
  onMissing: "leave",
  missingAnnotation: "[MISSING:{var}]",
};

// Allowed variable name pattern (aligns with in-page extractVariables)
// Supports alphanumerics plus dot-path, underscore, colon and hyphen segments
const NAME_RE = "[a-zA-Z0-9_.:-]+";

// Unified matcher for supported syntaxes: {{ var }}, ${ var }, << var >>, <% var %>
// Group 1 = entire match; Groups 2..5 capture the variable name depending on the syntax
const UNIFIED_PLACEHOLDER_RE = new RegExp(
  `(\\{\\{\\s*(${NAME_RE})\\s*\\}\\}|\\$\\{\\s*(${NAME_RE})\\s*\\}|<<\\s*(${NAME_RE})\\s*>>|<%\\s*(${NAME_RE})\\s*%>)`,
  "g"
);

/**
 * Extract unique variable names from a template string across all supported syntaxes.
 */
export function extractVariables(input: string): string[] {
  if (!input) return [];
  const set = new Set<string>();
  UNIFIED_PLACEHOLDER_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = UNIFIED_PLACEHOLDER_RE.exec(input))) {
    const name = m[2] || m[3] || m[4] || m[5];
    if (name) set.add(name);
  }
  return Array.from(set);
}

function getPath(obj: any, path: string): any {
  if (obj == null) return undefined;
  const parts = path.split(".");
  let cur: any = obj;
  for (const part of parts) {
    if (cur == null) return undefined;
    const key: any = part.match(/^\d+$/) ? Number(part) : part;
    if (Object.prototype.hasOwnProperty.call(cur, key)) {
      cur = (cur as any)[key];
    } else {
      return undefined;
    }
  }
  return cur;
}

/**
 * Render a template using the provided context.
 * - Replaces placeholders across all supported syntaxes.
 * - Resolves dot-paths into nested objects (e.g. user.name, items.0.title).
 * - Applies missing variable policy.
 */
export function renderTemplate(
  input: string,
  context: Record<string, any>,
  opts?: RenderOptions
): RenderResult {
  const options = { ...DEFAULT_OPTIONS, ...(opts || {}) };
  const used = extractVariables(input);
  const replacedCountByVar: Record<string, number> = Object.create(null);
  const missing = new Set<string>();

  let rendered = input.replace(UNIFIED_PLACEHOLDER_RE, (full, _g1, g2, g3, g4, g5) => {
    const name: string = g2 || g3 || g4 || g5;
    const value = getPath(context, name);
    if (value === undefined) {
      // Track missing
      missing.add(name);
      switch (options.onMissing) {
        case "empty":
          increment(replacedCountByVar, name);
          return "";
        case "error":
          // Throw after replace to keep position? Safer to throw immediately
          throw new Error(`Missing template variable: ${name}`);
        case "annotate":
          increment(replacedCountByVar, name);
          return options.missingAnnotation.replace("{var}", name);
        case "leave":
        default:
          return full; // leave token intact
      }
    }
    increment(replacedCountByVar, name);
    return String(value);
  });

  return {
    rendered,
    meta: {
      variablesUsed: used,
      variablesMissing: Array.from(missing),
      replacedCountByVar,
    },
  };
}

function increment(map: Record<string, number>, k: string) {
  map[k] = (map[k] || 0) + 1;
}