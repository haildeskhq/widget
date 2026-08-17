// Minimal, safe markdown-lite renderer for message bodies: bold text and
// lists only — the two things the AI's system prompt is allowed to produce.
// HTML is escaped first, so nothing in the text (from the AI, an agent, or
// a customer) can inject markup; only the specific **bold** / list syntax
// added back in below produces real tags.

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatInline(escapedText: string): string {
  return escapedText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

export function formatMessageBody(raw: string): string {
  const lines = raw.split('\n');
  const htmlParts: string[] = [];
  let listBuffer: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listBuffer.length > 0 && listType) {
      htmlParts.push(`<${listType}>${listBuffer.join('')}</${listType}>`);
    }
    listBuffer = [];
    listType = null;
  };

  for (const rawLine of lines) {
    const bulletMatch = /^[-*]\s+(.*)$/.exec(rawLine);
    const numberedMatch = /^\d+\.\s+(.*)$/.exec(rawLine);

    if (bulletMatch) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listBuffer.push(`<li>${formatInline(escapeHtml(bulletMatch[1]))}</li>`);
      continue;
    }
    if (numberedMatch) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listBuffer.push(`<li>${formatInline(escapeHtml(numberedMatch[1]))}</li>`);
      continue;
    }

    flushList();
    if (rawLine.trim().length === 0) {
      htmlParts.push('<br>');
    } else {
      htmlParts.push(`<div>${formatInline(escapeHtml(rawLine))}</div>`);
    }
  }
  flushList();

  return htmlParts.join('');
}
