import * as amplitude from "@amplitude/analytics-browser";
import { Identify } from "@amplitude/analytics-browser";
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

  // Set device category based on the app's mobile breakpoint (matches Tailwind sm: 640px).
  // Amplitude captures OS/browser automatically; this adds the app-level distinction.
  const deviceCategory = window.innerWidth < 640 ? "mobile" : "desktop";
  const init = new Identify();
  init.set("device_category", deviceCategory);
  amplitude.identify(init);
}

/** Set user identity and persistent user properties after login or registration. */
export function identifyUser(user: {
  id: string;
  name: string;
  rating: number;
  is_staff: boolean;
  club_ids_admin: string[];
}) {
  amplitude.setUserId(`amp_user_${user.id}`);

  const role = user.is_staff
    ? "staff"
    : user.club_ids_admin.length > 0
    ? "club_admin"
    : "player";

  const props = new Identify();
  props.set("role", role);
  props.set("rating", user.rating);
  props.set("display_name", user.name);
  amplitude.identify(props);
}

/** Call whenever the user switches the in-app language. */
export function setAppLanguage(lang: "ru" | "en" | "kz") {
  const props = new Identify();
  props.set("app_language", lang);
  amplitude.identify(props);
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
