import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function TrendChart({ data, dataKey, title, limit, unit = '' }) {
    return (
        <div className="bg-card-bg p-6 rounded-3xl shadow-sm border border-border-base h-80">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-text-main">{title}</h2>
                <span className="text-xs text-text-muted">Target: {limit} {unit}</span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" className="stroke-gray-200 dark:stroke-slate-700" opacity={0.5} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                    />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-card-bg border border-border-base p-3 rounded-xl shadow-xl text-xs">
                                        <p className="font-semibold text-text-main mb-1">{label}</p>
                                        <p className="text-emerald-500">
                                            {payload[0].value} {unit}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry[dataKey] > limit ? '#ef4444' : '#10b981'}
                                fillOpacity={0.9}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
