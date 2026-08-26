export { HaildeskWidget } from './HaildeskWidget';
export type { HaildeskWidgetConfig } from './types';

// The chat window's CSS, normally injected into HaildeskWidget's shadow DOM.
// Standalone consumers (e.g. Support Pages) that render outside a shadow
// root need it as a plain string to inject themselves.
export { widgetStyles } from './styles/widgetStyles';

// Chat-core pieces, extracted for standalone consumers (e.g. the full-page
// Support Pages app) that render the chat UI outside the bubble/shadow-DOM
// shell HaildeskWidget provides.
export { WidgetSocket } from './socket/WidgetSocket';
export { createChatWindow } from './ui/chatWindow';
export { formatMessageBody } from './ui/formatMessage';
export { createVoiceNotePlayer } from './ui/voiceNotePlayer';
export {
  readStoredCustomerName,
  readStoredCustomerEmail,
  storeCustomerName,
  storeCustomerEmail,
  readStoredConversationId,
  storeConversationId,
  clearStoredConversationId,
  resolveAnonymousCustomerId,
} from './lib/anonymousCustomer';

export type {
  WidgetSocketConfig,
  ChatWindowConfig,
  ChatMessage,
  ChatAttachment,
  IncomingMessage,
  Faq,
  OrgConfig,
} from './types';
