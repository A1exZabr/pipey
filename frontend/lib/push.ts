const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const bytes = rawData.split('').map((c) => c.charCodeAt(0));
  return new Uint8Array(bytes) as unknown as Uint8Array<ArrayBuffer>;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function isPushSupported(): Promise<boolean> {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!(await isPushSupported())) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

export async function subscribeToPush(): Promise<boolean> {
  if (!(await isPushSupported())) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  try {
    // Get VAPID public key
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/api/push/vapid-public-key`, { headers });
    if (!res.ok) return false;
    const { publicKey } = await res.json();
    if (!publicKey) return false;

    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as ArrayBuffer,
    });

    const { endpoint, keys } = subscription.toJSON() as any;
    await fetch(`${API_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ endpoint, p256dh: keys.p256dh, auth: keys.auth }),
    });

    return true;
  } catch {
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!(await isPushSupported())) return false;

  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return false;
    const subscription = await reg.pushManager.getSubscription();
    if (!subscription) return false;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    const headers = await getAuthHeader();
    await fetch(`${API_URL}/api/push/unsubscribe`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ endpoint }),
    });

    return true;
  } catch {
    return false;
  }
}
