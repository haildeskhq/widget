import { UploadManager } from '@bytescale/sdk';
import { ChatWindowConfig, ChatMessage, ChatAttachment } from '../types';

export type { ChatWindowConfig, ChatMessage };

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function createChatWindow(
  config: ChatWindowConfig,
  onSendMessage: (body: string, attachments?: ChatAttachment[]) => void,
  onResolve?: (satisfied: boolean) => void
): {
  element: HTMLDivElement;
  addMessage: (message: ChatMessage) => void;
  showTyping: () => void;
  hideTyping: () => void;
  enableInput: () => void;
  updateDisclosure: (text: string) => void;
  showResolveOption: () => void;
} {
  const bytescaleApiKey = (import.meta as { env?: { VITE_BYTESCALE_API_KEY?: string } }).env?.VITE_BYTESCALE_API_KEY ?? '';
  const uploadManager = bytescaleApiKey ? new UploadManager({ apiKey: bytescaleApiKey }) : null;

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
  const avatarImg = config.aiPersonaAvatar || config.orgLogoUrl;
  const avatarHtml = avatarImg
    ? `<img src="${avatarImg}" alt="${displayName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
       </svg>`;

  let isFullscreen = false;

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
    <button class="haildesk-expand-btn" aria-label="Expand chat">
      <svg class="haildesk-expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
        <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
      </svg>
      <svg class="haildesk-compress-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
        <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
        <line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/>
      </svg>
    </button>
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

  // Pending attachments state
  let pendingAttachments: ChatAttachment[] = [];
  let isUploading = false;
  let uploadingFiles: string[] = [];

  // Pending attachments preview bar
  const attachmentPreview = document.createElement('div');
  attachmentPreview.className = 'haildesk-attachment-preview';
  attachmentPreview.style.display = 'none';

  const PDF_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><text x="6" y="18" font-size="5" fill="#ef4444" stroke="none" font-family="sans-serif" font-weight="bold">PDF</text></svg>`;

  function renderAttachmentPreview(): void {
    attachmentPreview.innerHTML = '';
    if (pendingAttachments.length === 0 && uploadingFiles.length === 0) {
      attachmentPreview.style.display = 'none';
      return;
    }
    attachmentPreview.style.display = 'flex';

    // Loading chips
    uploadingFiles.forEach((filename) => {
      const chip = document.createElement('div');
      chip.className = 'haildesk-attachment-chip haildesk-attachment-chip--loading';
      chip.innerHTML = `<span class="haildesk-upload-spinner"></span><span>${filename.length > 14 ? filename.slice(0, 12) + '…' : filename}</span>`;
      attachmentPreview.appendChild(chip);
    });

    // Completed chips
    pendingAttachments.forEach((att, i) => {
      const chip = document.createElement('div');
      chip.className = 'haildesk-attachment-chip';

      if (att.mimeType.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = att.url;
        img.alt = att.filename;
        img.className = 'haildesk-attachment-thumb';
        chip.appendChild(img);
      } else {
        const icon = document.createElement('span');
        icon.className = 'haildesk-attachment-icon';
        icon.innerHTML = PDF_ICON;
        chip.appendChild(icon);
        const name = document.createElement('span');
        name.textContent = att.filename.length > 14 ? att.filename.slice(0, 12) + '…' : att.filename;
        chip.appendChild(name);
      }

      const removeBtn = document.createElement('button');
      removeBtn.className = 'haildesk-attachment-remove';
      removeBtn.innerHTML = '&times;';
      removeBtn.setAttribute('aria-label', 'Remove attachment');
      removeBtn.addEventListener('click', () => {
        pendingAttachments = pendingAttachments.filter((_, idx) => idx !== i);
        renderAttachmentPreview();
        updateSendBtn();
      });
      chip.appendChild(removeBtn);
      attachmentPreview.appendChild(chip);
    });
  }

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

  function updateSendBtn(): void {
    sendBtn.disabled = isUploading || (textarea.value.trim().length === 0 && pendingAttachments.length === 0);
  }

  textarea.addEventListener('input', () => {
    updateSendBtn();
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
    if ((!body && pendingAttachments.length === 0) || isUploading) return;
    const attachments = pendingAttachments.length > 0 ? [...pendingAttachments] : undefined;
    textarea.value = '';
    textarea.style.height = 'auto';
    pendingAttachments = [];
    renderAttachmentPreview();
    updateSendBtn();
    onSendMessage(body || ' ', attachments);
  }

  // File input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.multiple = true;
  fileInput.accept = ALLOWED_TYPES.join(',');
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', () => {
    void handleFiles(Array.from(fileInput.files ?? []));
    fileInput.value = '';
  });

  async function handleFiles(files: File[]): Promise<void> {
    if (!uploadManager) return;
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) continue;
      isUploading = true;
      uploadingFiles.push(file.name);
      renderAttachmentPreview();
      updateSendBtn();
      plusBtn.disabled = true;
      try {
        const { fileUrl } = await uploadManager.upload({
          data: file,
          mime: file.type,
          originalFileName: file.name,
        });
        pendingAttachments.push({ filename: file.name, url: fileUrl, mimeType: file.type, size: file.size });
      } catch {
        // silently skip failed uploads
      } finally {
        uploadingFiles = uploadingFiles.filter((n) => n !== file.name);
        isUploading = false;
        plusBtn.disabled = false;
        renderAttachmentPreview();
        updateSendBtn();
      }
    }
  }

  const plusBtn = document.createElement('button');
  plusBtn.className = 'haildesk-plus-btn';
  plusBtn.setAttribute('aria-label', 'Attach file');
  plusBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

  if (uploadManager) {
    plusBtn.addEventListener('click', () => fileInput.click());
  } else {
    plusBtn.style.opacity = '0.4';
    plusBtn.style.cursor = 'default';
  }

  inputArea.appendChild(plusBtn);
  inputArea.appendChild(fileInput);
  inputArea.appendChild(textarea);
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

  // Resolve bar — hidden until showResolveOption() is called
  const resolveBar = document.createElement('div');
  resolveBar.className = 'haildesk-resolve-bar';
  resolveBar.style.display = 'none';
  resolveBar.innerHTML = `<span class="haildesk-resolve-label">All sorted?</span><button class="haildesk-resolve-btn">Mark as resolved</button>`;

  const resolveBtn = resolveBar.querySelector('.haildesk-resolve-btn') as HTMLButtonElement;

  // Satisfaction modal — shown after resolve is clicked
  const satisfactionModal = document.createElement('div');
  satisfactionModal.className = 'haildesk-satisfaction-modal';
  satisfactionModal.style.display = 'none';
  satisfactionModal.innerHTML = `
    <p class="haildesk-satisfaction-title">Did we help?</p>
    <div class="haildesk-satisfaction-options">
      <button class="haildesk-satisfaction-btn haildesk-satisfaction-btn--yes" data-satisfied="true">✓ Got my answer</button>
      <button class="haildesk-satisfaction-btn haildesk-satisfaction-btn--no" data-satisfied="false">Not really</button>
    </div>
  `;

  resolveBtn.addEventListener('click', () => {
    resolveBar.style.display = 'none';
    satisfactionModal.style.display = 'flex';
  });

  satisfactionModal.querySelectorAll<HTMLButtonElement>('.haildesk-satisfaction-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const satisfied = btn.dataset.satisfied === 'true';
      satisfactionModal.style.display = 'none';
      // Show closed state
      inputArea.style.display = 'none';
      attachmentPreview.style.display = 'none';
      const closedEl = document.createElement('div');
      closedEl.className = 'haildesk-resolved-state';
      closedEl.textContent = 'Thanks for reaching out. This chat is now closed.';
      window.appendChild(closedEl);
      onResolve?.(satisfied);
    });
  });

  const footer = document.createElement('div');
  footer.className = 'haildesk-footer';

  function renderFooter(disclosureText?: string): void {
    footer.innerHTML = '';
    if (disclosureText) {
      const disclosureSpan = document.createElement('span');
      disclosureSpan.textContent = disclosureText;
      footer.appendChild(disclosureSpan);
    }
    if (config.plan !== 'enterprise') {
      if (disclosureText) {
        footer.appendChild(document.createTextNode(' · '));
      }
      const link = document.createElement('a');
      link.href = 'https://haildesk.com';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.cssText = 'color:inherit;text-decoration:underline;text-underline-offset:2px;';
      link.textContent = 'Powered by Haildesk';
      footer.appendChild(link);
    }
  }

  renderFooter(config.disclosureEnabled && config.disclosureText ? config.disclosureText : undefined);

  window.appendChild(header);
  window.appendChild(namePrompt);
  window.appendChild(messagesContainer);
  window.appendChild(typingEl);
  window.appendChild(satisfactionModal);
  window.appendChild(resolveBar);
  window.appendChild(attachmentPreview);
  window.appendChild(inputArea);
  window.appendChild(footer);

  const expandBtn = header.querySelector('.haildesk-expand-btn') as HTMLButtonElement;
  const expandIcon = expandBtn.querySelector('.haildesk-expand-icon') as SVGElement;
  const compressIcon = expandBtn.querySelector('.haildesk-compress-icon') as SVGElement;
  expandBtn.addEventListener('click', () => {
    isFullscreen = !isFullscreen;
    window.classList.toggle('haildesk-window--fullscreen', isFullscreen);
    expandIcon.style.display = isFullscreen ? 'none' : '';
    compressIcon.style.display = isFullscreen ? '' : 'none';
    expandBtn.setAttribute('aria-label', isFullscreen ? 'Collapse chat' : 'Expand chat');
  });

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

    const wrapper = document.createElement('div');

    const hasBody = message.body.trim().length > 0 && message.body.trim() !== ' ';
    if (hasBody) {
      const bubble = document.createElement('div');
      bubble.className = 'haildesk-message-bubble';
      bubble.textContent = message.body;
      wrapper.appendChild(bubble);
    }

    // Render attachments
    if (message.attachments && message.attachments.length > 0) {
      message.attachments.forEach((att) => {
        if (att.mimeType.startsWith('image/')) {
          const link = document.createElement('a');
          link.href = att.url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          const img = document.createElement('img');
          img.src = att.url;
          img.alt = att.filename;
          img.style.cssText = 'max-width:200px;max-height:150px;border-radius:8px;display:block;margin-top:4px;';
          link.appendChild(img);
          wrapper.appendChild(link);
        } else {
          const link = document.createElement('a');
          link.href = att.url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.className = 'haildesk-file-attachment';
          link.innerHTML = `<span class="haildesk-file-icon">📄</span><span class="haildesk-file-name">${att.filename}</span><span class="haildesk-file-size">${formatBytes(att.size)}</span>`;
          wrapper.appendChild(link);
        }
      });
    }

    const time = document.createElement('div');
    time.className = 'haildesk-message-time';
    time.textContent = new Date(message.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
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
    updateSendBtn();
  }

  function updateDisclosure(text: string): void {
    renderFooter(text || undefined);
  }

  function showResolveOption(): void {
    resolveBar.style.display = 'flex';
  }

  return { element: window, addMessage, showTyping, hideTyping, enableInput, updateDisclosure, showResolveOption };
}
