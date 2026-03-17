export interface WidgetSocketConfig {
  apiUrl: string;
  apiKey: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  conversationId?: string;
}

export interface IncomingMessage {
  id: string;
  body: string;
  senderType: 'agent' | 'customer' | 'system' | 'ai';
  createdAt: Date;
  conversationId: string;
}

export interface HaildeskWidgetConfig {
  apiKey: string;
  apiUrl?: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
}

export interface ChatWindowConfig {
  greeting: string;
  position: 'bottom-right' | 'bottom-left';
  primaryColor: string;
  secondaryColor?: string;
  isOnline: boolean;
  offlineMessage: string;
  orgName?: string;
  headerTitle?: string;
  aiPersonaAvatar?: string;
  disclosureEnabled?: boolean;
  disclosureText?: string;
  requireNamePrompt?: boolean;
  onNameProvided?: (name: string) => void;
}

export interface ChatMessage {
  id: string;
  body: string;
  senderType: 'agent' | 'customer' | 'system' | 'ai';
  createdAt: Date;
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
  aiEnabled?: boolean;
  aiPersonaName?: string;
  aiPersonaAvatar?: string;
  disclosureEnabled?: boolean;
  disclosureText?: string;
  disclosureLiveText?: string;
}
