export async function headContentLength(url: string): Promise<number | null> {
  try {
    const r = await fetch(url, { method: "HEAD" });
    if (!r.ok) return null;
    const len = r.headers.get("content-length");
    if (!len) return null;
    const n = Number(len);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export async function fetchAsBufferWithCap(url: string, cap: number): Promise<{ buf: Buffer | null; mime?: string | null }> {
  const r = await fetch(url);
  if (!r.ok) return { buf: null, mime: null };

  const mime = r.headers.get("content-type");
  const reader = r.body?.getReader?.();
  if (!reader) {
    const arr = new Uint8Array(await r.arrayBuffer());
    if (arr.byteLength > cap) return { buf: null, mime };
    return { buf: Buffer.from(arr), mime };
  }

  let chunks: Uint8Array[] = [];
  let total = 0;
  // stream, enforcing cap
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > cap) {
        try { reader.cancel(); } catch {}
        return { buf: null, mime };
      }
      chunks.push(value);
    }
  }
  const buf = Buffer.concat(chunks.map(u => Buffer.from(u)));
  return { buf, mime };
} 