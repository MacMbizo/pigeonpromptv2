import { test, expect } from "@playwright/test";
import { cleanupUserTemplates } from "./helpers";

const APP_URL = process.env.APP_URL || "http://localhost:3100";

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

test.describe("User Templates CRUD (UI)", () => {
  test.beforeEach(async ({ request }, testInfo) => {
    // Use a per-test user ID for isolation; include worker index for parallel safety
    const userId = uid(`e2e-${testInfo.project.name}-${testInfo.workerIndex}`);
    testInfo.attachments.push({ name: "userId", contentType: "text/plain", body: Buffer.from(userId) } as any);
    // Stash in testInfo for later hooks via annotations
    (testInfo as any)._userId = userId;

    // Best-effort cleanup in case of retries
    await cleanupUserTemplates(request, userId);
  });

  test.afterEach(async ({ request }, testInfo) => {
    const userId = (testInfo as any)._userId as string | undefined;
    if (userId) {
      await cleanupUserTemplates(request, userId);
    }
  });

  test("create, edit, delete via UI", async ({ page, browserName }, testInfo) => {
    if (process.env.CI && browserName === "webkit") {
      test.skip(true, "Skip WebKit on CI due to flakiness");
    }

    const userId = (testInfo as any)._userId as string;

    await page.goto(`${APP_URL}/templates`);
    await expect(page.getByTestId("templates-page")).toBeVisible();
    await expect(page.getByTestId("user-templates-section")).toBeVisible();

    await page.getByTestId("user-id-input").fill(userId);

    const emptyVisible = await page.getByTestId("empty-state").isVisible().catch(() => false);
    if (emptyVisible) {
      await page.getByTestId("empty-cta").click();
    } else {
      await page.getByTestId("new-template-btn").click();
    }

    const name = uid("WelcomeTemplate");
    await page.getByTestId("name-input").fill(name);
    await page.getByTestId("description-input").fill("E2E created template");
    await page.getByTestId("system-prompt-input").fill("You are a helpful assistant.");
    await page.getByTestId("user-prompt-template-input").fill("Hi {{name}}, welcome to {{company}}!");
    await page.getByTestId("tags-input").fill("onboarding, e2e");

    await expect(page.getByTestId("detected-vars")).toContainText("name");

    await page.getByTestId("submit-btn").click();

    const row = page.getByTestId("template-row").filter({ hasText: name });
    await expect(row).toBeVisible();

    await row.getByTestId("edit-btn").click();
    const newName = `${name}-edited`;
    const nameInput = page.getByTestId("name-input");
    await nameInput.fill("");
    await nameInput.fill(newName);
    await page.getByTestId("submit-btn").click();

    const updatedRow = page.getByTestId("template-row").filter({ hasText: newName });
    await expect(updatedRow).toBeVisible();

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await updatedRow.getByTestId("delete-btn").click();

    await expect(page.getByTestId("template-row").filter({ hasText: newName })).toHaveCount(0);
  });
});