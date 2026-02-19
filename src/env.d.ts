type EventProps = Record<string, unknown>;
type EventReporter = (eventName: string, props?: EventProps) => void;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    cvReportEvent?: EventReporter;
    cvTrack?: EventReporter;
  }
}

export {};
