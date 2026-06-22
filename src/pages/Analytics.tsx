import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { LiquidCard, MetricTile, PageHeader } from '../components/ui'
import { engagementSeries, platformPerf } from '../data/dummy'

const pieColors = ['#ff375f', '#0a84ff', '#ff453a', '#bf5af2']

export default function Analytics() {
  return (
    <>
      <PageHeader title="Analytics" subtitle="Performance across all channels · last 7 days" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 16 }}>
        <MetricTile label="Impressions" value="39.8k" trend="+14%" dir="up" accent="var(--blue)" />
        <MetricTile label="Engagement" value="3.1k" trend="+9%" dir="up" accent="var(--green)" />
        <MetricTile label="Avg. CPL" value="$12.40" trend="-6%" dir="up" accent="var(--purple)" />
        <MetricTile label="Conversions" value="48" trend="+11%" dir="up" accent="var(--orange)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <LiquidCard lg>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Impressions &amp; Engagement</h2>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradImp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0a84ff" stopOpacity={0.35} />
                    <stop offset="75%" stopColor="#0a84ff" stopOpacity={0.05} />
                    <stop offset="100%" stopColor="#0a84ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradEng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#30d158" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#30d158" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--separator)" strokeWidth={0.5} strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--label-tertiary)', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--label-tertiary)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-layer1)', border: '1px solid var(--separator)', borderRadius: 12, color: 'var(--label-primary)' }} />
                <Area type="monotone" dataKey="impressions" stroke="#0a84ff" strokeWidth={2} fill="url(#gradImp)" />
                <Area type="monotone" dataKey="engagement" stroke="#30d158" strokeWidth={2} fill="url(#gradEng)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </LiquidCard>

        <LiquidCard lg>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Share by Platform</h2>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={platformPerf} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={3} stroke="none">
                  {platformPerf.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 13, color: 'var(--label-secondary)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-layer1)', border: '1px solid var(--separator)', borderRadius: 12, color: 'var(--label-primary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </LiquidCard>
      </div>
    </>
  )
}
