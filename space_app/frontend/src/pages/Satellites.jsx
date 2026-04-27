import { useEffect, useState, useCallback } from "react";
import {
  getSatellites, getSatellite, createSatellite, updateSatellite, deleteSatellite,
  getOrbits, getOperators, getPurposes, getContractors, getVehicles, getCountries
} from "../api";

function orbitBadge(cls) {
  const map = { LEO: "leo", GEO: "geo", MEO: "meo", ELLIPTICAL: "elliptical" };
  return <span className={`badge badge-${map[cls] || "unknown"}`}>{cls}</span>;
}

//   Filter Panel                        
function FilterPanel({ filters, setFilters, orbits, operators, purposes, countries, onReset }) {
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

        {/* Orbit */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Orbit Class</label>
          <select value={filters.orbit || ""} onChange={e => set("orbit", e.target.value)}>
            <option value="">All Orbits</option>
            {["LEO","GEO","MEO","ELLIPTICAL"].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Purpose */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Purpose</label>
          <select value={filters.purpose || ""} onChange={e => set("purpose", e.target.value)}>
            <option value="">All Purposes</option>
            {purposes.map(p => <option key={p.id} value={p.id}>{p.purpose}</option>)}
          </select>
        </div>

        {/* Operator */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Operator</label>
          <select value={filters.operator || ""} onChange={e => set("operator", e.target.value)}>
            <option value="">All Operators</option>
            {operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>

        {/* Country */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Country</label>
          <select value={filters.country || ""} onChange={e => set("country", e.target.value)}>
            <option value="">All Countries</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Mass range */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Min Mass (kg)</label>
          <input type="number" placeholder="e.g. 0" value={filters.massMin || ""}
            onChange={e => set("massMin", e.target.value)} />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Max Mass (kg)</label>
          <input type="number" placeholder="e.g. 10000" value={filters.massMax || ""}
            onChange={e => set("massMax", e.target.value)} />
        </div>

        {/* Lifetime */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Min Lifetime (yrs)</label>
          <input type="number" step="0.5" placeholder="e.g. 1" value={filters.lifetimeMin || ""}
            onChange={e => set("lifetimeMin", e.target.value)} />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Max Lifetime (yrs)</label>
          <input type="number" step="0.5" placeholder="e.g. 20" value={filters.lifetimeMax || ""}
            onChange={e => set("lifetimeMax", e.target.value)} />
        </div>

        {/* Sort by */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Sort By</label>
          <select value={filters.sortBy || "launch_date"} onChange={e => set("sortBy", e.target.value)}>
            <option value="launch_date">Launch Date</option>
            <option value="name_asc">Name A → Z</option>
            <option value="name_desc">Name Z → A</option>
            <option value="mass_desc">Mass (High → Low)</option>
            <option value="mass_asc">Mass (Low → High)</option>
            <option value="lifetime_desc">Lifetime (High → Low)</option>
            <option value="perigee_asc">Perigee (Low → High)</option>
            <option value="apogee_desc">Apogee (High → Low)</option>
          </select>
        </div>

        {/* Sort direction for date */}
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

//   Modal (Create/Edit)                    ─
function Modal({ mode, data, onClose, onSave, toast }) {
  const [form, setForm]         = useState(data || {});
  const [orbits, setOrbits]     = useState([]);
  const [ops, setOps]           = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [contractors, setCons]  = useState([]);
  const [vehicles, setVehs]     = useState([]);
  const [countries, setCnts]    = useState([]);

  useEffect(() => {
    getOrbits().then(r => setOrbits(r.data));
    getOperators().then(r => setOps(r.data));
    getPurposes().then(r => setPurposes(r.data));
    getContractors().then(r => setCons(r.data));
    getVehicles().then(r => setVehs(r.data));
    getCountries().then(r => setCnts(r.data));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    try {
      if (!form.name) { toast("Name is required", "error"); return; }
      await onSave(form);
      toast(mode === "create" ? "Satellite created!" : "Satellite updated!");
      onClose();
    } catch { toast("Operation failed", "error"); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{mode === "create" ? "Add New Satellite" : "Edit Satellite"}</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Satellite Name *</label>
              <input value={form.name || ""} onChange={e => set("name", e.target.value)} placeholder="e.g. Starlink-1234" />
            </div>
            <div className="form-group">
              <label>Alternate Names</label>
              <input value={form.alternate_names || ""} onChange={e => set("alternate_names", e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>COSPAR Number</label>
              <input value={form.cospar_number || ""} onChange={e => set("cospar_number", e.target.value)} placeholder="e.g. 2019-089H" />
            </div>
            <div className="form-group">
              <label>NORAD Number</label>
              <input type="number" value={form.norad_number || ""} onChange={e => set("norad_number", e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Orbit Type</label>
              <select value={form.orbit_id || ""} onChange={e => set("orbit_id", e.target.value)}>
                <option value="">Select orbit...</option>
                {orbits.map(o => <option key={o.id} value={o.id}>{o.orbit_class} – {o.orbit_type}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Operator</label>
              <select value={form.operator_id || ""} onChange={e => set("operator_id", e.target.value)}>
                <option value="">Select operator...</option>
                {ops.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Purpose</label>
              <select value={form.purpose_id || ""} onChange={e => set("purpose_id", e.target.value)}>
                <option value="">Select purpose...</option>
                {purposes.map(p => <option key={p.id} value={p.id}>{p.purpose}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Country</label>
              <select value={form.country_id || ""} onChange={e => set("country_id", e.target.value)}>
                <option value="">Select country...</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Contractor</label>
              <select value={form.contractor_id || ""} onChange={e => set("contractor_id", e.target.value)}>
                <option value="">Select contractor...</option>
                {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Launch Vehicle</label>
              <select value={form.vehicle_id || ""} onChange={e => set("vehicle_id", e.target.value)}>
                <option value="">Select vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Launch Date</label>
              <input type="date" value={form.launch_date?.slice(0,10) || ""} onChange={e => set("launch_date", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Launch Site</label>
              <input value={form.launch_site || ""} onChange={e => set("launch_site", e.target.value)} />
            </div>
          </div>
          <div className="form-row-3">
            <div className="form-group">
              <label>Perigee (km)</label>
              <input type="number" value={form.perigee_km || ""} onChange={e => set("perigee_km", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Apogee (km)</label>
              <input type="number" value={form.apogee_km || ""} onChange={e => set("apogee_km", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Mass (kg)</label>
              <input type="number" value={form.launch_mass_kg || ""} onChange={e => set("launch_mass_kg", e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Expected Lifetime (yrs)</label>
              <input type="number" step="0.5" value={form.expected_lifetime_yrs || ""} onChange={e => set("expected_lifetime_yrs", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Geo Longitude</label>
              <input type="number" step="0.01" value={form.geo_longitude || ""} onChange={e => set("geo_longitude", e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Comments</label>
            <textarea value={form.comments || ""} onChange={e => set("comments", e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {mode === "create" ? "Create Satellite" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

//   Detail Modal                        
function DetailModal({ id, onClose }) {
  const [d, setD] = useState(null);
  useEffect(() => { getSatellite(id).then(r => setD(r.data)); }, [id]);
  if (!d) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 760 }}>
        <div className="modal-header">
          <div>
            <h3>{d.name}</h3>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{d.alternate_names}</div>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {orbitBadge(d.orbit_class)}
            <span className="badge badge-unknown">{d.purpose}</span>
            <span className="badge badge-unknown">{d.country}</span>
          </div>
          <div className="detail-grid">
            {[
              ["COSPAR",      d.cospar_number],
              ["NORAD",       d.norad_number],
              ["Operator",    d.operator],
              ["Contractor",  d.contractor],
              ["Vehicle",     d.vehicle],
              ["Launch Date", d.launch_date],
              ["Launch Site", d.launch_site],
              ["Orbit Type",  d.orbit_type],
              ["Perigee",     d.perigee_km  ? `${d.perigee_km} km`  : "—"],
              ["Apogee",      d.apogee_km   ? `${d.apogee_km} km`   : "—"],
              ["Inclination", d.inclination_deg ? `${d.inclination_deg}°` : "—"],
              ["Period",      d.period_min  ? `${d.period_min} min` : "—"],
              ["Mass",        d.launch_mass_kg ? `${d.launch_mass_kg} kg` : "—"],
              ["Lifetime",    d.expected_lifetime_yrs ? `${d.expected_lifetime_yrs} yrs` : "—"],
            ].map(([k, v]) => (
              <div key={k} className="detail-item">
                <div className="detail-key">{k}</div>
                <div className="detail-val" style={{ fontFamily: "var(--sans)", fontSize: 13 }}>{v || "—"}</div>
              </div>
            ))}
          </div>
          {d.comments && d.comments !== "No comments available" && (
            <div style={{ marginTop: 16, padding: 14, background: "rgba(0,0,0,0.03)", borderRadius: 8, fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>
              {d.comments}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

//   Active Filter Tags                     
function FilterTags({ filters, orbits, purposes, operators, countries, onRemove }) {
  const labels = {
    yearFrom:    v => `From ${v}`,
    yearTo:      v => `To ${v}`,
    orbit:       v => `Orbit: ${v}`,
    purpose:     v => { const p = purposes.find(x => String(x.id) === String(v)); return p ? `Purpose: ${p.purpose}` : null; },
    operator:    v => { const o = operators.find(x => String(x.id) === String(v)); return o ? `Operator: ${o.name}` : null; },
    country:     v => { const c = countries.find(x => String(x.id) === String(v)); return c ? `Country: ${c.name}` : null; },
    massMin:     v => `Mass ≥ ${v}kg`,
    massMax:     v => `Mass ≤ ${v}kg`,
    lifetimeMin: v => `Lifetime ≥ ${v}yr`,
    lifetimeMax: v => `Lifetime ≤ ${v}yr`,
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

//   Main Page                         ─
const DEFAULT_FILTERS = {
  yearFrom: "", yearTo: "", orbit: "", purpose: "", operator: "",
  country: "", massMin: "", massMax: "", lifetimeMin: "", lifetimeMax: "",
  sortBy: "launch_date", dateOrder: "desc"
};

export default function Satellites({ toast }) {
  const [rows,      setRows]      = useState([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [search,    setSearch]    = useState("");
  const [filters,   setFilters]   = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [modal,     setModal]     = useState(null);
  const [detail,    setDetail]    = useState(null);
  const [loading,   setLoading]   = useState(false);

  // Lookup data for dropdowns
  const [orbits,    setOrbits]    = useState([]);
  const [operators, setOperators] = useState([]);
  const [purposes,  setPurposes]  = useState([]);
  const [countries, setCountries] = useState([]);

  const LIMIT = 20;

  useEffect(() => {
    getOrbits().then(r => setOrbits(r.data));
    getOperators().then(r => setOperators(r.data));
    getPurposes().then(r => setPurposes(r.data));
    getCountries().then(r => setCountries(r.data));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = {
      page, limit: LIMIT, search,
      orbit:        filters.orbit,
      purpose_id:   filters.purpose,
      operator_id:  filters.operator,
      country_id:   filters.country,
      year_from:    filters.yearFrom,
      year_to:      filters.yearTo,
      mass_min:     filters.massMin,
      mass_max:     filters.massMax,
      lifetime_min: filters.lifetimeMin,
      lifetime_max: filters.lifetimeMax,
      sort_by:      filters.sortBy,
      date_order:   filters.dateOrder,
    };
    getSatellites(params).then(r => {
      setRows(r.data.data); setTotal(r.data.total); setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, search, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, filters]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this satellite?")) return;
    try { await deleteSatellite(id); toast("Satellite deleted"); load(); }
    catch { toast("Delete failed", "error"); }
  };

  const handleSave = async (form) => {
    if (modal.mode === "create") await createSatellite(form);
    else await updateSatellite(modal.data.id, form);
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
          <input placeholder="Search satellites..." value={search}
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
          + Add Satellite
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          orbits={orbits}
          operators={operators}
          purposes={purposes}
          countries={countries}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />
      )}

      {/* Active filter tags */}
      <FilterTags
        filters={filters}
        orbits={orbits}
        purposes={purposes}
        operators={operators}
        countries={countries}
        onRemove={k => setFilters(f => ({ ...f, [k]: "" }))}
      />

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Orbit</th><th>Purpose</th>
                <th>Operator</th><th>Country</th><th>Launch Date</th>
                <th>Perigee</th><th>Apogee</th><th>Mass (kg)</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={11}>
                  <div className="empty">
                    <span className="empty-icon">🛰</span>
                    <p>No satellites match your filters</p>
                    <button className="btn btn-ghost btn-sm" onClick={() => setFilters(DEFAULT_FILTERS)}>Clear filters</button>
                  </div>
                </td></tr>
              ) : rows.map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: "var(--mono)", color: "var(--text3)", fontSize: 11 }}>{r.id}</td>
                  <td style={{ color: "var(--text)", fontWeight: 500, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</td>
                  <td>{orbitBadge(r.orbit_class)}</td>
                  <td style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", fontSize: 12 }}>{r.purpose}</td>
                  <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", fontSize: 12 }}>{r.operator}</td>
                  <td style={{ fontSize: 12 }}>{r.country}</td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{r.launch_date || "—"}</td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{r.perigee_km ?? "—"}</td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{r.apogee_km  ?? "—"}</td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{r.launch_mass_kg ?? "—"}</td>
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

        {/* Pagination */}
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