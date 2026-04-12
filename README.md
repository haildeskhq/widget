# @haildesk/widget

The official Haildesk chat widget for web applications.

## Installation

```bash
npm install @haildesk/widget
```

## Usage

```js
import { HaildeskWidget } from '@haildesk/widget';

HaildeskWidget.init({
  apiKey: 'YOUR_API_KEY',
});
```

## Configuration

| Option | Type | Required | Description |
|---|---|---|---|
| `apiKey` | `string` | Yes | Your public widget API key |
| `customerId` | `string` | No | Identify a known user |
| `customerEmail` | `string` | No | Pre-fill the customer's email |
| `customerName` | `string` | No | Pre-fill the customer's name |

## Programmatic Control

Once initialized, the widget is accessible via `window.Haildesk`:

```js
window.Haildesk?.open();    // Open the chat widget
window.Haildesk?.close();   // Close the chat widget
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
    apiKey: "YOUR_API_KEY"
  };
</script>
<script src="YOUR_CDN_URL" async></script>
```

## Getting Your API Key

Log in to your [Haildesk dashboard](https://haildesk.com) and go to **Settings → API Keys** to copy your public widget key.
