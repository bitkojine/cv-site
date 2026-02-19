import { describe, expect, it } from 'vitest';
import {
  bindMailtoLinks,
  buildMailtoHref,
  installMailtoLinkHandler,
} from '../../src/lib/mailto-links.mts';

type ClickHandler = (event: { preventDefault: () => void }) => void;

class MockLink {
  dataset: Record<string, string> = {};
  private attributes = new Map<string, string>();
  private clickHandlers: ClickHandler[] = [];

  constructor(attributes: Record<string, string>) {
    for (const [key, value] of Object.entries(attributes)) {
      this.attributes.set(key, value);
    }
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  addEventListener(eventName: string, handler: ClickHandler): void {
    if (eventName === 'click') {
      this.clickHandlers.push(handler);
    }
  }

  get clickListenerCount(): number {
    return this.clickHandlers.length;
  }

  click(): { defaultPrevented: boolean } {
    let defaultPrevented = false;
    const event = {
      preventDefault: () => {
        defaultPrevented = true;
      },
    };
    this.clickHandlers.forEach((handler) => { handler(event); });
    return { defaultPrevented };
  }
}

class MockDocument {
  readyState: DocumentReadyState = 'complete';
  links: MockLink[] = [];
  listeners = new Map<string, (() => void)[]>();

  querySelectorAll<T>(selector: string): NodeListOf<T> {
    void selector;
    return this.links as unknown as NodeListOf<T>;
  }

  addEventListener(eventName: string, handler: () => void): void {
    const existing = this.listeners.get(eventName) || [];
    existing.push(handler);
    this.listeners.set(eventName, existing);
  }

  emit(eventName: string): void {
    const handlers = this.listeners.get(eventName) || [];
    handlers.forEach((handler) => { handler(); });
  }
}

describe('buildMailtoHref', () => {
  it('builds a mailto href with subject and body', () => {
    const link = new MockLink({
      'data-email-local': 'john',
      'data-email-domain': 'example.com',
      'data-email-subject': 'Hello%20there',
      'data-email-body': 'Line%201',
    });

    expect(buildMailtoHref(link as unknown as HTMLElement)).toBe(
      'mailto:john@example.com?subject=Hello%20there&body=Line%201'
    );
  });

  it('returns a plain mailto href when subject/body are empty', () => {
    const link = new MockLink({
      'data-email-local': 'john',
      'data-email-domain': 'example.com',
    });

    expect(buildMailtoHref(link as unknown as HTMLElement)).toBe(
      'mailto:john@example.com'
    );
  });

  it('returns null when required email parts are missing', () => {
    const link = new MockLink({
      'data-email-local': 'john',
    });

    expect(buildMailtoHref(link as unknown as HTMLElement)).toBeNull();
  });
});

describe('bindMailtoLinks', () => {
  it('binds click once and navigates on valid link', () => {
    const link = new MockLink({
      'data-email-local': 'john',
      'data-email-domain': 'example.com',
    }),
     doc = new MockDocument();
    doc.links = [link];
    const win = { location: { href: '' } };

    bindMailtoLinks(doc as unknown as Document, win as unknown as Window);
    bindMailtoLinks(doc as unknown as Document, win as unknown as Window);
    const event = link.click();

    expect(link.clickListenerCount).toBe(1);
    expect(event.defaultPrevented).toBe(true);
    expect(win.location.href).toBe('mailto:john@example.com');
  });

  it('does not prevent default when link is missing required attributes', () => {
    const link = new MockLink({
      'data-email-local': 'john',
    }),
     doc = new MockDocument();
    doc.links = [link];
    const win = { location: { href: 'unchanged' } };

    bindMailtoLinks(doc as unknown as Document, win as unknown as Window);
    const event = link.click();

    expect(event.defaultPrevented).toBe(false);
    expect(win.location.href).toBe('unchanged');
  });
});

describe('installMailtoLinkHandler', () => {
  it('installs handlers only once and binds again on astro:page-load', () => {
    const initialLink = new MockLink({
      'data-email-local': 'first',
      'data-email-domain': 'example.com',
    }),
     nextLink = new MockLink({
      'data-email-local': 'second',
      'data-email-domain': 'example.com',
    }),
     doc = new MockDocument();
    doc.readyState = 'complete';
    doc.links = [initialLink];
    const win = { location: { href: '' } };

    installMailtoLinkHandler(
      win as unknown as Window,
      doc as unknown as Document
    );
    installMailtoLinkHandler(
      win as unknown as Window,
      doc as unknown as Document
    );

    doc.links = [initialLink, nextLink];
    doc.emit('astro:page-load');
    nextLink.click();

    expect(doc.listeners.get('astro:page-load')?.length).toBe(1);
    expect(nextLink.clickListenerCount).toBe(1);
    expect(win.location.href).toBe('mailto:second@example.com');
  });

  it('registers DOMContentLoaded when the document is still loading', () => {
    const doc = new MockDocument();
    doc.readyState = 'loading';
    const link = new MockLink({
      'data-email-local': 'dom',
      'data-email-domain': 'example.com',
    });
    doc.links = [link];
    const win = { location: { href: '' } };

    installMailtoLinkHandler(
      win as unknown as Window,
      doc as unknown as Document
    );
    doc.emit('DOMContentLoaded');
    link.click();

    expect(doc.listeners.get('DOMContentLoaded')?.length).toBe(1);
    expect(win.location.href).toBe('mailto:dom@example.com');
  });

  it('marks the window as installed', () => {
    const doc = new MockDocument(),
     win = { location: { href: '' } };

    installMailtoLinkHandler(
      win as unknown as Window,
      doc as unknown as Document
    );

    expect(
      (win as unknown as { __cvMailtoInstallerReady?: boolean })
        .__cvMailtoInstallerReady
    ).toBe(true);
  });
});
