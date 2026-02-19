type ToastTone = 'neutral' | 'success' | 'warning';

type ToastNode = {
  append: (child: unknown) => unknown;
};

type ToastElement = {
  id?: string;
  className: string;
  dataset: DOMStringMap;
  role?: string;
  ariaLive?: string;
  textContent: string | null;
  remove: () => void;
};

type ToastDocument = {
  body?: ToastNode | null;
  querySelector?: (selector: string) => unknown;
  createElement?: (tag: string) => ToastElement;
};

const TOAST_ROOT_ID = 'cv-toast-root';

function getToastRoot(doc: ToastDocument): ToastNode | null {
  if (typeof doc.querySelector === 'function') {
    const existingRoot = doc.querySelector(
      `#${TOAST_ROOT_ID}`
    ) as ToastNode | null;
    if (existingRoot) return existingRoot;
  }
  if (
    !doc.body ||
    typeof doc.body.append !== 'function' ||
    typeof doc.createElement !== 'function'
  ) {
    return null;
  }

  const root = doc.createElement('div');
  root.id = TOAST_ROOT_ID;
  root.className = 'site-toast-root';
  doc.body.append(root);
  return root;
}

export function showToast(
  doc: ToastDocument,
  message: string,
  tone: ToastTone = 'neutral'
): void {
  const root = getToastRoot(doc);
  if (!root) return;
  if (typeof doc.createElement !== 'function') return;

  const toast = doc.createElement('p');
  toast.className = 'site-toast';
  toast.dataset.toastTone = tone;
  toast.role = 'status';
  toast.ariaLive = 'polite';
  toast.textContent = message;
  root.append(toast);

  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      toast.dataset.visible = '1';
    });
  } else {
    toast.dataset.visible = '1';
  }

  window.setTimeout(() => {
    toast.dataset.visible = '0';
    window.setTimeout(() => {
      toast.remove();
    }, 180);
  }, 1800);
}
