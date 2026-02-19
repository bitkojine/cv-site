import { describe, expect, it } from 'vitest';
import {
  installGlobalEventReporter,
  reportToDataLayer,
} from '../../src/lib/event-reporting.mts';

describe('reportToDataLayer', () => {
  it('pushes an event payload when dataLayer exists', () => {
    const dataLayer: Record<string, unknown>[] = [],

     pushed = reportToDataLayer(dataLayer, 'share_completed', {
      method: 'copy_link',
    });

    expect(pushed).toBe(true);
    expect(dataLayer).toEqual([
      { event: 'share_completed', method: 'copy_link' },
    ]);
  });

  it('returns false for empty event names', () => {
    const dataLayer: Record<string, unknown>[] = [],

     pushed = reportToDataLayer(dataLayer, '');

    expect(pushed).toBe(false);
    expect(dataLayer).toEqual([]);
  });

  it('returns false when dataLayer is missing', () => {
    const pushed = reportToDataLayer(undefined, 'share_clicked');

    expect(pushed).toBe(false);
  });
});

describe('installGlobalEventReporter', () => {
  it('installs both cvReportEvent and cvTrack aliases', () => {
    const targetWindow: {
      dataLayer?: Record<string, unknown>[];
      cvReportEvent?: (
        eventName: string,
        props?: Record<string, unknown>
      ) => void;
      cvTrack?: (eventName: string, props?: Record<string, unknown>) => void;
    } = {
      dataLayer: [],
    },

     reporter = installGlobalEventReporter(targetWindow);

    expect(targetWindow.cvReportEvent).toBe(reporter);
    expect(targetWindow.cvTrack).toBe(reporter);
  });

  it('forwards events through cvTrack to dataLayer', () => {
    const dataLayer: Record<string, unknown>[] = [],
     targetWindow = { dataLayer };

    installGlobalEventReporter(targetWindow);
    targetWindow.cvTrack?.('mode_selected', { role: 'Founder / Operator' });

    expect(dataLayer).toEqual([
      { event: 'mode_selected', role: 'Founder / Operator' },
    ]);
  });
});
