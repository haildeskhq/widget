import { createBubble, updateBubbleIcon, updateBubbleCount } from "./ui/bubble";
import { createChatWindow } from "./ui/chatWindow";
import { WidgetSocket } from "./socket/WidgetSocket";
import { HaildeskWidgetConfig, ChatMessage, ChatAttachment, OrgConfig } from "./types";
import widgetCss from "./styles/widget.css?inline";

// export type { HaildeskWidgetConfig };

const LS_NAME_KEY = "haildesk-customer-name";
const LS_CUSTOMER_ID_KEY = "haildesk-customer-id";
const LS_CONVERSATION_KEY = "haildesk-conversation-id";

export class HaildeskWidget {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private customerConfig: Omit<HaildeskWidgetConfig, "apiKey" | "apiUrl">;

  private shadowRoot: ShadowRoot | null = null;
  private hostEl: HTMLDivElement | null = null;
  private bubbleEl: HTMLButtonElement | null = null;
  private windowEl: HTMLDivElement | null = null;
  private isOpen = false;
  private unreadCount = 0;

  private socket: WidgetSocket | null = null;
  private conversationId: string | null = null;
  private addMessageToWindow: ((msg: ChatMessage) => void) | null = null;
  private showTyping: (() => void) | null = null;
  private hideTyping: (() => void) | null = null;
  private enableInput: (() => void) | null = null;
  private updateDisclosure: ((text: string) => void) | null = null;
  private showResolveOption: (() => void) | null = null;

  private orgConfig: OrgConfig = {
    greeting: "Hi! How can we help you today?",
    position: "bottom-right",
    primaryColor: "#4F46E5",
    iconColor: "#ffffff",
    secondaryColor: "#1e2a3a",
    isOnline: true,
    offlineMessage:
      "We're currently offline. Leave a message and we'll get back to you.",
    orgName: "Support",
    orgLogoUrl: null,
    aiEnabled: false,
    aiPersonaName: "Assistant",
    aiPersonaAvatar: "",
    disclosureEnabled: true,
    disclosureText: "✦ AI-assisted",
    disclosureLiveText: "✦ Live support",
  };

  constructor(config: HaildeskWidgetConfig) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl ?? import.meta.env.VITE_API_URL ?? "http://localhost:3001";

    const storedName = this.readStoredName();

    const resolvedCustomerId =
      config.customerId ?? this.resolveAnonymousCustomerId();

    this.customerConfig = {
      customerId: resolvedCustomerId,
      customerEmail: config.customerEmail,
      customerName: config.customerName ?? storedName ?? undefined,
    };

    this.conversationId = this.readFromStorage(LS_CONVERSATION_KEY);
  }

  private resolveAnonymousCustomerId(): string {
    const stored = this.readFromStorage(LS_CUSTOMER_ID_KEY);
    if (stored) return stored;
    const uuid = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
    const id = `anon-${uuid}`;
    this.writeToStorage(LS_CUSTOMER_ID_KEY, id);
    return id;
  }

  private readFromStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeToStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
    }
  }

  private readStoredName(): string | null {
    return this.readFromStorage(LS_NAME_KEY);
  }

  private storeCustomerName(name: string): void {
    this.writeToStorage(LS_NAME_KEY, name);
  }

  async init(): Promise<void> {
    await this.loadOrgConfig();
    this.createShadowDOM();
    this.renderBubble();
    this.renderWindow();
    this.initSocket();
  }

  private async loadOrgConfig(): Promise<void> {
    try {
      const res = await fetch(`${this.apiUrl}/widget/widget-config`, {
        headers: { "X-API-Key": this.apiKey },
      });
      if (res.ok) {
        const data = (await res.json()) as { data?: Partial<OrgConfig> };
        if (data.data) {
          this.orgConfig = { ...this.orgConfig, ...data.data };
        }
      }
    } catch {
      // silently use defaults
    }
  }

  private createShadowDOM(): void {
    this.hostEl = document.createElement("div");
    this.hostEl.id = "haildesk-widget-host";
    this.hostEl.setAttribute("data-haildesk", "true");

    this.shadowRoot = this.hostEl.attachShadow({ mode: "open" });

    if (!document.getElementById("haildesk-fredoka-font")) {
      const link = document.createElement("link");
      link.id = "haildesk-fredoka-font";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(link);
    }

    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&display=swap";
    this.shadowRoot.appendChild(fontLink);

    const styleEl = document.createElement("style");
    styleEl.textContent = widgetCss;
    this.shadowRoot.appendChild(styleEl);

    document.body.appendChild(this.hostEl);
  }

  private renderBubble(): void {
    if (!this.shadowRoot) return;

    this.bubbleEl = createBubble(() => this.toggle(), {
      position: this.orgConfig.position,
      primaryColor: this.orgConfig.primaryColor,
      iconColor: this.orgConfig.iconColor,
      unreadCount: this.unreadCount,
    });

    this.shadowRoot.appendChild(this.bubbleEl);
  }

  private renderWindow(): void {
    if (!this.shadowRoot) return;

    const needsNamePrompt = !this.customerConfig.customerName;

    const windowConfig = {
      ...this.orgConfig,
      headerTitle: this.orgConfig.aiEnabled && this.orgConfig.aiPersonaName
        ? this.orgConfig.aiPersonaName
        : this.orgConfig.orgName,
      aiPersonaAvatar: this.orgConfig.aiPersonaAvatar,
      disclosureEnabled: this.orgConfig.disclosureEnabled,
      disclosureText: this.orgConfig.disclosureText,
      requireNamePrompt: needsNamePrompt,
      onNameProvided: (name: string) => {
        this.storeCustomerName(name);
        this.customerConfig = { ...this.customerConfig, customerName: name };
        this.socket?.disconnect();
        this.initSocket();
        this.enableInput?.();
      },
    };

    const { element, addMessage, showTyping, hideTyping, enableInput, updateDisclosure, showResolveOption } =
      createChatWindow(windowConfig, (body, attachments) => this.handleSendMessage(body, attachments), (satisfied) => this.handleResolve(satisfied));

    this.windowEl = element;
    this.addMessageToWindow = addMessage;
    this.showTyping = showTyping;
    this.hideTyping = hideTyping;
    this.enableInput = enableInput;
    this.updateDisclosure = updateDisclosure;
    this.showResolveOption = showResolveOption;

    const closeBtn = element.querySelector(".haildesk-close-btn");
    closeBtn?.addEventListener("click", () => this.close());

    this.shadowRoot.appendChild(element);
  }

  private initSocket(): void {
    this.socket = new WidgetSocket({
      apiUrl: this.apiUrl,
      apiKey: this.apiKey,
      customerId: this.customerConfig.customerId,
      customerEmail: this.customerConfig.customerEmail,
      customerName: this.customerConfig.customerName,
      conversationId: this.conversationId ?? undefined,
    });

    this.socket.onConnect(() => {
      if (this.conversationId) {
        this.loadConversationHistory(this.conversationId);
      }
    });

    this.socket.onMessage((message) => {
      this.addMessageToWindow?.({
        id: message.id,
        body: message.body,
        senderType: message.senderType,
        createdAt: new Date(message.createdAt),
        attachments: message.attachments,
      });

      if ((message.senderType === 'ai' || message.senderType === 'agent') && this.conversationId) {
        this.showResolveOption?.();
      }

      if (message.senderType === 'agent' && this.orgConfig.disclosureEnabled) {
        this.updateDisclosure?.(this.orgConfig.disclosureLiveText ?? '✦ Live support');
      }

      if (!this.isOpen) {
        this.unreadCount++;
        if (this.bubbleEl) {
          updateBubbleCount(this.bubbleEl, this.unreadCount);
        }
      }
    });

    this.socket.onTypingStart(() => this.showTyping?.());
    this.socket.onTypingStop(() => this.hideTyping?.());

    this.socket.connect();
  }

  private loadConversationHistory(conversationId: string): void {
    this.socket?.fetchMessages(conversationId, (messages) => {
      messages.forEach((msg) => {
        this.addMessageToWindow?.({
          id: msg.id,
          body: msg.body,
          senderType: msg.senderType,
          createdAt: new Date(msg.createdAt),
          attachments: msg.attachments,
        });
      });
    });
  }

  private handleSendMessage(body: string, attachments?: ChatAttachment[]): void {
    this.addMessageToWindow?.({
      id: `local-${Date.now()}`,
      body,
      senderType: "customer",
      createdAt: new Date(),
      attachments,
    });

    this.socket?.sendMessage(body, (confirmedConversationId) => {
      if (this.conversationId !== confirmedConversationId) {
        this.conversationId = confirmedConversationId;
        this.writeToStorage(LS_CONVERSATION_KEY, confirmedConversationId);
      }
    }, attachments);
  }

  private async handleResolve(satisfied: boolean): Promise<void> {
    if (!this.conversationId) return;
    try {
      await fetch(`${this.apiUrl}/widget/conversations/${this.conversationId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': this.apiKey },
        body: JSON.stringify({ satisfied }),
      });
    } catch {
      // fire-and-forget — UI already shows closed state
    }
    // Clear stored conversation so next open starts fresh
    this.conversationId = null;
    this.writeToStorage(LS_CONVERSATION_KEY, '');
  }

  open(): void {
    if (!this.windowEl || !this.bubbleEl) return;
    this.isOpen = true;
    this.windowEl.classList.remove("haildesk-window--hidden");
    updateBubbleIcon(this.bubbleEl, true);

    this.unreadCount = 0;
    updateBubbleCount(this.bubbleEl, 0);
  }

  close(): void {
    if (!this.windowEl || !this.bubbleEl) return;
    this.isOpen = false;
    this.windowEl.classList.add("haildesk-window--hidden");
    updateBubbleIcon(this.bubbleEl, false);
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  destroy(): void {
    this.socket?.disconnect();
    this.hostEl?.remove();
    this.hostEl = null;
    this.shadowRoot = null;
    this.bubbleEl = null;
    this.windowEl = null;
    this.socket = null;
  }
}
