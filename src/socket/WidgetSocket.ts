import { io, Socket } from 'socket.io-client';
import { WidgetSocketConfig, IncomingMessage, ChatAttachment } from '../types';

// The server's wire format — Mongo documents use `_id`, not `id`.
interface RawMessage extends Omit<IncomingMessage, 'id'> {
  _id: string;
}

function mapMessage(raw: RawMessage): IncomingMessage {
  return {
    id: raw._id,
    body: raw.body,
    senderType: raw.senderType,
    senderName: raw.senderName,
    createdAt: raw.createdAt,
    conversationId: raw.conversationId,
    attachments: raw.attachments,
    editedAt: raw.editedAt,
    deletedAt: raw.deletedAt,
  };
}

type SendAck =
  | { message: RawMessage; conversationId: string }
  | { error: string };

interface MessageDeletedPayload {
  messageId: string;
  conversationId: string;
}

export class WidgetSocket {
  private socket: Socket | null = null;
  private readonly config: WidgetSocketConfig;
  private conversationId: string | null;

  private onMessageCallback: ((message: IncomingMessage) => void) | null = null;
  private onMessageUpdatedCallback: ((message: IncomingMessage) => void) | null = null;
  private onMessageDeletedCallback: ((messageId: string) => void) | null = null;
  private onTypingStartCallback: (() => void) | null = null;
  private onTypingStopCallback: (() => void) | null = null;
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;

  constructor(config: WidgetSocketConfig) {
    this.config = config;
    this.conversationId = config.conversationId ?? null;
  }

  connect(): void {
    const socketUrl = new URL(this.config.apiUrl).origin;
    const auth = this.config.orgSlug
      ? { orgSlug: this.config.orgSlug, customerId: this.config.customerId }
      : { apiKey: this.config.apiKey, customerId: this.config.customerId };
    this.socket = io(socketUrl, {
      auth,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      if (this.conversationId) {
        this.joinConversation(this.conversationId);
      }
      this.onConnectCallback?.();
    });

    this.socket.on('disconnect', () => {
      this.onDisconnectCallback?.();
    });

    this.socket.on('message:new', (message: RawMessage) => {
      if (message.senderType !== 'customer') {
        this.onMessageCallback?.(mapMessage(message));
      }
    });

    this.socket.on('message:updated', (message: RawMessage) => {
      if (message.senderType !== 'customer') {
        this.onMessageUpdatedCallback?.(mapMessage(message));
      }
    });

    this.socket.on('message:deleted', (payload: MessageDeletedPayload) => {
      this.onMessageDeletedCallback?.(payload.messageId);
    });

    this.socket.on('agent:typing', () => {
      this.onTypingStartCallback?.();
    });

    this.socket.on('agent:stopped_typing', () => {
      this.onTypingStopCallback?.();
    });
  }

  joinConversation(conversationId: string): void {
    this.conversationId = conversationId;
    this.socket?.emit('conversation:join', conversationId);
  }

  sendMessage(body: string, onConfirmed?: (conversationId: string) => void, attachments?: ChatAttachment[]): void {
    this.socket?.emit(
      'message:send',
      {
        conversationId: this.conversationId ?? undefined,
        body,
        customerId: this.config.customerId,
        customerEmail: this.config.customerEmail,
        customerName: this.config.customerName,
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
      },
      (ack: SendAck) => {
        if ('error' in ack) {
          console.error('[WidgetSocket] Message send failed:', ack.error);
          return;
        }
        if (!this.conversationId) {
          this.joinConversation(ack.conversationId);
        }
        onConfirmed?.(ack.conversationId);
      }
    );
  }

  fetchMessages(
    conversationId: string,
    onMessages: (messages: IncomingMessage[]) => void
  ): void {
    this.socket?.emit(
      'messages:list',
      { conversationId, page: 1, limit: 50 },
      (response: { data?: RawMessage[]; error?: string }) => {
        if (response.data) {
          onMessages(response.data.map(mapMessage));
        }
      }
    );
  }

  emitTypingStart(): void {
    if (this.conversationId) {
      this.socket?.emit('typing:start', { conversationId: this.conversationId });
    }
  }

  emitTypingStop(): void {
    if (this.conversationId) {
      this.socket?.emit('typing:stop', { conversationId: this.conversationId });
    }
  }

  onMessage(callback: (message: IncomingMessage) => void): void {
    this.onMessageCallback = callback;
  }

  onMessageUpdated(callback: (message: IncomingMessage) => void): void {
    this.onMessageUpdatedCallback = callback;
  }

  onMessageDeleted(callback: (messageId: string) => void): void {
    this.onMessageDeletedCallback = callback;
  }

  onTypingStart(callback: () => void): void {
    this.onTypingStartCallback = callback;
  }

  onTypingStop(callback: () => void): void {
    this.onTypingStopCallback = callback;
  }

  onConnect(callback: () => void): void {
    this.onConnectCallback = callback;
  }

  onDisconnect(callback: () => void): void {
    this.onDisconnectCallback = callback;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
