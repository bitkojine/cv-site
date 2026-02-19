type MailtoLink = HTMLElement & {
  dataset: DOMStringMap;
};

type MailtoDocument = Pick<
  Document,
  'querySelectorAll' | 'readyState' | 'addEventListener'
>;

type MailtoWindow = Pick<Window, 'location'> & {
  __cvMailtoInstallerReady?: boolean;
  confirm?: (message?: string) => boolean;
};

const DEFAULT_CONFIRM_MESSAGE =
  'This will open your email client with a pre-filled template message to send to me. Continue?';

export function buildMailtoHref(link: MailtoLink): string | null {
  const local = link.getAttribute('data-email-local') || '',
    domain = link.getAttribute('data-email-domain') || '';
  if (!local || !domain) {
    return null;
  }

  const subject = link.getAttribute('data-email-subject') || '',
    body = link.getAttribute('data-email-body') || '',
    params = [];
  if (subject) {
    params.push(`subject=${subject}`);
  }
  if (body) {
    params.push(`body=${body}`);
  }
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return `mailto:${local}@${domain}${query}`;
}

export function bindMailtoLinks(
  doc: Pick<Document, 'querySelectorAll'>,
  win: MailtoWindow
): void {
  const links = doc.querySelectorAll<MailtoLink>('[data-mailto-link]');
  links.forEach((link) => {
    if (link.dataset.mailtoBound === '1') {
      return;
    }
    link.dataset.mailtoBound = '1';

    link.addEventListener('click', (event) => {
      const href = buildMailtoHref(link);
      if (!href) {
        return;
      }
      event.preventDefault();
      const confirmMessage =
        link.getAttribute('data-mailto-confirm-message') ||
        DEFAULT_CONFIRM_MESSAGE;
      if (typeof win.confirm === 'function' && !win.confirm(confirmMessage)) {
        return;
      }
      win.location.href = href;
    });
  });
}

export function installMailtoLinkHandler(
  win: MailtoWindow = window,
  doc: MailtoDocument = document
): void {
  if (win.__cvMailtoInstallerReady) {
    return;
  }
  win.__cvMailtoInstallerReady = true;

  const init = () => {
    bindMailtoLinks(doc, win);
  };
  doc.addEventListener('astro:page-load', init);

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}
