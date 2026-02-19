import { showToast } from './ui-feedback.mts';

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
  document?: unknown;
};

type MailtoModalParts = {
  dialog: HTMLDialogElement;
  title: HTMLElement;
  body: HTMLElement;
  cancelButton: HTMLButtonElement;
  confirmButton: HTMLButtonElement;
};

type MailtoModalDocument = {
  body?: {
    append: (child: unknown) => unknown;
  } | null;
  querySelector?: (selector: string) => unknown;
  createElement?: (tag: string) => HTMLDialogElement;
};

let modalPromise: Promise<boolean> | null = null;
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
  doc: Pick<Document, 'querySelectorAll'> & Document,
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

      const linkText =
        typeof link.textContent === 'string' ? link.textContent : '';
      const title = linkText.trim() || 'this action';
      const maybeConfirmation = confirmMailtoOpen(doc, { title });

      const openDraft = () => {
        win.location.href = href;
        showToast(
          doc,
          'Opening your email client with a prefilled draft.',
          'success'
        );
      };

      const cancelDraft = () => {
        showToast(doc, 'Email draft canceled.', 'neutral');
      };

      const useLegacyConfirm =
        typeof win.confirm === 'function' && !('document' in win);
      if (useLegacyConfirm) {
        const confirmMessage =
          link.getAttribute('data-mailto-confirm-message') ||
          DEFAULT_CONFIRM_MESSAGE;
        if (!win.confirm?.(confirmMessage)) {
          cancelDraft();
          return;
        }
        openDraft();
        return;
      }

      if (typeof maybeConfirmation === 'boolean') {
        if (maybeConfirmation) {
          openDraft();
        } else {
          cancelDraft();
        }
        return;
      }

      void maybeConfirmation.then((shouldOpen) => {
        if (shouldOpen) {
          openDraft();
        } else {
          cancelDraft();
        }
      });
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
    bindMailtoLinks(doc as Document, win);
  };
  doc.addEventListener('astro:page-load', init);

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}

function ensureMailtoModal(doc: MailtoModalDocument): MailtoModalParts | null {
  if (typeof doc.querySelector !== 'function') return null;
  const existing = doc.querySelector(
    '[data-mailto-modal]'
  ) as HTMLDialogElement | null;
  if (existing) {
    const title = existing.querySelector<HTMLElement>('[data-mailto-title]');
    const body = existing.querySelector<HTMLElement>('[data-mailto-body]');
    const cancelButton = existing.querySelector<HTMLButtonElement>(
      '[data-mailto-cancel]'
    );
    const confirmButton = existing.querySelector<HTMLButtonElement>(
      '[data-mailto-confirm]'
    );
    if (title && body && cancelButton && confirmButton) {
      return { dialog: existing, title, body, cancelButton, confirmButton };
    }
    return null;
  }
  if (!doc.body || typeof doc.body.append !== 'function') return null;
  if (typeof doc.createElement !== 'function') return null;

  const dialog = doc.createElement('dialog');
  dialog.className = 'brand-modal';
  dialog.dataset.mailtoModal = '1';
  dialog.innerHTML = `
    <form class="brand-modal__surface" method="dialog">
      <p class="brand-modal__eyebrow">Before you continue</p>
      <h2 class="brand-modal__title" data-mailto-title>Email draft action</h2>
      <p class="brand-modal__body" data-mailto-body></p>
      <div class="brand-modal__actions">
        <button class="brand-modal__button brand-modal__cancel" data-mailto-cancel type="button">Cancel</button>
        <button autofocus class="cta-primary brand-modal__button" data-mailto-confirm type="button">Open email draft</button>
      </div>
    </form>
  `;
  doc.body.append(dialog);

  const title = dialog.querySelector<HTMLElement>('[data-mailto-title]');
  const body = dialog.querySelector<HTMLElement>('[data-mailto-body]');
  const cancelButton = dialog.querySelector<HTMLButtonElement>(
    '[data-mailto-cancel]'
  );
  const confirmButton = dialog.querySelector<HTMLButtonElement>(
    '[data-mailto-confirm]'
  );
  if (!title || !body || !cancelButton || !confirmButton) return null;

  return { dialog, title, body, cancelButton, confirmButton };
}

function confirmMailtoOpen(
  doc: Document,
  options: { title: string }
): boolean | Promise<boolean> {
  if (modalPromise) return modalPromise;
  const modal = ensureMailtoModal(doc);
  if (!modal || typeof modal.dialog.showModal !== 'function') {
    return true;
  }

  modal.title.textContent = options.title;
  modal.body.textContent =
    'This opens your email client and pre-fills a draft message to Robertas.';

  modalPromise = new Promise((resolve) => {
    const onCancel = () => {
      cleanup();
      resolve(false);
    };
    const onConfirm = () => {
      cleanup();
      resolve(true);
    };
    const onDialogCancel = (event: Event) => {
      event.preventDefault();
      onCancel();
    };
    const cleanup = () => {
      modal.cancelButton.removeEventListener('click', onCancel);
      modal.confirmButton.removeEventListener('click', onConfirm);
      modal.dialog.removeEventListener('cancel', onDialogCancel);
      if (modal.dialog.open) {
        modal.dialog.close();
      }
      modalPromise = null;
    };

    modal.cancelButton.addEventListener('click', onCancel, { once: true });
    modal.confirmButton.addEventListener('click', onConfirm, { once: true });
    modal.dialog.addEventListener('cancel', onDialogCancel, { once: true });
    modal.dialog.showModal();
  });

  return modalPromise;
}
