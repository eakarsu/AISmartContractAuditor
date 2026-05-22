import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

const SEVERITY_COLOR = {
  CRITICAL: '#dc2626',
  HIGH: '#ea580c',
  MEDIUM: '#ca8a04',
  LOW: '#16a34a',
};

function CustomTreemapContent(props) {
  const { x, y, width, height, name, severity, color, depth } = props;
  const fill = color || SEVERITY_COLOR[severity] || (depth === 1 ? '#1f2937' : '#374151');
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill,
          stroke: '#0f172a',
          strokeWidth: 2 / (depth + 1),
          strokeOpacity: 1 / (depth + 1),
        }}
      />
      {width > 60 && height > 24 ? (
        <text
          x={x + 6}
          y={y + 16}
          fill="#fff"
          fontSize={depth === 1 ? 12 : 11}
          fontWeight={depth === 1 ? 700 : 500}
        >
          {String(name || '').slice(0, 22)}
        </text>
      ) : null}
    </g>
  );
}

export default function VulnTreemap({ data }) {
  const groups = (data && data.groups) || [];
  // Flatten for Treemap "children" prop
  const treemapData = groups.map((g) => ({
    name: g.name,
    severity: g.severity,
    color: g.color || SEVERITY_COLOR[g.severity],
    children: (g.children || []).map((c) => ({
      name: c.name,
      size: Math.max(1, Number(c.size) || 1),
      severity: c.severity || g.severity,
      color: c.color || SEVERITY_COLOR[g.severity],
      category: c.category,
    })),
  }));

  const total = (data && data.total) || groups.reduce((a, g) => a + (g.children?.length || 0), 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Vulnerability Treemap</h3>
          <p className="text-xs text-gray-500">Tile size = vulnerability count, colored by severity</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
            <div key={s} className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: SEVERITY_COLOR[s] }} />
              <span className="text-gray-700">{s.toLowerCase()}</span>
            </div>
          ))}
          <span className="text-gray-500 ml-2">Total: <strong className="text-gray-900">{total}</strong></span>
        </div>
      </div>
      <div style={{ width: '100%', height: 380 }}>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treemapData}
            dataKey="size"
            stroke="#fff"
            content={<CustomTreemapContent />}
            isAnimationActive={false}
          >
            <Tooltip
              formatter={(value, name, props) => [
                `${value} (${props?.payload?.severity || ''})`,
                props?.payload?.name || name,
              ]}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
