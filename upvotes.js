(function () {
  const apiBase = (window.BRIEF_API_BASE || '').replace(/\/$/, '');
  const placeholderBase = 'https://your-render-service-name.onrender.com';

  function isConfigured() {
    return apiBase.length > 0 && apiBase !== placeholderBase;
  }

  function slugFromHref(href) {
    if (!href) return null;
    const match = href.match(/\/briefs\/([a-z0-9-]+)\.html$/i);
    if (!match) return null;
    const slug = match[1];
    if (slug === 'index' || slug === '_template') return null;
    return slug;
  }

  function pathSlug() {
    const match = window.location.pathname.match(/\/briefs\/([a-z0-9-]+)\.html$/i);
    if (!match) return null;
    const slug = match[1];
    if (slug === 'index' || slug === '_template') return null;
    return slug;
  }

  function votedKey(slug) {
    return `cdbrief_voted_${slug}`;
  }

  function markVoted(slug) {
    try {
      localStorage.setItem(votedKey(slug), '1');
    } catch (_err) {
      // ignore localStorage issues
    }
  }

  function hasVoted(slug) {
    try {
      return localStorage.getItem(votedKey(slug)) === '1';
    } catch (_err) {
      return false;
    }
  }

  function createButton(slug, count, compact) {
    const wrapper = document.createElement('span');
    wrapper.style.marginLeft = '0.5rem';

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = hasVoted(slug) ? 'Upvoted' : 'Upvote';
    button.disabled = !isConfigured() || hasVoted(slug);
    button.dataset.slug = slug;
    button.style.marginLeft = compact ? '0.25rem' : '0';

    const countNode = document.createElement('span');
    countNode.dataset.slug = slug;
    countNode.dataset.role = 'count';
    countNode.style.marginLeft = '0.35rem';
    countNode.textContent = `(${count})`;

    wrapper.appendChild(button);
    wrapper.appendChild(countNode);

    button.addEventListener('click', async () => {
      if (button.disabled || !isConfigured()) return;
      button.disabled = true;
      button.textContent = 'Voting...';
      try {
        const response = await fetch(`${apiBase}/api/v1/upvotes/${encodeURIComponent(slug)}`, {
          method: 'POST'
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to vote');
        }
        const allCountNodes = document.querySelectorAll(`[data-role="count"][data-slug="${slug}"]`);
        allCountNodes.forEach((node) => {
          node.textContent = `(${Number(data.votes || 0)})`;
        });
        markVoted(slug);
        button.textContent = 'Upvoted';
      } catch (_err) {
        button.disabled = false;
        button.textContent = 'Upvote';
      }
    });

    return wrapper;
  }

  async function fetchCounts() {
    if (!isConfigured()) return {};
    try {
      const response = await fetch(`${apiBase}/api/v1/upvotes`);
      if (!response.ok) return {};
      const data = await response.json();
      return data.counts || {};
    } catch (_err) {
      return {};
    }
  }

  async function init() {
    const counts = await fetchCounts();

    const links = document.querySelectorAll('a[href^="/briefs/"][href$=".html"]');
    links.forEach((link) => {
      const slug = slugFromHref(link.getAttribute('href'));
      if (!slug) return;
      const li = link.closest('li');
      if (!li || li.querySelector(`button[data-slug="${slug}"]`)) return;
      const count = Number(counts[slug] || 0);
      li.appendChild(createButton(slug, count, true));
    });

    const currentSlug = pathSlug();
    if (currentSlug && !document.querySelector('#brief-upvote-box')) {
      const heading = document.querySelector('h1');
      if (heading && heading.parentNode) {
        const box = document.createElement('section');
        box.id = 'brief-upvote-box';
        const title = document.createElement('h2');
        title.textContent = 'Community Signal';
        const p = document.createElement('p');
        p.textContent = 'If this Customer Discovery Brief is useful, upvote it.';
        const count = Number(counts[currentSlug] || 0);
        const controls = createButton(currentSlug, count, false);
        box.appendChild(title);
        box.appendChild(p);
        box.appendChild(controls);
        heading.parentNode.insertBefore(box, heading.nextSibling);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
