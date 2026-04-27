import { useEffect, useState } from "react";
import {
  getOverview, getLaunchesByYear, getSatellitesByOrbit,
  getTopCompanies, getLaunchesByStatus, getSatsByPurpose
} from "../api";

function LineChart({ data }) {
  const W = 600, H = 160, PAD_LEFT = 50, PAD_RIGHT = 20, PAD_TOP = 10, PAD_BOTTOM = 30;
  if (!data.length) return null;
  const maxVal = Math.max(...data.map(d => d.total));
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  const pts = data.map((d, i) => {
    const x = PAD_LEFT + (i / (data.length - 1)) * chartW;
    const y = PAD_TOP + chartH - ((d.total / maxVal) * chartH);
    return { x, y, ...d };
  });

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaD = `${pathD} L${pts[pts.length-1].x},${PAD_TOP + chartH} L${pts[0].x},${PAD_TOP + chartH} Z`;

  // Y-axis tick values
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    val: Math.round(maxVal * t),
    y: PAD_TOP + chartH - t * chartH
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0284c7" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y-axis grid lines + labels */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={PAD_LEFT} y1={t.y} x2={W - PAD_RIGHT} y2={t.y}
            stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
          <text x={PAD_LEFT - 6} y={t.y} textAnchor="end" dominantBaseline="middle"
            fill="#94a3b8" fontSize="9" fontFamily="'Space Mono'">{t.val}</text>
        </g>
      ))}

      {/* Y-axis line */}
      <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={PAD_TOP + chartH}
        stroke="#e2e8f0" strokeWidth="1" />

      {/* X-axis line */}
      <line x1={PAD_LEFT} y1={PAD_TOP + chartH} x2={W - PAD_RIGHT} y2={PAD_TOP + chartH}
        stroke="#e2e8f0" strokeWidth="1" />

      {/* Area fill */}
      <path d={areaD} fill="url(#areaGrad)" />

      {/* Success line */}
      <path d={pts.map((p, i) => {
        const y = PAD_TOP + chartH - ((p.successes / maxVal) * chartH);
        return `${i === 0 ? "M" : "L"}${p.x},${y}`;
      }).join(" ")} fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.8" />

      {/* Total line */}
      <path d={pathD} fill="none" stroke="#0284c7" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* X-axis labels */}
      {pts.filter((_, i) => i % Math.ceil(pts.length / 10) === 0).map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="2.5" fill="#0284c7" />
          <text x={p.x} y={PAD_TOP + chartH + 14} textAnchor="middle"
            fill="#94a3b8" fontSize="9" fontFamily="'Space Mono'">{p.year}</text>
        </g>
      ))}

      {/* Y-axis label */}
      <text x={10} y={H / 2} textAnchor="middle" dominantBaseline="middle"
        fill="#94a3b8" fontSize="9" fontFamily="'Space Mono'"
        transform={`rotate(-90, 10, ${H / 2})`}>Launches</text>
    </svg>
  );
}

function DonutChart({ data, colors }) {
  const SIZE=130, R=48, CX=65, CY=65;
  const total = data.reduce((s,d) => s + d.count, 0);
  let angle = -Math.PI/2;
  const slices = data.map((d,i) => {
    const frac = d.count/total;
    const sa = angle;
    angle += frac*2*Math.PI;
    const x1=CX+R*Math.cos(sa), y1=CY+R*Math.sin(sa);
    const x2=CX+R*Math.cos(angle), y2=CY+R*Math.sin(angle);
    return {
      path:`M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${frac>0.5?1:0} 1 ${x2},${y2} Z`,
      color:colors[i%colors.length], ...d
    };
  });
  return (
    <div className="donut-wrap">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{width:120,height:120,flexShrink:0}}>
        <circle cx={CX} cy={CY} r={R-16} fill="white" stroke="#e2e8f0" strokeWidth="1"/>
        {slices.map((s,i) => <path key={i} d={s.path} fill={s.color}/>)}
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central"
          fill="#0f172a" fontSize="15" fontWeight="700" fontFamily="'Space Mono'">
          {total.toLocaleString()}
        </text>
      </svg>
      <div className="donut-legend">
        {slices.map((s,i) => (
          <div key={i} className="legend-item">
            <div className="legend-dot" style={{background:s.color}}/>
            <span style={{flex:1}}>{s.orbit_class||s.status}</span>
            <span style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--text3)"}}>
              {s.count.toLocaleString()}
            </span>
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
    getOverview().then(r => setOverview(r.data));
    getLaunchesByYear().then(r => setByYear(r.data));
    getSatellitesByOrbit().then(r => setByOrbit(r.data));
    getTopCompanies().then(r => setTopCos(r.data));
    getLaunchesByStatus().then(r => setByStatus(r.data));
    getSatsByPurpose().then(r => setByPurpose(r.data));
  }, []);

  const ORBIT_COLORS  = ["#0ea5e9","#7c3aed","#f59e0b","#10b981","#ec4899"];
  const STATUS_COLORS = ["#10b981","#ef4444","#f59e0b","#94a3b8"];
  const maxL = Math.max(...topCos.map(c => c.launches), 1);
  const maxP = Math.max(...byPurpose.map(p => p.count), 1);

  const stats = [
    {label:"Total Launches",   value:overview?.total_launches?.toLocaleString(),   sub:"all time",         color:"#0ea5e9"},
    {label:"Satellites",       value:overview?.total_satellites?.toLocaleString(),  sub:"in database",      color:"#7c3aed"},
    {label:"Companies",        value:overview?.total_companies?.toLocaleString(),   sub:"launch providers", color:"#f59e0b"},
    {label:"Countries",        value:overview?.total_countries?.toLocaleString(),   sub:"represented",      color:"#10b981"},
    {label:"Success Rate",     value:overview?.success_rate?`${overview.success_rate}%`:"—", sub:"mission success", color:"#ec4899"},
  ];

  return (
    <div>
      <div className="stats-grid">
        {stats.map((s,i) => (
          <div key={i} className="stat-card" style={{"--accent-c":s.color}}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value ?? "—"}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-title">Launches Per Year</div>
          <div style={{height:180}}><LineChart data={byYear}/></div>
          <div style={{display:"flex",gap:20,marginTop:12}}>
            {[
              {color:"#0ea5e9",dash:false,label:"Total launches"},
              {color:"#10b981",dash:true, label:"Successes"},
            ].map((l,i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:7,fontSize:12,color:"var(--text2)"}}>
                <svg width="22" height="10">
                  <line x1="0" y1="5" x2="22" y2="5" stroke={l.color} strokeWidth="2.5"
                    strokeDasharray={l.dash?"5 3":"none"} strokeLinecap="round"/>
                </svg>
                {l.label}
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Satellites by Orbit</div>
          {byOrbit.length>0 && <DonutChart data={byOrbit} colors={ORBIT_COLORS}/>}
        </div>
      </div>

      <div className="charts-grid-3">
        <div className="card">
          <div className="card-title">Top Launch Companies</div>
          <div className="bar-chart">
            {topCos.map((c,i) => (
              <div key={i} className="bar-row">
                <div className="bar-label" title={c.name}>{c.name}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{
                    width:`${(c.launches/maxL)*100}%`,
                    background:`linear-gradient(90deg,#0ea5e9,#7c3aed)`
                  }}/>
                </div>
                <div className="bar-count">{c.launches}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Mission Status</div>
          {byStatus.length>0 && <DonutChart data={byStatus} colors={STATUS_COLORS}/>}
        </div>

        <div className="card">
          <div className="card-title">Top Satellite Purposes</div>
          <div className="bar-chart">
            {byPurpose.map((p,i) => (
              <div key={i} className="bar-row">
                <div className="bar-label" title={p.purpose}>{p.purpose}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{
                    width:`${(p.count/maxP)*100}%`,
                    background:`linear-gradient(90deg,#7c3aed,#ec4899)`
                  }}/>
                </div>
                <div className="bar-count">{p.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}