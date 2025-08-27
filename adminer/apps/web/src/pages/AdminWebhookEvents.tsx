import React, { useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  type: string;
  receivedAt: string;
  raw?: string | null;
};

type ApiResp = {
  ok: boolean;
  nextCursor: string | null;
  items: Array<{ id: string; type: string; receivedAt: string; raw?: string | null }>;
};

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });

function toCSV(rows: Item[]): string {
  const headers = ["id","type","receivedAt","raw"];
  const escape = (v: any) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`;
  };
  const lines = [headers.join(",")].concat(
    rows.map(r => [r.id, r.type, r.receivedAt, r.raw ?? ""].map(escape).join(","))
  );
  return lines.join("\n");
}

export default function AdminWebhookEvents() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState(50);
  const [rows, setRows] = useState<Item[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const params = useMemo(() => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (type) sp.set("type", type);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    sp.set("limit", String(limit));
    return sp;
  }, [q, type, from, to, limit]);

  async function fetchTypes() {
    try {
      const res = await fetch("/api/admin/webhook-events/types");
      const j = await res.json();
      if (j?.ok) setTypes(j.types || []);
    } catch {}
  }

  async function fetchFirstPage() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/webhook-events?${params.toString()}`);
      const j: ApiResp = await res.json();
      if (j.ok) {
        setRows(j.items);
        setNextCursor(j.nextCursor);
        setExpanded({});
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchMore() {
    if (!nextCursor) return;
    setLoading(true);
    try {
      const sp = new URLSearchParams(params);
      sp.set("cursor", nextCursor);
      const res = await fetch(`/api/admin/webhook-events?${sp.toString()}`);
      const j: ApiResp = await res.json();
      if (j.ok) {
        setRows(prev => prev.concat(j.items));
        setNextCursor(j.nextCursor);
      }
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `webhook_events_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    fetchTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Webhook Events</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
        <input
          className="border rounded-lg px-3 py-2 md:col-span-2"
          placeholder="Search id or type…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="border rounded-lg px-3 py-2"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input
          className="border rounded-lg px-3 py-2"
          type="datetime-local"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <input
          className="border rounded-lg px-3 py-2"
          type="datetime-local"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <select
          className="border rounded-lg px-3 py-2"
          value={String(limit)}
          onChange={(e) => setLimit(Number(e.target.value))}
        >
          {[25,50,100,200].map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={fetchFirstPage}
          disabled={loading}
          className="px-4 py-2 rounded-xl border shadow-sm disabled:opacity-50"
        >
          {loading ? "Loading…" : "Apply Filters"}
        </button>
        <button
          onClick={() => { setQ(""); setType(""); setFrom(""); setTo(""); setLimit(50); }}
          className="px-3 py-2 rounded-xl border"
        >
          Reset
        </button>
        <button
          onClick={exportCSV}
          className="ml-auto px-3 py-2 rounded-xl border"
          disabled={!rows.length}
        >
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-3 py-2">Received</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2 w-24">Raw</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const open = !!expanded[r.id];
              return (
                <React.Fragment key={r.id}>
                  <tr className="border-t">
                    <td className="px-3 py-2 whitespace-nowrap">{fmtDateTime(r.receivedAt)}</td>
                    <td className="px-3 py-2">{r.type}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => setExpanded(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
                        className="px-2 py-1 border rounded-lg"
                      >
                        {open ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>
                  {open && (
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="px-3 py-2">
                        <pre className="text-xs overflow-auto max-h-64">
                          {(() => {
                            try {
                              return JSON.stringify(JSON.parse(r.raw || "{}"), null, 2);
                            } catch {
                              return r.raw || "";
                            }
                          })()}
                        </pre>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {!rows.length && !loading && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500">No events</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {nextCursor && (
        <div className="flex justify-center mt-4">
          <button
            onClick={fetchMore}
            disabled={loading}
            className="px-3 py-2 rounded-xl border shadow-sm disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
} 