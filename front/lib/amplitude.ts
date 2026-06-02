import * as amplitude from "@amplitude/analytics-browser";
import type { EnrichmentPlugin, BrowserClient, BrowserConfig, BaseEvent } from "@amplitude/analytics-core";
import * as sessionReplay from "@amplitude/session-replay-browser";

const API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_TOKEN ?? "";
const SR_SAMPLE_RATE = parseFloat(
  process.env.NEXT_PUBLIC_AMPLITUDE_SESSION_REPLAY_SAMPLE_RATE ?? "1"
);

let initialized = false;

function makeSessionReplayPlugin(): EnrichmentPlugin<BrowserClient, BrowserConfig> {
  return {
    name: "session-replay-enrichment",
    type: "enrichment",
    setup: async () => undefined,
    execute: async (event: BaseEvent) => {
      const props = sessionReplay.getSessionReplayProperties();
      event.event_properties = { ...event.event_properties, ...props };
      return event;
    },
  };
}

export function initAmplitude() {
  if (initialized || !API_KEY || typeof window === "undefined") return;
  initialized = true;

  sessionReplay.init(API_KEY, { sampleRate: SR_SAMPLE_RATE }).promise;

  amplitude.init(API_KEY, {
    autocapture: { sessions: true, pageViews: true, formInteractions: false, fileDownloads: false },
  });

  amplitude.add(makeSessionReplayPlugin());
}

export function identify(userId: string) {
  amplitude.setUserId(`amp_user_${userId}`);
}

export function resetIdentity() {
  amplitude.reset();
}

export function track(
  eventName: string,
  properties?: Record<string, string | number | boolean | null | undefined>
) {
  amplitude.track(eventName, properties);
}
