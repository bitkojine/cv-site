type MailtoLink = HTMLElement & {
  dataset: DOMStringMap;
};

type MailtoDocument = Pick<
  Document,
  'querySelectorAll' | 'readyState' | 'addEventListener'
>;

type MailtoWindow = Pick<Window, 'location'> & {
  __cvMailtoInstallerReady?: boolean;
};

export function buildMailtoHref(link: MailtoLink): string | null {
  const local = link.getAttribute('data-email-local') || '';
  const domain = link.getAttribute('data-email-domain') || '';
  if (!local || !domain) return null;

  const subject = link.getAttribute('data-email-subject') || '';
  const body = link.getAttribute('data-email-body') || '';
  const params = [];
  if (subject) params.push(`subject=${subject}`);
  if (body) params.push(`body=${body}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return `mailto:${local}@${domain}${query}`;
}

export function bindMailtoLinks(
  doc: Pick<Document, 'querySelectorAll'>,
  win: Pick<Window, 'location'>
): void {
  const links = doc.querySelectorAll<MailtoLink>('[data-mailto-link]');
  links.forEach((link) => {
    if (link.dataset.mailtoBound === '1') return;
    link.dataset.mailtoBound = '1';

    link.addEventListener('click', (event) => {
      const href = buildMailtoHref(link);
      if (!href) return;
      event.preventDefault();
      win.location.href = href;
    });
  });
}

export function installMailtoLinkHandler(
  win: MailtoWindow = window,
  doc: MailtoDocument = document
): void {
  if (win.__cvMailtoInstallerReady) return;
  win.__cvMailtoInstallerReady = true;

  const init = () => bindMailtoLinks(doc, win);
  doc.addEventListener('astro:page-load', init);

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}
