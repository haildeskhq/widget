export interface WidgetSocketConfig {
  apiUrl: string;
  apiKey: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  conversationId?: string;
}

export interface ChatAttachment {
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  durationSec?: number;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface IncomingMessage {
  id: string;
  body: string;
  senderType: 'agent' | 'customer' | 'system' | 'ai';
  senderName?: string;
  createdAt: Date;
  conversationId: string;
  attachments?: ChatAttachment[];
}

export interface HaildeskWidgetConfig {
  apiKey: string;
  apiUrl?: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  /**
   * CSS injected into the widget's Shadow DOM after the built-in stylesheet.
   * Use widget class names to override any visual property.
   */
  customStyles?: string;
}

export interface ChatWindowConfig {
  greeting: string;
  position: 'bottom-right' | 'bottom-left';
  primaryColor: string;
  secondaryColor?: string;
  isOnline: boolean;
  offlineMessage: string;
  orgName?: string;
  orgLogoUrl?: string | null;
  headerTitle?: string;
  aiPersonaAvatar?: string;
  disclosureEnabled?: boolean;
  disclosureText?: string;
  requireNamePrompt?: boolean;
  onContactProvided?: (contact: { name: string; email: string }) => void;
  plan?: string;
  apiUrl?: string;
  apiKey?: string;
  voiceNotesEnabled?: boolean;
  faqs?: Faq[];
}

export interface ChatMessage {
  id: string;
  body: string;
  senderType: 'agent' | 'customer' | 'system' | 'ai';
  createdAt: Date;
  attachments?: ChatAttachment[];
}

export interface BubbleConfig {
  position: 'bottom-right' | 'bottom-left';
  primaryColor: string;
  iconColor?: string;
  unreadCount?: number;
}

export interface OrgConfig {
  greeting: string;
  position: 'bottom-right' | 'bottom-left';
  primaryColor: string;
  iconColor: string;
  secondaryColor: string;
  isOnline: boolean;
  offlineMessage: string;
  orgName: string;
  orgLogoUrl?: string | null;
  aiEnabled?: boolean;
  aiPersonaName?: string;
  aiPersonaAvatar?: string;
  disclosureEnabled?: boolean;
  disclosureText?: string;
  disclosureLiveText?: string;
  plan?: string;
  voiceNotesEnabled?: boolean;
}
