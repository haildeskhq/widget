const LS_NAME_KEY = "haildesk-customer-name";
const LS_EMAIL_KEY = "haildesk-customer-email";
const LS_CUSTOMER_ID_KEY = "haildesk-customer-id";
const LS_CONVERSATION_KEY = "haildesk-conversation-id";

export function readFromStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeToStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable (private mode, disabled cookies) — no-op
  }
}

export function readStoredCustomerName(): string | null {
  return readFromStorage(LS_NAME_KEY);
}

export function readStoredCustomerEmail(): string | null {
  return readFromStorage(LS_EMAIL_KEY);
}

export function storeCustomerName(name: string): void {
  writeToStorage(LS_NAME_KEY, name);
}

export function storeCustomerEmail(email: string): void {
  writeToStorage(LS_EMAIL_KEY, email);
}

export function readStoredConversationId(): string | null {
  return readFromStorage(LS_CONVERSATION_KEY);
}

export function storeConversationId(conversationId: string): void {
  writeToStorage(LS_CONVERSATION_KEY, conversationId);
}

export function clearStoredConversationId(): void {
  writeToStorage(LS_CONVERSATION_KEY, "");
}

export function resolveAnonymousCustomerId(): string {
  const stored = readFromStorage(LS_CUSTOMER_ID_KEY);
  if (stored) return stored;
  const uuid = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
  const id = `anon-${uuid}`;
  writeToStorage(LS_CUSTOMER_ID_KEY, id);
  return id;
}
