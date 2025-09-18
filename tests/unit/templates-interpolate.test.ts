import { describe, it, expect } from "vitest";
import { extractVariables, renderTemplate } from "@/lib/templates/interpolate";

describe("templates/interpolate", () => {
  it("extracts variables across syntaxes", () => {
    const s = "Hello {{name}}, ${user.id} <<order.total>> <% path.to_value %> and {{name}} again";
    const vars = extractVariables(s).sort();
    expect(vars).toEqual(["name", "order.total", "path.to_value", "user.id"].sort());
  });

  it("renders with dot-path resolution", () => {
    const s = "Hi {{user.name}} (#${user.id}) owes <<order.total>>";
    const { rendered, meta } = renderTemplate(s, {
      user: { name: "Ava", id: 42 },
      order: { total: 19.95 },
    });
    expect(rendered).toBe("Hi Ava (#42) owes 19.95");
    expect(meta.variablesUsed.sort()).toEqual(["user.name", "user.id", "order.total"].sort());
    expect(meta.variablesMissing).toEqual([]);
  });

  it("handles arrays via numeric segments", () => {
    const s = "Top: {{items.0.title}} | Second: ${items.1.title}";
    const { rendered } = renderTemplate(s, {
      items: [ { title: "A" }, { title: "B" } ],
    });
    expect(rendered).toBe("Top: A | Second: B");
  });

  it("onMissing=leave keeps tokens as-is", () => {
    const s = "Hello {{name}}";
    const { rendered, meta } = renderTemplate(s, {}, { onMissing: "leave" });
    expect(rendered).toBe("Hello {{name}}");
    expect(meta.variablesMissing).toEqual(["name"]);
  });

  it("onMissing=empty removes tokens", () => {
    const s = "Hello {{name}}!";
    const { rendered } = renderTemplate(s, {}, { onMissing: "empty" });
    expect(rendered).toBe("Hello !");
  });

  it("onMissing=annotate annotates tokens", () => {
    const s = "Hello ${name}!";
    const { rendered } = renderTemplate(s, {}, { onMissing: "annotate", missingAnnotation: "[[{var}]]" });
    expect(rendered).toBe("Hello [[name]]!");
  });

  it("onMissing=error throws", () => {
    const s = "Hello <<name>>";
    expect(() => renderTemplate(s, {}, { onMissing: "error" })).toThrow(/Missing template variable: name/);
  });

  it("counts replacements per variable", () => {
    const s = "{{x}} + {{x}} = ${x}";
    const { meta } = renderTemplate(s, { x: 3 });
    expect(meta.replacedCountByVar["x"]).toBe(3);
  });
});