import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

type LayoutShiftSource = {
  tag: string | null;
  id: string | null;
  className: string | null;
  text: string | null;
  previousRect: DOMRectReadOnly | null;
  currentRect: DOMRectReadOnly | null;
};

type LayoutShiftEntry = {
  value: number;
  sources: LayoutShiftSource[];
};

type LayoutShiftObserverEntry = {
  value: number;
  hadRecentInput: boolean;
  sources?: Array<{
    node?: Element | null;
    previousRect?: DOMRectReadOnly;
    currentRect?: DOMRectReadOnly;
  }>;
};

type LayoutShiftReport = {
  total: number;
  shifts: LayoutShiftEntry[];
  maxOverflowX: number;
  maxJitter: number;
  jitterEvents: Array<{
    selector: string;
    delta: number;
    frame: number;
    scrollY: number;
    mode: 'document' | 'viewport';
  }>;
};

const routesToCheck = ['/', '/blog', '/blog/welcome', '/test/workflow-badge'];
const maxClsAllowed = 0.1;
const maxOverflowAllowed = 1;
const maxJitterAllowed = 3;
const jitterFrameLimit = 240;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function collectLayoutShifts(page): Promise<LayoutShiftReport> {
  await page.evaluate(() => {
    const w = window as unknown as {
      __layoutShifts?: LayoutShiftEntry[];
      __layoutShiftObserver?: PerformanceObserver;
      __maxOverflowX?: number;
      __jitterEvents?: LayoutShiftReport['jitterEvents'];
      __maxJitter?: number;
    };

    w.__layoutShifts = [];
    w.__maxOverflowX = 0;
    w.__jitterEvents = [];
    w.__maxJitter = 0;

    const updateOverflow = () => {
      const overflow = Math.max(
        0,
        document.documentElement.scrollWidth - window.innerWidth
      );
      w.__maxOverflowX = Math.max(w.__maxOverflowX ?? 0, overflow);
    };

    updateOverflow();

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LayoutShiftObserverEntry[]) {
        if (entry.hadRecentInput) {
          continue;
        }
        const sources = (entry.sources || []).map((source) => {
          const node = source.node as Element | null;
          const text = node?.textContent?.trim().slice(0, 80) ?? null;
          return {
            tag: node?.tagName ?? null,
            id: node?.id ?? null,
            className: node?.className?.toString() ?? null,
            text,
            previousRect: source.previousRect ?? null,
            currentRect: source.currentRect ?? null,
          };
        });
        w.__layoutShifts?.push({ value: entry.value, sources });
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });
    w.__layoutShiftObserver = observer;

    window.addEventListener('resize', updateOverflow);
    window.addEventListener('scroll', updateOverflow, { passive: true });
  });

  await page.evaluate(
    async ({ jitterFrameLimit, maxJitterAllowed }) => {
      const step = Math.max(240, Math.floor(window.innerHeight * 0.75));
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );

      const pause = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      const candidates = Array.from(
        document.querySelectorAll(
          [
            '[data-stability]',
            'main',
            'header',
            'footer',
            'section',
            'article',
            'nav',
            '.controls-dock',
            'img',
            'video',
            'h1',
            'h2',
            'h3',
            'button',
            'a',
          ].join(',')
        )
      );

      const unique = new Set<Element>();
      const tracked = candidates.filter((el) => {
        if (unique.has(el)) return false;
        unique.add(el);
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      const limit = 80;
      const elements = tracked.slice(0, limit);

      const inferMode = (el: Element): 'document' | 'viewport' => {
        let current: Element | null = el;
        while (current) {
          const position = window.getComputedStyle(current).position;
          if (position === 'fixed' || position === 'sticky') {
            return 'viewport';
          }
          current = current.parentElement;
        }
        return 'document';
      };

      const elementInfo = elements.map((el) => {
        const mode = inferMode(el);
        const selector = el.id
          ? `#${el.id}`
          : el.className
            ? `.${el.className.toString().split(' ').slice(0, 2).join('.')}`
            : el.tagName.toLowerCase();

        return { el, mode, selector };
      });

      let frame = 0;
      const lastPositions = new Map<Element, number>();

      const sample = () => {
        const w = window as unknown as {
          __jitterEvents?: LayoutShiftReport['jitterEvents'];
          __maxJitter?: number;
        };
        const scrollY = window.scrollY;

        for (const info of elementInfo) {
          const rect = info.el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) {
            continue;
          }
          const pos = info.mode === 'document' ? rect.top + scrollY : rect.top;
          const prev = lastPositions.get(info.el);
          if (prev !== undefined) {
            const delta = Math.abs(pos - prev);
            if (delta > maxJitterAllowed) {
              w.__jitterEvents?.push({
                selector: info.selector,
                delta,
                frame,
                scrollY,
                mode: info.mode,
              });
              w.__maxJitter = Math.max(w.__maxJitter ?? 0, delta);
            }
          }
          lastPositions.set(info.el, pos);
        }

        frame += 1;
      };

      const scrollSteps = [];
      let current = 0;
      while (current < maxScroll) {
        current = Math.min(current + step, maxScroll);
        scrollSteps.push(current);
      }
      scrollSteps.push(0);

      for (const target of scrollSteps) {
        window.scrollTo(0, target);
        const start = performance.now();
        while (performance.now() - start < 200 && frame < jitterFrameLimit) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
          sample();
        }
        await pause(80);
        if (frame >= jitterFrameLimit) {
          break;
        }
      }
    },
    { jitterFrameLimit, maxJitterAllowed }
  );

  return page.evaluate(() => {
    const w = window as unknown as {
      __layoutShifts?: LayoutShiftEntry[];
      __layoutShiftObserver?: PerformanceObserver;
      __maxOverflowX?: number;
      __jitterEvents?: LayoutShiftReport['jitterEvents'];
      __maxJitter?: number;
    };

    w.__layoutShiftObserver?.disconnect();

    const shifts = w.__layoutShifts ?? [];
    const total = shifts.reduce((sum, entry) => sum + entry.value, 0);
    const maxOverflowX = w.__maxOverflowX ?? 0;
    const jitterEvents = w.__jitterEvents ?? [];
    const maxJitter = w.__maxJitter ?? 0;

    return { total, shifts, maxOverflowX, maxJitter, jitterEvents };
  });
}

test.describe('Layout stress test', () => {
  for (const route of routesToCheck) {
    test(`Scroll stability: ${route}`, async ({ page }, testInfo) => {
      await page.goto(route, { waitUntil: 'networkidle' });
      await sleep(250);

      const report = await collectLayoutShifts(page);
      const topShifts = [...report.shifts]
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
      const topJitter = [...report.jitterEvents]
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 6);

      const reportPayload = {
        route,
        total: report.total,
        maxOverflowX: report.maxOverflowX,
        maxJitter: report.maxJitter,
        topShifts,
        topJitter,
      };

      const reportPath = testInfo.outputPath('layout-report.json');
      await writeFile(
        reportPath,
        JSON.stringify(reportPayload, null, 2),
        'utf8'
      );

      await testInfo.attach('layout-shifts', {
        path: reportPath,
        contentType: 'application/json',
      });

      expect(
        report.maxOverflowX,
        `Horizontal overflow detected on ${route}: ${report.maxOverflowX}px`
      ).toBeLessThanOrEqual(maxOverflowAllowed);

      expect(
        report.total,
        `CLS ${report.total.toFixed(3)} exceeds ${maxClsAllowed} on ${route}`
      ).toBeLessThanOrEqual(maxClsAllowed);

      expect(
        report.maxJitter,
        `Max jitter ${report.maxJitter.toFixed(
          2
        )}px exceeds ${maxJitterAllowed}px on ${route}. Top jitter: ${JSON.stringify(
          topJitter[0] ?? null
        )}`
      ).toBeLessThanOrEqual(maxJitterAllowed);
    });
  }
});
