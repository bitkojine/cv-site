export type EventProps = Record<string, unknown>;

export type EventReporter = (eventName: string, props?: EventProps) => void;

type EventWindow = {
  dataLayer?: unknown;
  cvReportEvent?: EventReporter;
  cvTrack?: EventReporter;
};

export function reportToDataLayer(
  dataLayer: unknown,
  eventName: string,
  props: EventProps = {}
): boolean {
  if (!eventName || !Array.isArray(dataLayer)) {
    return false;
  }

  dataLayer.push({ event: eventName, ...props });
  return true;
}

export function installGlobalEventReporter(
  targetWindow: EventWindow
): EventReporter {
  const reporter: EventReporter = (eventName, props = {}) => {
    reportToDataLayer(targetWindow.dataLayer, eventName, props);
  };

  targetWindow.cvReportEvent = reporter;
  targetWindow.cvTrack = reporter;
  return reporter;
}
