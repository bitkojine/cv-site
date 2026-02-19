function formatBuildVersion(date: Date): string {
  const formatter = new Intl.DateTimeFormat('lt-LT', {
    timeZone: 'Europe/Vilnius',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return `${formatter.format(date)} Vilnius`;
}

export const BUILD_VERSION = formatBuildVersion(new Date());
