// 1. Polyfill EventTarget (the foundation of event handling)
if (typeof EventTarget === "undefined") {
  (globalThis as any).EventTarget = class EventTarget {
    private listeners: Record<string, Function[]> = {};

    addEventListener(type: string, listener: Function) {
      if (!this.listeners[type]) {
        this.listeners[type] = [];
      }
      this.listeners[type].push(listener);
    }

    removeEventListener(type: string, listener: Function) {
      if (!this.listeners[type]) return;
      this.listeners[type] = this.listeners[type].filter((l) => l !== listener);
    }

    dispatchEvent(event: any): boolean {
      if (!this.listeners[event.type]) return true;
      this.listeners[event.type].forEach((listener) => listener(event));
      return true;
    }
  };
}

// 2. Polyfill the base Event class
if (typeof Event === "undefined") {
  (globalThis as any).Event = class Event {
    type: string;
    bubbles: boolean;
    cancelable: boolean;
    constructor(type: string, init: any = {}) {
      this.type = type;
      this.bubbles = !!init.bubbles;
      this.cancelable = !!init.cancelable;
    }
  };
}

// 3. Polyfill MessageEvent
if (typeof MessageEvent === "undefined") {
  (globalThis as any).MessageEvent = class MessageEvent extends (
    (globalThis as any).Event
  ) {
    data: any;
    origin: string;
    lastEventId: string;
    constructor(type: string, init: any = {}) {
      super(type, init);
      this.data = init.data ?? null;
      this.origin = init.origin ?? "";
      this.lastEventId = init.lastEventId ?? "";
    }
  };
}

// 4. Polyfill BroadcastChannel (in-memory communication bus)
if (typeof BroadcastChannel === "undefined") {
  const channels = new Map<string, Set<any>>();

  (globalThis as any).BroadcastChannel = class BroadcastChannel extends (
    (globalThis as any).EventTarget
  ) {
    name: string;
    onmessage: ((this: BroadcastChannel, ev: MessageEvent) => any) | null =
      null;

    constructor(name: string) {
      super();
      this.name = name;
      if (!channels.has(name)) {
        channels.set(name, new Set());
      }
      channels.get(name)!.add(this);
    }

    postMessage(message: any) {
      const channelSet = channels.get(this.name);
      if (channelSet) {
        channelSet.forEach((target) => {
          if (target !== this) {
            const event = new (globalThis as any).MessageEvent("message", {
              data: message,
            });
            if (typeof target.onmessage === "function") {
              target.onmessage(event);
            }
            target.dispatchEvent(event);
          }
        });
      }
    }

    close() {
      const channelSet = channels.get(this.name);
      if (channelSet) {
        channelSet.delete(this);
        if (channelSet.size === 0) {
          channels.delete(this.name);
        }
      }
    }
  };
}

// 5. Polyfill TextEncoder / TextDecoder
if (typeof TextEncoder === "undefined") {
  const {
    TextEncoder: NodeTextEncoder,
    TextDecoder: NodeTextDecoder,
  } = require("text-encoding");
  (globalThis as any).TextEncoder = NodeTextEncoder;
  (globalThis as any).TextDecoder = NodeTextDecoder;
}

// 6. Polyfill ReadableStream
if (typeof ReadableStream === "undefined") {
  const {
    ReadableStream: PolyfillReadableStream,
  } = require("web-streams-polyfill");
  (globalThis as any).ReadableStream = PolyfillReadableStream;
}
