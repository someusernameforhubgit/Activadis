(function () {
  const defaultConfig = {
    selector: 'header',
    title: {
      prefixHtml: '<b><span class="accent">Acti</span>vadis</b>',
      suffix: '',
      subtitle: null,
      subtitlePrefix: ': '
    },
    navLeft: [],
    login: {
      href: '/login',
      label: 'Login',
      icon: 'fas fa-sign-in-alt',
      visible: true
    },
    logout: {
      visible: true,
      showName: true,
      label: 'Logout',
      icon: null,
      handler: 'logout'
    },
    rightItems: []
  };

  let lastConfig = null;
  let headerInitialized = false;
  const readyCallbacks = [];

  function normalizeConfig(config) {
    const merged = JSON.parse(JSON.stringify(defaultConfig));
    if (config) {
      if (config.selector) merged.selector = config.selector;

      if (config.title) {
        merged.title = {
          ...merged.title,
          ...config.title,
        };
      }

      if (Array.isArray(config.navLeft)) {
        merged.navLeft = config.navLeft.map((item) => ({ ...item }));
      }

      if (config.login) {
        merged.login = {
          ...merged.login,
          ...config.login,
        };
      }

      if (config.logout) {
        merged.logout = {
          ...merged.logout,
          ...config.logout,
        };
      }

      if (Array.isArray(config.rightItems)) {
        merged.rightItems = config.rightItems.map((item) => ({ ...item }));
      }
    }

    return merged;
  }

  function ensureHeaderElement(selector) {
    let headerEl = null;

    if (selector) {
      headerEl = document.querySelector(selector);
    }

    if (!headerEl) {
      headerEl = document.querySelector('header');
    }

    if (!headerEl) {
      headerEl = document.createElement('header');
      document.body.insertBefore(headerEl, document.body.firstChild || null);
    }

    headerEl.setAttribute('data-component', 'site-header');
    return headerEl;
  }

  function renderNavItems(items) {
    if (!Array.isArray(items)) return '';

    return items
      .map((item) => {
        if (!item || (!item.href && !item.onClick)) {
          return '';
        }

        const classes = [item.className, item.active ? 'active' : null]
          .filter(Boolean)
          .join(' ');

        const iconHtml = item.icon ? `<i class="${item.icon}"></i>` : '';
        const label = item.label || '';

        const attributes = [];
        if (item.href) {
          attributes.push(`href="${item.href}"`);
        } else {
          attributes.push('href="#"');
          attributes.push('role="button"');
        }

        if (item.target) {
          attributes.push(`target="${item.target}"`);
        }

        if (item.onClick) {
          const handlerName = typeof item.onClick === 'string' ? item.onClick : null;
          if (handlerName) {
            attributes.push(`onclick="${handlerName}(event)"`);
          }
        }

        return `<a ${classes ? `class="${classes}" ` : ''}${attributes.join(' ')}>${iconHtml}${label}</a>`;
      })
      .join('');
  }

  function renderRightItems(items) {
    if (!Array.isArray(items) || items.length === 0) return '';

    return items
      .map((item) => {
        if (!item) return '';
        const classes = ['header-action', item.className].filter(Boolean).join(' ');
        const tag = item.tag || 'a';
        const iconHtml = item.icon ? `<i class="${item.icon}"></i>` : '';
        const label = item.label || '';

        if (tag === 'button') {
          const attrs = [
            classes ? `class="${classes}"` : '',
            item.type ? `type="${item.type}"` : 'type="button"',
            item.onClick ? `onclick="${item.onClick}(event)"` : '',
          ]
            .filter(Boolean)
            .join(' ');

          return `<button ${attrs}>${iconHtml}${label}</button>`;
        }

        const attrs = [
          classes ? `class="${classes}"` : '',
          item.href ? `href="${item.href}"` : '',
          item.target ? `target="${item.target}"` : '',
          item.onClick ? `onclick="${item.onClick}(event)"` : '',
        ]
          .filter(Boolean)
          .join(' ');

        return `<a ${attrs}>${iconHtml}${label}</a>`;
      })
      .join('');
  }

  function renderLoginSection(config) {
    const parts = [];

    if (config.login.visible) {
      const iconHtml = config.login.icon ? `<i class="${config.login.icon}"></i>` : '';
      parts.push(
        `<a class="login" href="${config.login.href}">${iconHtml}${config.login.label}</a>`
      );
    }

    if (config.logout.visible && config.logout.showName) {
      parts.push('<p class="logout name"></p>');
    }

    if (config.logout.visible) {
      const iconHtml = config.logout.icon ? `<i class="${config.logout.icon}"></i>` : '';
      const handler = config.logout.handler || 'logout';
      parts.push(
        `<a class="logout" onclick="${handler}()">${iconHtml}${config.logout.label}</a>`
      );
    }

    return parts.join('');
  }

  function renderTitle(titleConfig) {
    let suffix = '';
    if (titleConfig.subtitle) {
      const prefix = titleConfig.subtitlePrefix ?? defaultConfig.title.subtitlePrefix;
      suffix = `${prefix}${titleConfig.subtitle}`;
    } else if (titleConfig.suffix) {
      suffix = titleConfig.suffix;
    }

    return `<p>${titleConfig.prefixHtml}${suffix}</p>`;
  }

  function renderHeader(config) {
    const normalized = normalizeConfig(config);
    const headerEl = ensureHeaderElement(normalized.selector);

    headerEl.innerHTML = `
      <div class="container">
        <div class="left">
          ${renderTitle(normalized.title)}
          <nav>
            <div class="nav-left">
              ${renderNavItems(normalized.navLeft)}
            </div>
            <div class="nav-right">
              ${renderRightItems(normalized.rightItems)}
              ${renderLoginSection(normalized)}
            </div>
          </nav>
        </div>
      </div>
    `;

    lastConfig = normalized;
    headerInitialized = true;

    while (readyCallbacks.length) {
      const callback = readyCallbacks.shift();
      try {
        callback(normalized);
      } catch (error) {
        console.error('Header ready callback error:', error);
      }
    }

    const event = new CustomEvent('header:ready', { detail: normalized });
    document.dispatchEvent(event);
    return normalized;
  }

  window.renderHeader = renderHeader;

  window.onHeaderReady = function (callback) {
    if (typeof callback !== 'function') return;
    if (headerInitialized) {
      try {
        callback(lastConfig);
      } catch (error) {
        console.error('Header ready callback error:', error);
      }
    } else {
      readyCallbacks.push(callback);
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (!headerInitialized && window.headerConfig) {
      renderHeader(window.headerConfig);
    }
  });
})();
