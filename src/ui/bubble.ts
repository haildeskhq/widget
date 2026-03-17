import { BubbleConfig } from '../types';

export type { BubbleConfig };

export function createBubble(
  onClick: () => void,
  config: BubbleConfig
): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = `haildesk-bubble${config.position === 'bottom-left' ? ' haildesk-bubble--left' : ''}`;
  button.setAttribute('aria-label', 'Open support chat');
  button.setAttribute('title', 'Chat with us');
  button.style.setProperty('--haildesk-primary', config.primaryColor);
  if (config.iconColor) button.style.setProperty('--haildesk-icon', config.iconColor);

  const chatIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  `;

  const closeIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `;

  button.innerHTML = chatIcon;
  button.dataset.chatIcon = chatIcon;
  button.dataset.closeIcon = closeIcon;

  if (config.unreadCount && config.unreadCount > 0) {
    const badge = document.createElement('span');
    badge.className = 'haildesk-badge';
    badge.textContent = config.unreadCount > 9 ? '9+' : String(config.unreadCount);
    button.appendChild(badge);
  }

  button.addEventListener('click', onClick);

  return button;
}

export function updateBubbleIcon(
  button: HTMLButtonElement,
  isOpen: boolean
): void {
  const icon = isOpen ? button.dataset.closeIcon : button.dataset.chatIcon;
  const svgEl = button.querySelector('svg');
  if (svgEl && icon) {
    const temp = document.createElement('div');
    temp.innerHTML = icon;
    const newSvg = temp.querySelector('svg');
    if (newSvg) {
      svgEl.replaceWith(newSvg);
    }
  }
}

export function updateBubbleCount(
  button: HTMLButtonElement,
  count: number
): void {
  let badge = button.querySelector<HTMLSpanElement>('.haildesk-badge');
  if (count > 0) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'haildesk-badge';
      button.appendChild(badge);
    }
    badge.textContent = count > 9 ? '9+' : String(count);
  } else if (badge) {
    badge.remove();
  }
}
