export async function apiFetch(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, { credentials: "include", ...init });
  if (res.status === 402) {
    const payload = await res.json().catch(() => ({}));
    const err = new Error("QUOTA_EXCEEDED");
    (err as any).payload = payload;
    throw err;
  }
  return res;
} 