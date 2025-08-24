// Runtime tripwire to prevent non-official Clerk script loading
if (typeof window !== "undefined") {
  const origAppendChild = Element.prototype.appendChild;
  Element.prototype.appendChild = function patched(node: any) {
    try {
      if (node?.tagName === "SCRIPT" && typeof node.src === "string") {
        if (node.src.includes("/@clerk/") || node.src.includes("clerk-js")) {
          const url = new URL(node.src);
          const host = url.host;
          const isOfficial = host.endsWith("clerk.com");
          if (!isOfficial) {
            const msg = `[Tripwire] Unexpected Clerk script host: ${host}`;
            if (import.meta.env.PROD) {
              throw new Error(msg);
            } else {
              console.warn(msg);
            }
          }
        }
      }
    } catch {}
    return origAppendChild.call(this, node);
  };
} 