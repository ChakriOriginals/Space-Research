import { useEffect, useState, useRef } from "react";
import {
  getOverview, getLaunchesByYear, getSatellitesByOrbit,
  getTopCompanies, getLaunchesByStatus, getSatsByPurpose
} from "../api";
 
function LineChart({ data }) {
  const [rangeFrom, setRangeFrom] = useState(null);
  const [rangeTo,   setRangeTo]   = useState(null);
  const [tooltip,   setTooltip]   = useState(null);
  const svgRef = useRef();

  const allYears = (data || []).map(d => d.year).filter(Boolean);
  const minYear  = allYears[0] || 1957;
  const maxYear  = allYears[allYears.length - 1] || 2023;

  useEffect(() => {
    if (allYears.length) { setRangeFrom(allYears[0]); setRangeTo(allYears[allYears.length - 1]); }
  }, [allYears.length]);

  if (!data || data.length === 0) return (
    <div style={{ height:200, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text3)", fontSize:13 }}>
      Loading chart...
    </div>
  );

  const from = rangeFrom || minYear;
  const to   = rangeTo   || maxYear;
  const filtered = data.filter(d => d.year >= from && d.year <= to);

  if (filtered.length < 2) return (
    <div style={{ height:200, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text3)", fontSize:13 }}>
      Select a wider year range
    </div>
  );

  const W=580, H=180, PL=46, PR=16, PT=10, PB=28;
  const cW=W-PL-PR, cH=H-PT-PB;
  const maxVal = Math.max(...filtered.map(d => d.total||0), 1);
  const toX = i => PL + (i/(filtered.length-1))*cW;
  const toY = v => PT + cH - ((v||0)/maxVal)*cH;
  const pts = filtered.map((d,i) => ({...d, x:toX(i), y:toY(d.total)}));
  const pathD    = pts.map((p,i)=>`${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD    = `${pathD} L${pts[pts.length-1].x},${PT+cH} L${pts[0].x},${PT+cH} Z`;
  const successD = filtered.map((d,i)=>`${i===0?"M":"L"}${toX(i).toFixed(1)},${toY(d.successes||0).toFixed(1)}`).join(" ");
  const yTicks   = [0,0.25,0.5,0.75,1].map(t=>({val:Math.round(maxVal*t), y:PT+cH-t*cH}));
  const xStep    = Math.max(1, Math.ceil(filtered.length/8));
  const xLabels  = pts.filter((_,i)=>i%xStep===0||i===pts.length-1);

  const handleMouseMove = e => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = (e.clientX-rect.left)*(W/rect.width)-PL;
    const idx = Math.max(0, Math.min(filtered.length-1, Math.round((mx/cW)*(filtered.length-1))));
    setTooltip({...filtered[idx], x:pts[idx].x, y:pts[idx].y});
  };

  const PRESETS = [
    { label:"All",      from:minYear, to:maxYear },
    { label:"Cold War", from:1957,    to:1991   },
    { label:"2000s",    from:2000,    to:2009   },
    { label:"2010s",    from:2010,    to:2019   },
  ];

  const selectStyle = {
    padding:"5px 10px", fontSize:12, borderRadius:8,
    border:"1px solid var(--border)", background:"var(--bg)",
    color:"var(--text)", cursor:"pointer", fontFamily:"var(--sans)",
    appearance:"none", WebkitAppearance:"none",
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%2394a3b8' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
    backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center",
    paddingRight:28, minWidth:80
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:14, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, background:"var(--bg)", border:"1px solid var(--border)", borderRadius:10, padding:"4px 10px" }}>
          <span style={{ fontSize:11, color:"var(--text3)", fontWeight:600, whiteSpace:"nowrap" }}>From</span>
          <select value={from} onChange={e=>setRangeFrom(Number(e.target.value))} style={selectStyle}>
            {allYears.filter(y=>y<=to).map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <span style={{ fontSize:11, color:"var(--text3)", padding:"0 2px" }}>→</span>
          <span style={{ fontSize:11, color:"var(--text3)", fontWeight:600, whiteSpace:"nowrap" }}>To</span>
          <select value={to} onChange={e=>setRangeTo(Number(e.target.value))} style={selectStyle}>
            {allYears.filter(y=>y>=from).map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ display:"flex", gap:4 }}>
          {PRESETS.map(p => {
            const pF=Math.max(p.from,minYear), pT=Math.min(p.to,maxYear);
            const active=from===pF&&to===pT;
            return (
              <button key={p.label} onClick={()=>{setRangeFrom(pF);setRangeTo(pT);}}
                style={{ padding:"5px 11px", fontSize:11, borderRadius:20, cursor:"pointer",
                  border:`1px solid ${active?"var(--accent)":"var(--border)"}`,
                  background:active?"var(--accent)":"transparent",
                  color:active?"#fff":"var(--text2)",
                  fontWeight:active?600:400,
                  transition:"all 0.15s", whiteSpace:"nowrap" }}>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:H }}
        onMouseMove={handleMouseMove} onMouseLeave={()=>setTooltip(null)}>
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0284c7" stopOpacity="0.12"/>
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {yTicks.map((t,i)=>(
          <g key={i}>
            <line x1={PL} y1={t.y} x2={W-PR} y2={t.y} stroke="rgba(0,0,0,0.05)" strokeWidth="1"/>
            <text x={PL-5} y={t.y} textAnchor="end" dominantBaseline="middle" fill="#cbd5e1" fontSize="8.5" fontFamily="'Space Mono'">{t.val}</text>
          </g>
        ))}
        <line x1={PL} y1={PT}    x2={PL}   y2={PT+cH} stroke="#e2e8f0" strokeWidth="1"/>
        <line x1={PL} y1={PT+cH} x2={W-PR} y2={PT+cH} stroke="#e2e8f0" strokeWidth="1"/>
        <path d={areaD}    fill="url(#ag)"/>
        <path d={successD} fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.75"/>
        <path d={pathD}    fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {xLabels.map((p,i)=>(
          <text key={i} x={p.x} y={PT+cH+14} textAnchor="middle" fill="#cbd5e1" fontSize="8.5" fontFamily="'Space Mono'">{p.year}</text>
        ))}
        {tooltip&&(
          <g>
            <line x1={tooltip.x} y1={PT} x2={tooltip.x} y2={PT+cH} stroke="#0284c7" strokeWidth="1" strokeDasharray="3 2" opacity="0.35"/>
            <circle cx={tooltip.x} cy={tooltip.y} r="4" fill="#0284c7" stroke="#fff" strokeWidth="2"/>
            <rect x={Math.min(tooltip.x+10,W-116)} y={tooltip.y-44} width="108" height="58" rx="8"
              fill="white" stroke="#e2e8f0" strokeWidth="1" style={{filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.12))"}}/>
            <text x={Math.min(tooltip.x+64,W-62)} y={tooltip.y-29} textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="700" fontFamily="'Space Mono'">{tooltip.year}</text>
            <text x={Math.min(tooltip.x+64,W-62)} y={tooltip.y-13} textAnchor="middle" fill="#0284c7" fontSize="10" fontFamily="'Space Mono'">{(tooltip.total||0).toLocaleString()} total</text>
            <text x={Math.min(tooltip.x+64,W-62)} y={tooltip.y+3}  textAnchor="middle" fill="#10b981" fontSize="10" fontFamily="'Space Mono'">{(tooltip.successes||0).toLocaleString()} success</text>
          </g>
        )}
      </svg>

      <div style={{ display:"flex", gap:16, marginTop:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--text2)" }}>
          <div style={{ width:18, height:2, background:"#0284c7", borderRadius:1 }}/> Total launches
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--text2)" }}>
          <div style={{ width:18, borderTop:"2px dashed #10b981" }}/> Successes
        </div>
      </div>
    </div>
  );
}

function DonutChart({ data, colors }) {
  if (!data||!data.length) return null;
  const SIZE=120, R=45, CX=60, CY=60;
  const total=data.reduce((s,d)=>s+(d.count||0),0);
  if (!total) return null;
  let angle=-Math.PI/2;
  const slices=data.map((d,i)=>{
    const frac=(d.count||0)/total, sa=angle;
    angle+=frac*2*Math.PI;
    const x1=CX+R*Math.cos(sa),y1=CY+R*Math.sin(sa);
    const x2=CX+R*Math.cos(angle),y2=CY+R*Math.sin(angle);
    return {path:`M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${frac>0.5?1:0} 1 ${x2},${y2} Z`,color:colors[i%colors.length],...d};
  });
  return (
    <div className="donut-wrap">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{width:120,height:120,flexShrink:0}}>
        <circle cx={CX} cy={CY} r={R-14} fill="var(--bg)"/>
        {slices.map((s,i)=><path key={i} d={s.path} fill={s.color} opacity="0.85"/>)}
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central"
          fill="var(--text)" fontSize="16" fontWeight="700" fontFamily="'Space Mono'">{total.toLocaleString()}</text>
      </svg>
      <div className="donut-legend">
        {slices.map((s,i)=>(
          <div key={i} className="legend-item">
            <div className="legend-dot" style={{background:s.color}}/>
            <span>{s.orbit_class||s.status}</span>
            <span style={{marginLeft:"auto",fontFamily:"var(--mono)",fontSize:11,color:"var(--text3)"}}>{(s.count||0).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [overview,  setOverview]  = useState(null);
  const [byYear,    setByYear]    = useState([]);
  const [byOrbit,   setByOrbit]   = useState([]);
  const [topCos,    setTopCos]    = useState([]);
  const [byStatus,  setByStatus]  = useState([]);
  const [byPurpose, setByPurpose] = useState([]);

  useEffect(() => {
    getOverview().then(r=>setOverview(r.data)).catch(()=>{});
    getLaunchesByYear().then(r=>setByYear(r.data||[])).catch(()=>{});
    getSatellitesByOrbit().then(r=>setByOrbit(r.data||[])).catch(()=>{});
    getTopCompanies().then(r=>setTopCos(r.data||[])).catch(()=>{});
    getLaunchesByStatus().then(r=>setByStatus(r.data||[])).catch(()=>{});
    getSatsByPurpose().then(r=>setByPurpose(r.data||[])).catch(()=>{});
  }, []);

  const ORBIT_COLORS  = ["#0284c7","#7c3aed","#f59e0b","#10b981","#ec4899"];
  const STATUS_COLORS = ["#10b981","#ef4444","#f59e0b","#94a3b8"];
  const maxLaunches   = Math.max(...(topCos.map(c=>c.launches||0)),1);
  const maxPurpose    = Math.max(...(byPurpose.map(p=>p.count||0)),1);

  return (
    <div>
      {/* Stat Cards */}
      <div className="stats-grid">
        {[
          {label:"Total Launches",value:overview?.total_launches?.toLocaleString(),  sub:"all time",         color:"#0284c7"},
          {label:"Satellites",    value:overview?.total_satellites?.toLocaleString(), sub:"in database",      color:"#7c3aed"},
          {label:"Companies",     value:overview?.total_companies?.toLocaleString(),  sub:"launch providers", color:"#d97706"},
          {label:"Countries",     value:overview?.total_countries?.toLocaleString(),  sub:"represented",      color:"#10b981"},
          {label:"Success Rate",  value:overview?.success_rate?`${overview.success_rate}%`:"—",sub:"mission success",color:"#ec4899"},
        ].map((s,i)=>(
          <div key={i} className="stat-card" style={{"--accent-c":s.color}}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value??"—"}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Line Chart + Top Companies */}
      <div className="charts-grid" style={{marginBottom:20}}>
        <div className="card">
          <div className="card-title">Launches Per Year</div>
          <LineChart data={byYear}/>
        </div>
        <div className="card">
          <div className="card-title">Top Launch Companies</div>
          <div className="bar-chart">
            {topCos.map((c,i)=>(
              <div key={i} className="bar-row">
                <div className="bar-label" title={c.name}>{c.name}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{width:`${((c.launches||0)/maxLaunches)*100}%`,background:"linear-gradient(90deg,#0284c7,#7c3aed)"}}/>
                </div>
                <div className="bar-count">{c.launches}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="charts-grid-3">
        <div className="card">
          <div className="card-title">Top Satellite Purposes</div>
          <div className="bar-chart">
            {byPurpose.map((p,i)=>(
              <div key={i} className="bar-row">
                <div className="bar-label" title={p.purpose}>{p.purpose}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{width:`${((p.count||0)/maxPurpose)*100}%`,background:"linear-gradient(90deg,#7c3aed,#ec4899)"}}/>
                </div>
                <div className="bar-count">{p.count}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Satellites by Orbit</div>
          {byOrbit.length>0
            ? <DonutChart data={byOrbit} colors={ORBIT_COLORS}/>
            : <div style={{color:"var(--text3)",fontSize:13}}>Loading...</div>}
        </div>
        <div className="card">
          <div className="card-title">Mission Status</div>
          {byStatus.length>0
            ? <DonutChart data={byStatus} colors={STATUS_COLORS}/>
            : <div style={{color:"var(--text3)",fontSize:13}}>Loading...</div>}
        </div>
      </div>
    </div>
  );
}
