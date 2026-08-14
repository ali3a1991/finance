"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { requestJson } from "@/lib/requestJson";

type PushConfig = { configured: boolean; publicKey: string | null };
type NotificationState = "blocked" | "disabled" | "enabled" | "loading" | "unconfigured" | "unsupported";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (character) => character.charCodeAt(0));
}

function serializeSubscription(subscription: PushSubscription) {
  const value = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime,
    keys: { auth: value.keys?.auth ?? "", p256dh: value.keys?.p256dh ?? "" }
  };
}

export function NotificationSettings() {
  const { t } = useLanguage();
  const [config, setConfig] = useState<PushConfig | null>(null);
  const [state, setState] = useState<NotificationState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadState() {
      if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setState("blocked");
        return;
      }

      try {
        const serverConfig = await requestJson<PushConfig>("/api/push-subscriptions");
        if (cancelled) return;
        setConfig(serverConfig);
        if (!serverConfig.configured || !serverConfig.publicKey) {
          setState("unconfigured");
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (cancelled) return;
        setState(subscription ? "enabled" : "disabled");

        if (subscription) {
          requestJson("/api/push-subscriptions", {
            body: JSON.stringify(serializeSubscription(subscription)), method: "POST"
          }).catch(() => {});
        }
      } catch {
        if (!cancelled) setState("disabled");
      }
    }

    loadState();
    return () => { cancelled = true; };
  }, [t]);

  async function enableNotifications() {
    if (!config?.publicKey) return;
    setState("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "disabled");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
        applicationServerKey: urlBase64ToUint8Array(config.publicKey), userVisibleOnly: true
      });
      await requestJson("/api/push-subscriptions", {
        body: JSON.stringify(serializeSubscription(subscription)), method: "POST"
      });
      setState("enabled");
    } catch {
      setState("disabled");
    }
  }

  async function disableNotifications() {
    setState("loading");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await requestJson("/api/push-subscriptions", {
          body: JSON.stringify({ endpoint: subscription.endpoint }), method: "DELETE"
        });
        await subscription.unsubscribe();
      }
      setState("disabled");
    } catch {
      setState("enabled");
    }
  }

  const isEnabled = state === "enabled";
  const isUnavailable = state === "loading" || state === "blocked" || state === "unsupported" || state === "unconfigured";

  return (
    <section className="settings-panel notification-settings-panel" aria-labelledby="notifications-title">
      <h2 id="notifications-title">{t("settings.notificationsTitle")}</h2>
      <div className="notification-list">
        <div className="notification-item">
          <span>{t("settings.notificationsShopping")}</span>
          <button
            className={`notification-toggle ${isEnabled ? "enabled" : ""}`}
            type="button"
            role="switch"
            aria-checked={isEnabled}
            aria-label={t("settings.notificationsToggleShopping")}
            disabled={isUnavailable}
            onClick={isEnabled ? disableNotifications : enableNotifications}
          >
            <span className="notification-toggle-thumb" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
