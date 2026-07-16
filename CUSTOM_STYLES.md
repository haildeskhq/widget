# Haildesk Widget Custom Styles Reference

This is the complete public styling surface for the Haildesk widget.

The widget uses a Shadow DOM, so CSS from the host website cannot reach it.
Place overrides in the `customStyles` configuration option:

```js
HaildeskWidget.init({
  apiKey: 'YOUR_API_KEY',
  customStyles: `
    .haildesk-window {
      background: #ffffff;
    }
  `,
});
```

For the script-tag version:

```html
<script>
  window.HaildeskConfig = {
    apiKey: 'YOUR_API_KEY',
    customStyles: `
      .haildesk-window {
        background: #ffffff;
      }
    `,
  };
</script>
```

You can replace all custom CSS at runtime:

```js
window.Haildesk?.setCustomStyles(`
  .haildesk-bubble {
    background: #111827;
  }
`);
```

## CSS variables

| Variable | Used by | Default |
|---|---|---|
| `--haildesk-primary` | Launcher, customer messages, send button, submit button, focused inputs | Organization primary color or `#4F46E5` |
| `--haildesk-secondary` | Agent message background | Organization secondary color or `#1e2a3a` |
| `--haildesk-icon` | Launcher chat and close icons | Organization icon color or `white` |

Variables can be overridden on all widget elements:

```css
:host {
  --haildesk-primary: #f59e0b;
  --haildesk-secondary: #e2e8f0;
  --haildesk-icon: #111827;
}
```

The configured organization colors are also set directly on the launcher and
window. If a `:host` variable does not override them, target those elements:

```css
.haildesk-bubble {
  --haildesk-primary: #f59e0b;
  --haildesk-icon: #111827;
}

.haildesk-window {
  --haildesk-primary: #f59e0b;
  --haildesk-secondary: #e2e8f0;
}
```

## Root

| Selector | Element |
|---|---|
| `:host` | Shadow DOM widget root; use for inherited font, text, and variables |
| `*`, `*::before`, `*::after` | Every widget element and pseudo-element |

```css
:host {
  font-family: Inter, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #111827;
}
```

## Launcher button

| Selector | Element or state |
|---|---|
| `.haildesk-bubble` | Floating launcher button |
| `.haildesk-bubble:hover` | Launcher hover state |
| `.haildesk-bubble:active` | Launcher pressed state |
| `.haildesk-bubble--left` | Launcher when configured on the left |
| `.haildesk-bubble svg` | Chat/close icon inside the launcher |
| `.haildesk-badge` | Unread message badge |

```css
.haildesk-bubble {
  bottom: 24px;
  right: 24px;
  width: 64px;
  height: 64px;
  background: #111827;
  border: 2px solid #f59e0b;
  border-radius: 18px;
  box-shadow: 0 12px 30px rgb(0 0 0 / 25%);
}

.haildesk-bubble svg {
  width: 28px;
  height: 28px;
  color: #f59e0b;
  stroke-width: 1.5;
}

.haildesk-badge {
  background: #dc2626;
  color: #ffffff;
  border-color: #ffffff;
}
```

## Chat window

| Selector | Element or state |
|---|---|
| `.haildesk-window` | Main chat dialog |
| `.haildesk-window--left` | Window when configured on the left |
| `.haildesk-window--hidden` | Closed/hidden window |
| `.haildesk-window--fullscreen` | Expanded fullscreen window |

```css
.haildesk-window {
  bottom: 100px;
  right: 24px;
  width: 400px;
  height: 620px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  box-shadow: 0 24px 70px rgb(15 23 42 / 22%);
}

.haildesk-window--fullscreen {
  max-width: 900px;
  margin: 0 auto;
}
```

Avoid changing `.haildesk-window--hidden { display: none; }` unless you
intentionally want to change open/close behavior.

## Header

| Selector | Element or state |
|---|---|
| `.haildesk-header` | Header container |
| `.haildesk-header-avatar` | Organization/assistant avatar container |
| `.haildesk-header-avatar img` | Avatar image |
| `.haildesk-header-avatar svg` | Fallback avatar icon |
| `.haildesk-header-info` | Title and status wrapper |
| `.haildesk-header-title` | Organization/assistant name |
| `.haildesk-header-status` | Online/offline status text |
| `.haildesk-header-status::before` | Status indicator dot |
| `.haildesk-header-status--offline` | Offline status |
| `.haildesk-header-status--offline::before` | Offline indicator dot |
| `.haildesk-expand-btn` | Expand/compress button |
| `.haildesk-expand-btn:hover` | Expand button hover state |
| `.haildesk-expand-btn svg` | Both expand/compress SVG icons |
| `.haildesk-expand-icon` | Expand icon |
| `.haildesk-compress-icon` | Compress icon |
| `.haildesk-close-btn` | Header close button |
| `.haildesk-close-btn:hover` | Close button hover state |
| `.haildesk-close-btn svg` | Close SVG icon |

```css
.haildesk-header {
  padding: 20px;
  background: #f8fafc;
  color: #0f172a;
  border-bottom-color: #e2e8f0;
}

.haildesk-header-avatar {
  background: #f59e0b;
  color: #111827;
}

.haildesk-header-status::before {
  background: #22c55e;
}

.haildesk-expand-btn,
.haildesk-close-btn {
  color: #475569;
}
```

## Messages and greeting

| Selector | Element or state |
|---|---|
| `.haildesk-messages` | Scrollable messages container |
| `.haildesk-messages::-webkit-scrollbar` | Scrollbar width |
| `.haildesk-messages::-webkit-scrollbar-track` | Scrollbar track |
| `.haildesk-messages::-webkit-scrollbar-thumb` | Scrollbar thumb |
| `.haildesk-greeting` | Empty-state greeting container |
| `.haildesk-greeting-emoji` | Greeting emoji |
| `.haildesk-greeting-text` | Greeting message |
| `.haildesk-offline-message` | Offline notice |
| `.haildesk-message` | Every message row |
| `.haildesk-message--agent` | Agent and AI message row |
| `.haildesk-message--customer` | Customer message row |
| `.haildesk-message--system` | System message row |
| `.haildesk-message-bubble` | Message text bubble |
| `.haildesk-message--agent .haildesk-message-bubble` | Agent/AI bubble |
| `.haildesk-message--customer .haildesk-message-bubble` | Customer bubble |
| `.haildesk-message--system .haildesk-message-bubble` | System bubble |
| `.haildesk-message-time` | Message timestamp |
| `.haildesk-message--agent .haildesk-message-time` | Agent timestamp |

AI messages intentionally use the agent selectors.

```css
.haildesk-messages {
  padding: 20px;
  background: #ffffff;
  gap: 14px;
}

.haildesk-message--agent .haildesk-message-bubble {
  background: #f1f5f9;
  color: #0f172a;
  border-radius: 16px 16px 16px 4px;
}

.haildesk-message--customer .haildesk-message-bubble {
  background: #f59e0b;
  color: #111827;
  border-radius: 16px 16px 4px 16px;
}

.haildesk-message-time {
  color: #94a3b8;
}
```

## Message attachments

| Selector | Element |
|---|---|
| `.haildesk-message a` | Any attachment link inside a message |
| `.haildesk-message a img` | Image attachment inside a message |
| `.haildesk-file-attachment` | Non-image file attachment link |
| `.haildesk-file-icon` | File emoji/icon |
| `.haildesk-file-name` | File name |
| `.haildesk-file-size` | File size |

```css
.haildesk-file-attachment {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding: 10px;
  color: #0f172a;
  background: #e2e8f0;
  border-radius: 10px;
  text-decoration: none;
}

.haildesk-file-size {
  color: #64748b;
  font-size: 11px;
}

.haildesk-message a img {
  max-width: 240px !important;
  max-height: 180px !important;
  border-radius: 14px !important;
}
```

Message images receive inline dimensions and radius, so use `!important` to
replace those particular properties.

## Typing indicator

| Selector | Element |
|---|---|
| `.haildesk-typing` | Typing indicator message row |
| `.haildesk-typing-dots` | Typing bubble |
| `.haildesk-typing-dots span` | Every animated dot |
| `.haildesk-typing-dots span:nth-child(1)` | First dot |
| `.haildesk-typing-dots span:nth-child(2)` | Second dot |
| `.haildesk-typing-dots span:nth-child(3)` | Third dot |

```css
.haildesk-typing-dots {
  background: #f1f5f9;
}

.haildesk-typing-dots span {
  background: #64748b;
}
```

## Attachment preview and upload

| Selector | Element or state |
|---|---|
| `.haildesk-attachment-preview` | Pending attachment bar |
| `.haildesk-attachment-chip` | Pending attachment chip |
| `.haildesk-attachment-chip--loading` | Uploading attachment chip |
| `.haildesk-attachment-thumb` | Pending image thumbnail |
| `.haildesk-attachment-icon` | Pending PDF icon wrapper |
| `.haildesk-attachment-icon svg` | Pending PDF SVG |
| `.haildesk-attachment-remove` | Remove attachment button |
| `.haildesk-attachment-remove:hover` | Remove button hover state |
| `.haildesk-upload-spinner` | Upload spinner |

```css
.haildesk-attachment-preview {
  background: #f8fafc;
}

.haildesk-attachment-chip {
  background: #ffffff;
  color: #334155;
  border-color: #e2e8f0;
}

.haildesk-attachment-remove {
  color: #64748b;
}

.haildesk-upload-spinner {
  border-color: #cbd5e1;
  border-top-color: #f59e0b;
}
```

## Composer

| Selector | Element or state |
|---|---|
| `.haildesk-input-area` | Composer container |
| `.haildesk-input` | Message textarea |
| `.haildesk-input:focus` | Focused textarea |
| `.haildesk-input:disabled` | Disabled textarea |
| `.haildesk-input::placeholder` | Textarea placeholder |
| `.haildesk-plus-btn` | Attachment button |
| `.haildesk-plus-btn:hover` | Attachment button hover |
| `.haildesk-plus-btn:disabled` | Disabled attachment button |
| `.haildesk-plus-btn svg` | Attachment SVG icon |
| `.haildesk-send-btn` | Send button |
| `.haildesk-send-btn:hover` | Send button hover |
| `.haildesk-send-btn:disabled` | Disabled send button |
| `.haildesk-send-btn svg` | Send SVG icon |

```css
.haildesk-input-area {
  padding: 14px;
  background: #f8fafc;
  border-top-color: #e2e8f0;
}

.haildesk-input {
  background: #ffffff;
  color: #0f172a;
  border-color: #cbd5e1;
}

.haildesk-input::placeholder {
  color: #94a3b8;
}

.haildesk-plus-btn {
  color: #64748b;
}

.haildesk-send-btn {
  background: #f59e0b;
  color: #111827;
}
```

## Contact prompt

| Selector | Element or state |
|---|---|
| `.haildesk-name-prompt` | Contact prompt overlay |
| `.haildesk-name-prompt-inner` | Prompt content wrapper |
| `.haildesk-name-prompt-emoji` | Prompt emoji |
| `.haildesk-name-prompt-title` | Prompt heading |
| `.haildesk-name-prompt-sub` | Prompt description |
| `.haildesk-name-input` | Name input |
| `.haildesk-email-input` | Email input |
| `.haildesk-name-input:focus` | Focused name input |
| `.haildesk-email-input:focus` | Focused email input |
| `.haildesk-name-input::placeholder` | Name placeholder |
| `.haildesk-email-input::placeholder` | Email placeholder |
| `.haildesk-name-submit-btn` | Start-chat button |
| `.haildesk-name-submit-btn:disabled` | Disabled start-chat button |
| `.haildesk-name-submit-btn:not(:disabled):hover` | Enabled button hover |

```css
.haildesk-name-prompt {
  background: #ffffff;
}

.haildesk-name-prompt-title {
  color: #0f172a;
}

.haildesk-name-prompt-sub {
  color: #64748b;
}

.haildesk-name-input,
.haildesk-email-input {
  background: #f8fafc;
  color: #0f172a;
  border-color: #cbd5e1;
}
```

## Resolution and satisfaction

| Selector | Element or state |
|---|---|
| `.haildesk-resolve-bar` | Resolution prompt bar |
| `.haildesk-resolve-label` | Resolution prompt text |
| `.haildesk-resolve-btn` | Mark-as-resolved button |
| `.haildesk-resolve-btn:hover` | Resolution button hover |
| `.haildesk-satisfaction-modal` | Satisfaction panel |
| `.haildesk-satisfaction-title` | Satisfaction question |
| `.haildesk-satisfaction-options` | Satisfaction button wrapper |
| `.haildesk-satisfaction-btn` | Every satisfaction button |
| `.haildesk-satisfaction-btn--yes` | Positive answer |
| `.haildesk-satisfaction-btn--yes:hover` | Positive answer hover |
| `.haildesk-satisfaction-btn--no` | Negative answer |
| `.haildesk-satisfaction-btn--no:hover` | Negative answer hover |
| `.haildesk-resolved-state` | Closed-conversation message |

```css
.haildesk-resolve-bar,
.haildesk-satisfaction-modal {
  background: #f8fafc;
  border-top-color: #e2e8f0;
}

.haildesk-resolve-label,
.haildesk-satisfaction-title {
  color: #334155;
}

.haildesk-resolve-btn,
.haildesk-satisfaction-btn {
  background: #ffffff;
  color: #0f172a;
  border-color: #cbd5e1;
}
```

## Footer

| Selector | Element |
|---|---|
| `.haildesk-footer` | Disclosure and branding footer |
| `.haildesk-footer span` | AI/live-support disclosure |
| `.haildesk-footer a` | “Powered by Haildesk” link |

```css
.haildesk-footer {
  background: #f8fafc;
  color: #64748b;
  border-top: 1px solid #e2e8f0;
}

.haildesk-footer a {
  color: #475569 !important;
}
```

The footer link has inline color and text-decoration declarations. Its color is
`inherit`, so changing `.haildesk-footer` is normally enough. Use `!important`
when directly restyling the link.

## Responsive styles

Custom CSS accepts normal media queries:

```css
@media (max-width: 480px) {
  .haildesk-window {
    inset: 12px;
    width: auto;
    height: auto;
    border-radius: 18px;
  }

  .haildesk-bubble {
    bottom: 12px;
    right: 12px;
  }
}
```

The built-in mobile rule appears before custom CSS, so custom media rules can
replace it.

## Animations

The built-in animation names are:

| Name | Used by |
|---|---|
| `haildesk-slide-up` | Window opening |
| `haildesk-bounce` | Typing dots |
| `haildesk-spin` | Upload spinner |

You can disable or replace them:

```css
.haildesk-window {
  animation: none;
}

.haildesk-typing-dots span,
.haildesk-upload-spinner {
  animation: none;
}
```

## Inline-style overrides

Most widget styles can be overridden normally because custom CSS is loaded
after the built-in stylesheet. Some runtime behavior uses inline styles:

| Element | Inline-controlled properties |
|---|---|
| Avatar image | `width`, `height`, `object-fit`, `border-radius` |
| Compress/expand icons | `display` |
| Typing indicator | `display` |
| Attachment preview | `display` |
| Hidden file input | `display` |
| Textarea | `height` while typing |
| Attachment button without upload support | `opacity`, `cursor` |
| Contact prompt | `display` |
| Resolution bar | `display` |
| Satisfaction panel | `display` |
| Composer after resolution | `display` |
| Message attachment image | `max-width`, `max-height`, `border-radius`, `display`, `margin-top` |
| Footer link | `color`, `text-decoration`, `text-underline-offset` |

Use `!important` only if you intentionally need to override one of these
inline-controlled properties. Overriding runtime `display` values can break
widget behavior.

## Complete light-theme example

```css
:host {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
}

.haildesk-bubble {
  --haildesk-primary: #f59e0b;
  --haildesk-icon: #111827;
  border-radius: 18px;
}

.haildesk-window {
  --haildesk-primary: #f59e0b;
  --haildesk-secondary: #f1f5f9;
  background: #ffffff;
  border-color: #e2e8f0;
}

.haildesk-header,
.haildesk-input-area,
.haildesk-attachment-preview,
.haildesk-footer {
  background: #f8fafc;
  color: #0f172a;
  border-color: #e2e8f0;
}

.haildesk-messages,
.haildesk-name-prompt {
  background: #ffffff;
}

.haildesk-greeting-text,
.haildesk-message-time,
.haildesk-name-prompt-sub,
.haildesk-resolve-label,
.haildesk-footer {
  color: #64748b;
}

.haildesk-message--agent .haildesk-message-bubble {
  background: #f1f5f9;
  color: #0f172a;
}

.haildesk-message--customer .haildesk-message-bubble {
  background: #f59e0b;
  color: #111827;
}

.haildesk-input,
.haildesk-name-input,
.haildesk-email-input {
  background: #ffffff;
  color: #0f172a;
  border-color: #cbd5e1;
}

.haildesk-input::placeholder,
.haildesk-name-input::placeholder,
.haildesk-email-input::placeholder {
  color: #94a3b8;
}

.haildesk-plus-btn {
  color: #64748b;
}

.haildesk-send-btn,
.haildesk-name-submit-btn {
  background: #f59e0b;
  color: #111827;
}

.haildesk-resolve-bar,
.haildesk-satisfaction-modal {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.haildesk-resolve-btn,
.haildesk-satisfaction-btn {
  color: #0f172a;
  border-color: #cbd5e1;
}
```
