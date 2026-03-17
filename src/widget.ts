import { HaildeskWidget } from "./HaildeskWidget";
import { HaildeskWidgetConfig } from "./types";

declare global {
  interface Window {
    HaildeskConfig?: HaildeskWidgetConfig;
    Haildesk?: {
      widget: HaildeskWidget;
      open: () => void;
      close: () => void;
      destroy: () => void;
    };
  }
}

function bootstrap(): void {
  const config = window.HaildeskConfig;

  if (!config?.apiKey) {
    console.error(
      '[Haildesk] Missing configuration. Set window.HaildeskConfig = { apiKey: "12406cb01e297dfb2a681a0ba2d00e841b99f23ee1db9109b689a38c79966030" } before loading the widget.',
    );
    return;
  }

  if (window.Haildesk) {
    console.warn("[Haildesk] Widget already initialized");
    return;
  }

  const widget = new HaildeskWidget(config);

  window.Haildesk = {
    widget,
    open: () => widget.open(),
    close: () => widget.close(),
    destroy: () => widget.destroy(),
  };

  widget.init().catch((err: unknown) => {
    console.error("[Haildesk] Initialization failed:", err);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
