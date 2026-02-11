// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.astro/types.d.ts" />

type EventProps = Record<string, unknown>;
type EventReporter = (eventName: string, props?: EventProps) => void;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    cvReportEvent?: EventReporter;
    cvTrack?: EventReporter;
  }
}

export {};
