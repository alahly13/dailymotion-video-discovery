import { expect, test } from "@playwright/test";

const routes = [
  { name: "home", path: "/" },
  { name: "channel-explorer", path: "/channel-explorer" },
  { name: "channels", path: "/channels" },
  { name: "channel-source", path: "/channels/aa2475eb-e3f0-4505-90af-75c97c39ade5" },
  { name: "attempt-detail", path: "/channels/aa2475eb-e3f0-4505-90af-75c97c39ade5/attempts/7447a249-153b-49f3-baa6-27b5df8f5768" },
  { name: "search", path: "/search" },
  { name: "ai-search", path: "/ai-search" },
  { name: "saved", path: "/saved" },
];

const widths = [320, 375, 430, 640, 768, 1024, 1280, 1440, 1920];
const screenshotWidths = new Set([320, 768, 1440]);

for (const scheme of ["dark", "light"] as const) {
  test.describe(`responsive ${scheme}`, () => {
    for (const route of routes) {
      for (const width of widths) {
        test(`${route.name} ${width}px`, async ({ page }) => {
          await page.setViewportSize({ width, height: 940 });
          await page.emulateMedia({ colorScheme: scheme });
          await page.goto(route.path, { waitUntil: "domcontentloaded" });
          await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => undefined);
          await page.waitForTimeout(350);

          const overflow = await page.evaluate(() => {
            const documentWidth = document.documentElement.scrollWidth;
            const viewportWidth = document.documentElement.clientWidth;
            const visibleOffenders = Array.from(document.body.querySelectorAll<HTMLElement>("*"))
              .map((element) => {
                const rect = element.getBoundingClientRect();
                const styles = window.getComputedStyle(element);
                return { tag: element.tagName, className: String(element.className), rect, styles };
              })
              .filter(({ rect, styles }) => {
                if (styles.position === "fixed") return false;
                if (styles.display === "none" || styles.visibility === "hidden") return false;
                if (rect.width < 1 || rect.height < 1) return false;
                return rect.left < -2 || rect.right > window.innerWidth + 2;
              })
              .slice(0, 5)
              .map(({ tag, className, rect }) => ({
                tag,
                className,
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                width: Math.round(rect.width),
              }));

            return {
              documentWidth,
              viewportWidth,
              visibleOffenders,
              bodyTextLength: document.body.innerText.trim().length,
              nextDialog: Boolean(document.querySelector("[data-nextjs-dialog]")),
            };
          });

          expect(overflow.bodyTextLength).toBeGreaterThan(20);
          expect(overflow.nextDialog).toBe(false);
          expect(overflow.documentWidth, JSON.stringify(overflow.visibleOffenders, null, 2)).toBeLessThanOrEqual(overflow.viewportWidth + 2);

          if (screenshotWidths.has(width)) {
            await page.screenshot({
              path: `.codex-screenshots/${scheme}-${route.name}-${width}.png`,
              fullPage: true,
            });
          }
        });
      }
    }
  });
}
