import { ChatWindowConfig, ChatMessage } from '../types';

export type { ChatWindowConfig, ChatMessage };

export function createChatWindow(
  config: ChatWindowConfig,
  onSendMessage: (body: string) => void
): {
  element: HTMLDivElement;
  addMessage: (message: ChatMessage) => void;
  showTyping: () => void;
  hideTyping: () => void;
  enableInput: () => void;
  updateDisclosure: (text: string) => void;
} {
  const window = document.createElement('div');
  window.className = [
    'haildesk-window',
    config.position === 'bottom-left' ? 'haildesk-window--left' : '',
    'haildesk-window--hidden',
  ]
    .filter(Boolean)
    .join(' ');
  window.style.setProperty('--haildesk-primary', config.primaryColor);
  if (config.secondaryColor) window.style.setProperty('--haildesk-secondary', config.secondaryColor);
  window.setAttribute('role', 'dialog');
  window.setAttribute('aria-label', 'Support chat');

  const displayName = config.headerTitle ?? config.orgName ?? 'Support';
  const avatarHtml = config.aiPersonaAvatar
    ? `<img src="${config.aiPersonaAvatar}" alt="${displayName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
       </svg>`;

  const header = document.createElement('div');
  header.className = 'haildesk-header';
  header.innerHTML = `
    <div class="haildesk-header-avatar">
      ${avatarHtml}
    </div>
    <div class="haildesk-header-info">
      <div class="haildesk-header-title">${displayName}</div>
      <div class="haildesk-header-status ${!config.isOnline ? 'haildesk-header-status--offline' : ''}">
        ${config.isOnline ? 'Online' : 'Offline'}
      </div>
    </div>
    <button class="haildesk-close-btn" aria-label="Close chat">
      <svg viewBox="0 0 24 24">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;

  const messagesContainer = document.createElement('div');
  messagesContainer.className = 'haildesk-messages';
  messagesContainer.setAttribute('aria-live', 'polite');

  const greeting = document.createElement('div');
  greeting.className = 'haildesk-greeting';
  greeting.innerHTML = `
    <div class="haildesk-greeting-emoji">👋</div>
    <p class="haildesk-greeting-text">${config.greeting}</p>
  `;
  messagesContainer.appendChild(greeting);

  if (!config.isOnline) {
    const offlineEl = document.createElement('div');
    offlineEl.className = 'haildesk-offline-message';
    offlineEl.textContent = config.offlineMessage;
    messagesContainer.appendChild(offlineEl);
  }

  const typingEl = document.createElement('div');
  typingEl.className = 'haildesk-message haildesk-message--agent haildesk-typing';
  typingEl.innerHTML = `
    <div class="haildesk-typing-dots">
      <span></span><span></span><span></span>
    </div>
  `;
  typingEl.style.display = 'none';

  const inputArea = document.createElement('div');
  inputArea.className = 'haildesk-input-area';

  const textarea = document.createElement('textarea');
  textarea.className = 'haildesk-input';
  textarea.placeholder = 'Type your message...';
  textarea.rows = 1;
  textarea.setAttribute('aria-label', 'Message input');

  const sendBtn = document.createElement('button');
  sendBtn.className = 'haildesk-send-btn';
  sendBtn.setAttribute('aria-label', 'Send message');
  sendBtn.disabled = true;
  sendBtn.innerHTML = `
    <svg viewBox="0 0 24 24">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  `;

  textarea.addEventListener('input', () => {
    const hasValue = textarea.value.trim().length > 0;
    sendBtn.disabled = !hasValue;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
  });

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  function sendMessage(): void {
    const body = textarea.value.trim();
    if (!body) return;
    textarea.value = '';
    textarea.style.height = 'auto';
    sendBtn.disabled = true;
    onSendMessage(body);
  }

  const plusBtn = document.createElement('button');
  plusBtn.className = 'haildesk-plus-btn';
  plusBtn.setAttribute('aria-label', 'Attach file');
  plusBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

  const emojiBtn = document.createElement('button');
  emojiBtn.className = 'haildesk-emoji-btn';
  emojiBtn.setAttribute('aria-label', 'Emoji');
  emojiBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`;

  inputArea.appendChild(plusBtn);
  inputArea.appendChild(textarea);
  inputArea.appendChild(emojiBtn);
  inputArea.appendChild(sendBtn);

  const namePrompt = document.createElement('div');
  namePrompt.className = 'haildesk-name-prompt';
  namePrompt.setAttribute('aria-label', 'Enter your name to start chatting');
  namePrompt.style.display = config.requireNamePrompt ? 'flex' : 'none';
  namePrompt.innerHTML = `
    <div class="haildesk-name-prompt-inner">
      <div class="haildesk-name-prompt-emoji">👋</div>
      <p class="haildesk-name-prompt-title">Before we start…</p>
      <p class="haildesk-name-prompt-sub">What should we call you?</p>
      <input
        class="haildesk-name-input"
        type="text"
        placeholder="Your name"
        maxlength="60"
        aria-label="Your name"
      />
      <button class="haildesk-name-submit-btn" disabled>Start chat</button>
    </div>
  `;

  const nameInput = namePrompt.querySelector('.haildesk-name-input') as HTMLInputElement;
  const nameSubmitBtn = namePrompt.querySelector('.haildesk-name-submit-btn') as HTMLButtonElement;

  nameInput.addEventListener('input', () => {
    nameSubmitBtn.disabled = nameInput.value.trim().length === 0;
  });

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && nameInput.value.trim()) {
      submitName();
    }
  });

  nameSubmitBtn.addEventListener('click', submitName);

  function submitName(): void {
    const name = nameInput.value.trim();
    if (!name) return;
    namePrompt.style.display = 'none';
    config.onNameProvided?.(name);
  }

  if (config.requireNamePrompt) {
    textarea.disabled = true;
    sendBtn.disabled = true;
  }

  const footer = document.createElement('div');
  footer.className = 'haildesk-footer';
  if (config.disclosureEnabled && config.disclosureText) {
    footer.textContent = config.disclosureText;
  } else {
    footer.textContent = `Powered by ${displayName}`;
  }

  window.appendChild(header);
  window.appendChild(namePrompt);
  window.appendChild(messagesContainer);
  window.appendChild(typingEl);
  window.appendChild(inputArea);
  window.appendChild(footer);

  const closeBtn = header.querySelector('.haildesk-close-btn') as HTMLButtonElement;
  closeBtn.addEventListener('click', () => {
    window.classList.add('haildesk-window--hidden');
  });

  function addMessage(message: ChatMessage): void {
    const greetingEl = messagesContainer.querySelector('.haildesk-greeting');
    if (greetingEl) {
      greetingEl.remove();
    }

    const messageEl = document.createElement('div');
    const displayType = message.senderType === 'ai' ? 'agent' : message.senderType;
    messageEl.className = `haildesk-message haildesk-message--${displayType}`;

    const bubble = document.createElement('div');
    bubble.className = 'haildesk-message-bubble';
    bubble.textContent = message.body;

    const time = document.createElement('div');
    time.className = 'haildesk-message-time';
    time.textContent = new Date(message.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const wrapper = document.createElement('div');
    wrapper.appendChild(bubble);
    wrapper.appendChild(time);

    messageEl.appendChild(wrapper);
    messagesContainer.appendChild(messageEl);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showTyping(): void {
    typingEl.style.display = 'flex';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function hideTyping(): void {
    typingEl.style.display = 'none';
  }

  function enableInput(): void {
    textarea.disabled = false;
    sendBtn.disabled = textarea.value.trim().length === 0;
  }

  function updateDisclosure(text: string): void {
    footer.textContent = text;
  }

  return { element: window, addMessage, showTyping, hideTyping, enableInput, updateDisclosure };
}
