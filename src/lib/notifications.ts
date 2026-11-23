import { createClient } from "@/lib/supabase/client";

export type NotificationKind = "archivo" | "clase";

export interface AppNotification {
  id: string;
  tipo: NotificationKind;
  titulo: string;
  modulo: string;
  created_at: string;
  href: string;
}

export const NOTIFICATIONS_CHANNEL = "noxius-notifications";
export const LOCAL_NOTIFICATION_EVENT = "noxius-notification-created";

export async function publishNotification(notification: AppNotification): Promise<void> {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<AppNotification>(LOCAL_NOTIFICATION_EVENT, {
        detail: notification,
      })
    );
  }

  try {
    const supabase = createClient();
    const channel = supabase.channel(NOTIFICATIONS_CHANNEL);

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        supabase.removeChannel(channel);
        resolve();
      }, 1500);

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          try {
            await channel.send({
              type: "broadcast",
              event: "new_notification",
              payload: notification,
            });
          } finally {
            clearTimeout(timeout);
            supabase.removeChannel(channel);
            resolve();
          }
        }
      });
    });
  } catch {
    // No interrumpir el flujo principal si Realtime no está disponible
  }
}

export function formatRelativeTime(isoDate: string): string {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return "Reciente";

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return "Hace un momento";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `Hace ${diffDays} d`;

  const diffMonths = Math.floor(diffDays / 30);
  return `Hace ${diffMonths} mes${diffMonths > 1 ? "es" : ""}`;
}
