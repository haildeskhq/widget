import { ChatWindowConfig, ChatMessage, ChatAttachment } from '../types';
import { createVoiceNotePlayer } from './voiceNotePlayer';
import { formatMessageBody } from './formatMessage';

export type { ChatWindowConfig, ChatMessage };

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
];
const AUDIO_TYPES = ['audio/webm', 'audio/ogg', 'audio/mp4'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_RECORDING_SECONDS = 300; // 5 minutes
const MIC_MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];

function pickMicMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  return MIC_MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported?.(t)) ?? '';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
  updateHeaderTitle: (name: string) => void;
  showResolveOption: () => void;
} {
  const uploadEnabled = !!(config.apiUrl && config.apiKey);

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

  const hasFaqs = !!(config.faqs && config.faqs.length > 0);
  const faqBtnHtml = hasFaqs
    ? `<button class="haildesk-faq-btn" aria-label="View FAQs">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </button>`
    : '';

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
    ${faqBtnHtml}
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
  const MIC_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3z"/></svg>`;

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
      } else if (att.mimeType.startsWith('audio/')) {
        const icon = document.createElement('span');
        icon.className = 'haildesk-attachment-icon';
        icon.innerHTML = MIC_ICON;
        chip.appendChild(icon);
        const name = document.createElement('span');
        name.textContent = att.durationSec !== undefined ? `Voice note · ${formatDuration(att.durationSec)}` : 'Voice note';
        chip.appendChild(name);
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
    if (!uploadEnabled) return;
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) continue;
      isUploading = true;
      uploadingFiles.push(file.name);
      renderAttachmentPreview();
      updateSendBtn();
      plusBtn.disabled = true;
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${config.apiUrl}/widget/upload`, {
          method: 'POST',
          headers: { 'X-API-Key': config.apiKey! },
          body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        const json = await res.json() as { data?: { url?: string } };
        const url = json.data?.url;
        if (url) {
          pendingAttachments.push({ filename: file.name, url, mimeType: file.type, size: file.size });
        }
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

  if (uploadEnabled) {
    plusBtn.addEventListener('click', () => fileInput.click());
  } else {
    plusBtn.style.opacity = '0.4';
    plusBtn.style.cursor = 'default';
  }

  // Voice notes (Pro/Enterprise only)
  const voiceNotesEnabled = uploadEnabled && !!config.voiceNotesEnabled && typeof MediaRecorder !== 'undefined';

  let mediaRecorder: MediaRecorder | null = null;
  let recordedChunks: Blob[] = [];
  let recordingMimeType = '';
  let recordingSeconds = 0;
  let recordingTimer: ReturnType<typeof setInterval> | null = null;
  let stopAction: 'send' | 'cancel' = 'send';
  let isRecording = false;

  const recordingBar = document.createElement('div');
  recordingBar.className = 'haildesk-recording-bar';
  recordingBar.style.display = 'none';

  const recordingDot = document.createElement('span');
  recordingDot.className = 'haildesk-recording-dot';
  const recordingTime = document.createElement('span');
  recordingTime.className = 'haildesk-recording-time';
  recordingTime.textContent = '0:00';
  const recordingLabel = document.createElement('span');
  recordingLabel.className = 'haildesk-recording-label';
  recordingLabel.textContent = 'Recording voice note…';

  const recordingCancelBtn = document.createElement('button');
  recordingCancelBtn.className = 'haildesk-recording-btn haildesk-recording-cancel';
  recordingCancelBtn.setAttribute('aria-label', 'Cancel recording');
  recordingCancelBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  const recordingStopBtn = document.createElement('button');
  recordingStopBtn.className = 'haildesk-recording-btn haildesk-recording-stop';
  recordingStopBtn.setAttribute('aria-label', 'Stop and attach');
  recordingStopBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12.75 10 18.75 20 5.25"/></svg>`;

  recordingBar.appendChild(recordingDot);
  recordingBar.appendChild(recordingTime);
  recordingBar.appendChild(recordingLabel);
  recordingBar.appendChild(recordingCancelBtn);
  recordingBar.appendChild(recordingStopBtn);

  async function uploadVoiceNote(file: File, durationSec: number): Promise<void> {
    isUploading = true;
    uploadingFiles.push(file.name);
    renderAttachmentPreview();
    updateSendBtn();
    plusBtn.disabled = true;
    micBtn.disabled = true;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${config.apiUrl}/widget/upload`, {
        method: 'POST',
        headers: { 'X-API-Key': config.apiKey! },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const json = await res.json() as { data?: { url?: string } };
      const url = json.data?.url;
      if (url) {
        pendingAttachments.push({ filename: file.name, url, mimeType: file.type, size: file.size, durationSec });
      }
    } catch {
      // silently skip failed uploads
    } finally {
      uploadingFiles = uploadingFiles.filter((n) => n !== file.name);
      isUploading = false;
      plusBtn.disabled = false;
      micBtn.disabled = false;
      renderAttachmentPreview();
      updateSendBtn();
    }
  }

  function stopRecording(action: 'send' | 'cancel'): void {
    stopAction = action;
    if (recordingTimer) {
      clearInterval(recordingTimer);
      recordingTimer = null;
    }
    isRecording = false;
    recordingBar.style.display = 'none';
    mediaRecorder?.stop();
  }

  async function startRecording(): Promise<void> {
    if (!voiceNotesEnabled || isRecording) return;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      // Permission denied or unavailable — silently no-op, mic button stays usable to retry
      return;
    }

    const mimeType = pickMicMimeType();
    recordingMimeType = mimeType;
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    recordedChunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const chunks = recordedChunks;
      recordedChunks = [];
      if (stopAction === 'send' && chunks.length > 0) {
        const finalMimeType = recordingMimeType || chunks[0].type || 'audio/webm';
        if (AUDIO_TYPES.includes(finalMimeType.split(';')[0].trim())) {
          const file = new File([new Blob(chunks, { type: finalMimeType })], `voice-note-${Date.now()}.webm`, { type: finalMimeType });
          void uploadVoiceNote(file, recordingSeconds);
        }
      }
    };

    mediaRecorder = recorder;
    recordingSeconds = 0;
    recordingTime.textContent = formatDuration(0);
    recorder.start();
    isRecording = true;
    recordingBar.style.display = 'flex';

    recordingTimer = setInterval(() => {
      recordingSeconds += 1;
      recordingTime.textContent = formatDuration(recordingSeconds);
      if (recordingSeconds >= MAX_RECORDING_SECONDS) {
        stopRecording('send');
      }
    }, 1000);
  }

  recordingCancelBtn.addEventListener('click', () => stopRecording('cancel'));
  recordingStopBtn.addEventListener('click', () => stopRecording('send'));

  const micBtn = document.createElement('button');
  micBtn.className = 'haildesk-mic-btn';
  micBtn.setAttribute('aria-label', 'Record voice note');
  micBtn.innerHTML = MIC_ICON;

  if (voiceNotesEnabled) {
    micBtn.addEventListener('click', () => void startRecording());
  } else {
    micBtn.style.opacity = '0.4';
    micBtn.style.cursor = 'default';
    micBtn.title = uploadEnabled ? 'Voice notes are available on Pro/Enterprise plans' : '';
  }

  inputArea.appendChild(plusBtn);
  inputArea.appendChild(micBtn);
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
      <p class="haildesk-name-prompt-sub">How can we reach you?</p>
      <input
        class="haildesk-name-input"
        type="text"
        placeholder="Your name"
        maxlength="60"
        aria-label="Your name"
      />
      <input
        class="haildesk-email-input"
        type="email"
        placeholder="Email address"
        maxlength="120"
        autocomplete="email"
        aria-label="Email address"
      />
      <button class="haildesk-name-submit-btn" disabled>Start chat</button>
    </div>
  `;

  const nameInput = namePrompt.querySelector('.haildesk-name-input') as HTMLInputElement;
  const emailInput = namePrompt.querySelector('.haildesk-email-input') as HTMLInputElement;
  const nameSubmitBtn = namePrompt.querySelector('.haildesk-name-submit-btn') as HTMLButtonElement;

  const updateNameSubmit = () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    nameSubmitBtn.disabled = name.length === 0 || !isValidEmail(email);
  };

  nameInput.addEventListener('input', updateNameSubmit);
  emailInput.addEventListener('input', updateNameSubmit);

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !nameSubmitBtn.disabled) {
      e.preventDefault();
      submitName();
    }
  });

  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !nameSubmitBtn.disabled) {
      e.preventDefault();
      submitName();
    }
  });

  nameSubmitBtn.addEventListener('click', submitName);

  function submitName(): void {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    if (!name || !isValidEmail(email)) return;
    namePrompt.style.display = 'none';
    config.onContactProvided?.({ name, email });
  }

  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

  // FAQ view — a full replacement for the chat content, shown via the header's FAQ button
  const faqView = document.createElement('div');
  faqView.className = 'haildesk-faq-view';
  faqView.style.display = 'none';

  const faqHeader = document.createElement('div');
  faqHeader.className = 'haildesk-faq-header';
  faqHeader.innerHTML = `
    <button class="haildesk-faq-back-btn" aria-label="Back to chat">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <span class="haildesk-faq-header-title">FAQs</span>
  `;

  const faqList = document.createElement('div');
  faqList.className = 'haildesk-faq-list';

  (config.faqs ?? []).forEach((faq) => {
    const item = document.createElement('div');
    item.className = 'haildesk-faq-item';

    const questionBtn = document.createElement('button');
    questionBtn.className = 'haildesk-faq-question';
    questionBtn.innerHTML = `
      <span>${faq.question}</span>
      <svg class="haildesk-faq-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    `;

    const answerEl = document.createElement('div');
    answerEl.className = 'haildesk-faq-answer';
    answerEl.textContent = faq.answer;
    answerEl.style.display = 'none';

    questionBtn.addEventListener('click', () => {
      const isOpen = answerEl.style.display !== 'none';
      answerEl.style.display = isOpen ? 'none' : 'block';
      item.classList.toggle('haildesk-faq-item--open', !isOpen);
    });

    item.appendChild(questionBtn);
    item.appendChild(answerEl);
    faqList.appendChild(item);
  });

  faqView.appendChild(faqHeader);
  faqView.appendChild(faqList);

  window.appendChild(header);
  window.appendChild(namePrompt);
  window.appendChild(messagesContainer);
  window.appendChild(typingEl);
  window.appendChild(satisfactionModal);
  window.appendChild(resolveBar);
  window.appendChild(recordingBar);
  window.appendChild(attachmentPreview);
  window.appendChild(inputArea);
  window.appendChild(footer);
  window.appendChild(faqView);

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

  const faqBtn = header.querySelector('.haildesk-faq-btn') as HTMLButtonElement | null;
  const faqBackBtn = faqHeader.querySelector('.haildesk-faq-back-btn') as HTMLButtonElement;
  const chatViewEls = [
    namePrompt, messagesContainer, typingEl, satisfactionModal,
    resolveBar, recordingBar, attachmentPreview, inputArea, footer,
  ];

  faqBtn?.addEventListener('click', () => {
    chatViewEls.forEach((el) => {
      el.dataset.haildeskPrevDisplay = el.style.display;
      el.style.display = 'none';
    });
    faqView.style.display = 'flex';
  });

  faqBackBtn.addEventListener('click', () => {
    faqView.style.display = 'none';
    chatViewEls.forEach((el) => {
      el.style.display = el.dataset.haildeskPrevDisplay ?? '';
    });
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
      bubble.innerHTML = formatMessageBody(message.body);
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
        } else if (att.mimeType.startsWith('audio/')) {
          wrapper.appendChild(createVoiceNotePlayer(att.url, att.durationSec));
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

  const headerTitleEl = header.querySelector('.haildesk-header-title') as HTMLDivElement;
  function updateHeaderTitle(name: string): void {
    headerTitleEl.textContent = name;
  }

  function showResolveOption(): void {
    resolveBar.style.display = 'flex';
  }

  return { element: window, addMessage, showTyping, hideTyping, enableInput, updateDisclosure, updateHeaderTitle, showResolveOption };
}
