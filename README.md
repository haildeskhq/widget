# @haildesk/widget

The official Haildesk chat widget for web applications.

## Installation

```bash
npm install @haildesk/widget
```

## Usage

```js
import { HaildeskWidget } from "@haildesk/widget";

HaildeskWidget.init({
  apiKey: "YOUR_API_KEY",
});
```

## Configuration

| Option          | Type     | Required | Description                                 |
| --------------- | -------- | -------- | ------------------------------------------- |
| `apiKey`        | `string` | Yes      | Your public widget API key                  |
| `customerId`    | `string` | No       | Identify a known user                       |
| `customerEmail` | `string` | No       | Pre-fill the customer's email               |
| `customerName`  | `string` | No       | Pre-fill the customer's name                |
| `userHash`      | `string` | No       | Signature of `customerId` (see below)       |
| `emailHash`     | `string` | No       | Signature of `customerEmail` (see below)    |
| `customStyles`  | `string` | No       | CSS loaded after all built-in widget styles |

## Identity verification

If you pass `customerId` or `customerEmail` for logged-in users, sign them on your
server. These values are set in the visitor's browser, so without a signature anyone
can change them and appear to your support team as another user.

1. Copy your identity secret from **Settings → Identity**.
   Keep it on your server only.
2. On your server, compute an HMAC-SHA256 (hex) of the exact strings you pass:

   ```js
   const crypto = require("crypto");
   const sign = (value) =>
     crypto.createHmac("sha256", process.env.HAILDESK_IDENTITY_SECRET).update(value).digest("hex");

   const userHash = sign(user.id);
   const emailHash = sign(user.email);
   ```

3. Pass them to the widget:

   ```js
   HaildeskWidget.init({
     apiKey: "YOUR_API_KEY",
     customerId: user.id,
     userHash,
     customerEmail: user.email,
     emailHash,
   });
   ```

When verification is required for your workspace, a `customerId` or `customerEmail`
without a valid signature is ignored. The visitor can still chat, but as an anonymous
visitor. Anonymous visitors (no `customerId`) need nothing.

## Custom Styles

The widget is rendered in a Shadow DOM. Pass CSS through `customStyles` to
override any part of it:

See the [complete customization reference](https://haildesk.com/docs#custom-widget-styles)
for every available CSS variable, class, state, icon selector, and example.

```js
HaildeskWidget.init({
  apiKey: "YOUR_API_KEY",
  customStyles: `
    :host {
      font-family: Inter, sans-serif;
    }

    .haildesk-bubble {
      width: 64px;
      height: 64px;
      background: #111827;
      border: 2px solid #f59e0b;
      border-radius: 18px;
    }

    .haildesk-bubble svg {
      color: #f59e0b;
    }

    .haildesk-window {
      width: 400px;
      height: 600px;
      background: #ffffff;
      border-radius: 24px;
    }

    .haildesk-header,
    .haildesk-input-area,
    .haildesk-footer {
      background: #f8fafc;
      color: #111827;
    }

    .haildesk-message--agent .haildesk-message-bubble {
      background: #e2e8f0;
      color: #111827;
    }

    .haildesk-message--customer .haildesk-message-bubble,
    .haildesk-send-btn {
      background: #f59e0b;
      color: #111827;
    }
  `,
});
```

Because this is unrestricted CSS, developers can change colors, icons,
typography, spacing, dimensions, borders, shadows, animations, hover/focus
states, and mobile layouts. Use `!important` only when overriding a property
that is set directly on an element with an inline style.

Custom CSS can also be replaced at runtime:

```js
window.Haildesk?.setCustomStyles(`
  .haildesk-window { background: white; }
`);
```

## Programmatic Control

Once initialized, the widget is accessible via `window.Haildesk`:

```js
window.Haildesk?.open(); // Open the chat widget
window.Haildesk?.close(); // Close the chat widget
window.Haildesk?.setCustomStyles(".haildesk-bubble { border-radius: 12px; }");
window.Haildesk?.destroy(); // Remove the widget from the page
```

Or trigger it from HTML:

```html
<button onclick="window.Haildesk?.open()">Open Widget</button>
<button onclick="window.Haildesk?.close()">Close Widget</button>
```

## Script Tag (no npm)

If you prefer not to use a bundler, add this to your HTML before `</body>`:

```html
<script>
  window.HaildeskConfig = {
    apiKey: "YOUR_API_KEY",
    customStyles: `
      .haildesk-bubble { background: black; }
      .haildesk-bubble svg { color: gold; }
    `,
  };
</script>
<script src="https://widget.haildesk.com/widget.iife.js" async></script>
```

## Getting Your API Key

Log in to your [Haildesk dashboard](https://haildesk.com) and go to **Settings → API Keys** to copy your public widget key.
