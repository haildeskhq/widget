export interface WidgetSocketConfig {
  apiUrl: string;
  /** Third-party embedders authenticate with a secret API key. */
  apiKey?: string;
  /** Support-page visitors authenticate with the org's public slug instead. */
  orgSlug?: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  /** Server-computed HMAC of customerId (identity verification). */
  userHash?: string;
  /** Server-computed HMAC of customerEmail (identity verification). */
  emailHash?: string;
  /** This browser's own anon id, used by the server if customerId can't be verified. */
  anonymousId?: string;
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
  editedAt?: Date | null;
  deletedAt?: Date | null;
}

export interface HaildeskWidgetConfig {
  apiKey: string;
  apiUrl?: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  /**
   * HMAC-SHA256 of `customerId`, computed on your server with your identity secret
   * (Settings → API Keys → Identity verification). Proves the visitor is that user.
   */
  userHash?: string;
  /** HMAC-SHA256 of `customerEmail`, computed the same way. */
  emailHash?: string;
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
  /** Support-page visitors authenticate with the org's public slug instead of an apiKey. */
  orgSlug?: string;
  voiceNotesEnabled?: boolean;
  /** Enterprise only — customers can attach videos up to 100 MB. */
  videoUploadsEnabled?: boolean;
  faqs?: Faq[];
}

export interface ChatMessage {
  id: string;
  body: string;
  senderType: 'agent' | 'customer' | 'system' | 'ai';
  createdAt: Date;
  attachments?: ChatAttachment[];
  editedAt?: Date | null;
  deletedAt?: Date | null;
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
  /** Enterprise only — customers can attach videos up to 100 MB. */
  videoUploadsEnabled?: boolean;
}
