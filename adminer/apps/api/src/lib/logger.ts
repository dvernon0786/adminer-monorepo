/* Minimal logger with consistent, greppable lines */
type Lvl = "info" | "warn" | "error";
const ts = () => new Date().toISOString();

export const log = (lvl: Lvl, msg: string, meta: Record<string, unknown> = {}) => {
  // Logfmt-ish single line; safe to ship to any log sink
  const base = `level=${lvl} ts=${ts()} msg="${msg.replace(/"/g, "'")}"`;
  const extras = Object.entries(meta)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(" ");
  // eslint-disable-next-line no-console
  console[lvl === "error" ? "error" : lvl](extras ? `${base} ${extras}` : base);
};

export const info = (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta);
export const warn = (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta);
export const error = (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta); 