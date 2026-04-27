import { useEffect, useState, useCallback } from "react";
import {
  getLaunches, getLaunch, createLaunch, updateLaunch, deleteLaunch,
  getCompanies, getRockets, getSites
} from "../api";

function statusBadge(s) {
  const map = { Success: "success", Failure: "failure", "Partial Failure": "partial", Unknown: "unknown", "Prelaunch Failure": "failure" };
  return <span className={`badge badge-${map[s] || "unknown"}`}>{s || "Unknown"}</span>;
}

// ── Filter Panel ──────────────────────────────────────────────
function FilterPanel({ filters, setFilters, companies, rockets, sites, onReset }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1957 + 1 }, (_, i) => 1957 + i).reverse();
  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <div style={{
      background: "var(--bg2)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", padding: "16px 20px", marginBottom: 18
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)" }}>
          🔽 Filters
        </span>
        <button className="btn btn-ghost btn-sm" onClick={onReset}>Reset All</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>

        {/* Year From */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Launch Year From</label>
          <select value={filters.yearFrom || ""} onChange={e => set("yearFrom", e.target.value)}>
            <option value="">Any</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Year To */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Launch Year To</label>
          <select value={filters.yearTo || ""} onChange={e => set("yearTo", e.target.value)}>
            <option value="">Any</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Company */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Company</label>
          <select value={filters.company || ""} onChange={e => set("company", e.target.value)}>
            <option value="">All Companies</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Mission Status */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Mission Status</label>
          <select value={filters.status || ""} onChange={e => set("status", e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Failure">Failure</option>
            <option value="Partial Failure">Partial Failure</option>
            <option value="Prelaunch Failure">Prelaunch Failure</option>
          </select>
        </div>

        {/* Rocket */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Rocket</label>
          <select value={filters.rocket || ""} onChange={e => set("rocket", e.target.value)}>
            <option value="">All Rockets</option>
            {rockets.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        {/* Launch Site */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Launch Site</label>
          <select value={filters.site || ""} onChange={e => set("site", e.target.value)}>
            <option value="">All Sites</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.complex}</option>)}
          </select>
        </div>

        {/* Sort By */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Sort By</label>
          <select value={filters.sortBy || "launch_date"} onChange={e => set("sortBy", e.target.value)}>
            <option value="launch_date">Launch Date</option>
            <option value="mission_name_asc">Mission Name A → Z</option>
            <option value="mission_name_desc">Mission Name Z → A</option>
            <option value="company_asc">Company A → Z</option>
            <option value="rocket_asc">Rocket A → Z</option>
            <option value="year_asc">Year (Oldest First)</option>
            <option value="year_desc">Year (Newest First)</option>
          </select>
        </div>

        {/* Date Order */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Date Order</label>
          <select value={filters.dateOrder || "desc"} onChange={e => set("dateOrder", e.target.value)}>
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>

      </div>
    </div>
  );
}

// ── Active Filter Tags ────────────────────────────────────────
function FilterTags({ filters, companies, rockets, sites, onRemove }) {
  const labels = {
    yearFrom: v => `From ${v}`,
    yearTo:   v => `To ${v}`,
    status:   v => `Status: ${v}`,
    company:  v => { const c = companies.find(x => String(x.id) === String(v)); return c ? `Company: ${c.name}` : null; },
    rocket:   v => { const r = rockets.find(x => String(x.id) === String(v)); return r ? `Rocket: ${r.name}` : null; },
    site:     v => { const s = sites.find(x => String(x.id) === String(v)); return s ? `Site: ${s.complex}` : null; },
  };
  const active = Object.entries(filters).filter(([k, v]) => v && labels[k]);
  if (!active.length) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
      {active.map(([k, v]) => {
        const label = labels[k]?.(v);
        if (!label) return null;
        return (
          <span key={k} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "rgba(2,132,199,0.1)", border: "1px solid rgba(2,132,199,0.2)",
            color: "var(--accent)", borderRadius: 20, padding: "2px 10px", fontSize: 12
          }}>
            {label}
            <span style={{ cursor: "pointer", fontWeight: 700 }} onClick={() => onRemove(k)}>×</span>
          </span>
        );
      })}
    </div>
  );
}

// ── Create/Edit Modal ─────────────────────────────────────────
function Modal({ mode, data, onClose, onSave, toast }) {
  const [form, setForm]       = useState(data || {});
  const [companies, setComp]  = useState([]);
  const [rockets,   setRock]  = useState([]);
  const [sites,     setSite]  = useState([]);

  useEffect(() => {
    getCompanies().then(r => setComp(r.data));
    getRockets().then(r => setRock(r.data));
    getSites().then(r => setSite(r.data));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    try {
      if (!form.company_id || !form.rocket_id || !form.site_id) {
        toast("Please fill required fields", "error"); return;
      }
      await onSave(form);
      toast(mode === "create" ? "Launch created!" : "Launch updated!");
      onClose();
    } catch { toast("Operation failed", "error"); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{mode === "create" ? "Add New Launch" : "Edit Launch"}</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Company *</label>
              <select value={form.company_id || ""} onChange={e => set("company_id", e.target.value)}>
                <option value="">Select company...</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Rocket *</label>
              <select value={form.rocket_id || ""} onChange={e => set("rocket_id", e.target.value)}>
                <option value="">Select rocket...</option>
                {rockets.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Launch Site *</label>
            <select value={form.site_id || ""} onChange={e => set("site_id", e.target.value)}>
              <option value="">Select site...</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.complex} – {s.pad}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Mission Name</label>
              <input value={form.mission_name || ""} onChange={e => set("mission_name", e.target.value)} placeholder="e.g. Starlink V1 L9" />
            </div>
            <div className="form-group">
              <label>Launch Date</label>
              <input type="date" value={form.launch_date?.slice(0,10) || ""} onChange={e => {
                set("launch_date", e.target.value);
                set("launch_year", e.target.value ? new Date(e.target.value).getFullYear() : null);
              }} />
            </div>
          </div>
          <div className="form-group">
            <label>Mission Status</label>
            <select value={form.mission_status || "Unknown"} onChange={e => set("mission_status", e.target.value)}>
              {["Success","Failure","Partial Failure","Prelaunch Failure","Unknown"].map(s =>
                <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {mode === "create" ? "Create Launch" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────
function DetailModal({ id, onClose }) {
  const [data, setData] = useState(null);
  useEffect(() => { getLaunch(id).then(r => setData(r.data)); }, [id]);
  if (!data) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Launch Details #{data.id}</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{data.mission_name || "—"}</div>
            {statusBadge(data.mission_status)}
          </div>
          <div className="detail-grid">
            {[
              ["Company",     data.company],
              ["Rocket",      data.rocket],
              ["Launch Site", data.site],
              ["Pad",         data.pad],
              ["Date",        data.launch_date],
              ["Year",        data.launch_year],
            ].map(([k, v]) => (
              <div key={k} className="detail-item">
                <div className="detail-key">{k}</div>
                <div className="detail-val" style={{ fontFamily: "var(--sans)", fontSize: 13 }}>{v || "—"}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  yearFrom: "", yearTo: "", company: "", status: "",
  rocket: "", site: "", sortBy: "launch_date", dateOrder: "desc"
};

export default function Launches({ toast }) {
  const [rows,        setRows]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState("");
  const [filters,     setFilters]     = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [modal,       setModal]       = useState(null);
  const [detail,      setDetail]      = useState(null);
  const [loading,     setLoading]     = useState(false);

  const [companies, setCompanies] = useState([]);
  const [rockets,   setRockets]   = useState([]);
  const [sites,     setSites]     = useState([]);

  const LIMIT = 20;

  useEffect(() => {
    getCompanies().then(r => setCompanies(r.data));
    getRockets().then(r => setRockets(r.data));
    getSites().then(r => setSites(r.data));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = {
      page, limit: LIMIT, search,
      company_id:  filters.company,
      status:      filters.status,
      rocket_id:   filters.rocket,
      site_id:     filters.site,
      year_from:   filters.yearFrom,
      year_to:     filters.yearTo,
      sort_by:     filters.sortBy,
      date_order:  filters.dateOrder,
    };
    getLaunches(params).then(r => {
      setRows(r.data.data); setTotal(r.data.total); setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, search, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, filters]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this launch?")) return;
    try { await deleteLaunch(id); toast("Launch deleted"); load(); }
    catch { toast("Delete failed", "error"); }
  };

  const handleSave = async (form) => {
    if (modal.mode === "create") await createLaunch(form);
    else await updateLaunch(modal.data.id, form);
    load();
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => v && !["sortBy","dateOrder"].includes(k)
  ).length;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input placeholder="Search missions..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <button
          className={`btn ${showFilters ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setShowFilters(f => !f)}
        >
          ⚙ Filters {activeFilterCount > 0 && (
            <span style={{
              background: "rgba(255,255,255,0.3)", borderRadius: 10,
              padding: "1px 6px", fontSize: 11, marginLeft: 4
            }}>{activeFilterCount}</span>
          )}
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: "var(--text3)", fontFamily: "var(--mono)" }}>
          {total.toLocaleString()} records
        </span>
        <button className="btn btn-primary" onClick={() => setModal({ mode: "create", data: {} })}>
          + Add Launch
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          companies={companies}
          rockets={rockets}
          sites={sites}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />
      )}

      {/* Active filter tags */}
      <FilterTags
        filters={filters}
        companies={companies}
        rockets={rockets}
        sites={sites}
        onRemove={k => setFilters(f => ({ ...f, [k]: "" }))}
      />

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Date</th><th>Mission</th><th>Company</th>
                <th>Rocket</th><th>Site</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty">
                    <span className="empty-icon">🚀</span>
                    <p>No launches match your filters</p>
                    <button className="btn btn-ghost btn-sm" onClick={() => setFilters(DEFAULT_FILTERS)}>Clear filters</button>
                  </div>
                </td></tr>
              ) : rows.map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: "var(--mono)", color: "var(--text3)", fontSize: 11 }}>{r.id}</td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{r.launch_date || "—"}</td>
                  <td style={{ color: "var(--text)", fontWeight: 500, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>{r.mission_name || "—"}</td>
                  <td style={{ fontSize: 13 }}>{r.company}</td>
                  <td style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", fontSize: 12 }}>{r.rocket}</td>
                  <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", fontSize: 12 }}>{r.site}</td>
                  <td>{statusBadge(r.mission_status)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" title="View"   onClick={() => setDetail(r.id)}>◉</button>
                      <button className="btn btn-ghost btn-sm btn-icon" title="Edit"   onClick={() => setModal({ mode: "edit", data: r })}>✎</button>
                      <button className="btn btn-danger btn-sm btn-icon" title="Delete" onClick={() => handleDelete(r.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="page-info">Page {page} of {totalPages || 1}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      </div>

      {modal  && <Modal mode={modal.mode} data={modal.data} onClose={() => setModal(null)} onSave={handleSave} toast={toast} />}
      {detail && <DetailModal id={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}