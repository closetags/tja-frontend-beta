'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// Industry-standard color palette (similar to Stripe, Vercel, Linear)
export const chartColors = {
  primary: '#4FD1C5',      // Teal (brand color)
  secondary: '#805AD5',    // Purple
  tertiary: '#F6AD55',     // Orange
  quaternary: '#63B3ED',   // Blue
  success: '#48BB78',      // Green
  danger: '#FC8181',       // Red
  muted: '#A0AEC0',        // Gray
  gradient: {
    primary: ['#4FD1C5', '#38B2AC'],
    secondary: ['#805AD5', '#6B46C1'],
    tertiary: ['#F6AD55', '#DD6B20'],
  }
}

// Chart theme configuration
const chartTheme = {
  fontSize: 12,
  fontFamily: 'inherit',
  tickColor: '#A0AEC0',
  gridColor: '#E2E8F0',
  tooltipBg: '#1A202C',
  tooltipText: '#FFFFFF',
}

// Custom Tooltip Component
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>
  label?: string
  formatter?: (value: number, name: string) => string
}

const CustomTooltip = ({ active, payload, label, formatter }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-700/50">
      <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>
      {payload.map((item, index) => (
        <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm font-semibold">
            {formatter ? formatter(item.value, item.name) : item.value.toLocaleString()}
          </span>
          <span className="text-gray-400 text-xs">{item.name}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================
// AREA CHART - Best for time-series trends
// ============================================
interface AreaChartData {
  name: string
  [key: string]: string | number
}

interface AnalyticsAreaChartProps {
  data: AreaChartData[]
  dataKeys: Array<{
    key: string
    name: string
    color?: string
    gradient?: boolean
  }>
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  stacked?: boolean
  formatter?: (value: number, name: string) => string
}

export function AnalyticsAreaChart({
  data,
  dataKeys,
  height = 300,
  showGrid = true,
  showLegend = true,
  stacked = false,
  formatter,
}: AnalyticsAreaChartProps) {
  const colors = [chartColors.primary, chartColors.secondary, chartColors.tertiary, chartColors.quaternary]

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          {dataKeys.map((dk, index) => {
            const color = dk.color || colors[index % colors.length]
            return (
              <linearGradient key={dk.key} id={`gradient-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            )
          })}
        </defs>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
        )}
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: chartTheme.tickColor, fontSize: chartTheme.fontSize }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: chartTheme.tickColor, fontSize: chartTheme.fontSize }}
          dx={-10}
          tickFormatter={(value) => value.toLocaleString()}
        />
        <Tooltip content={<CustomTooltip formatter={formatter} />} />
        {showLegend && (
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingBottom: '20px' }}
          />
        )}
        {dataKeys.map((dk, index) => {
          const color = dk.color || colors[index % colors.length]
          return (
            <Area
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              name={dk.name}
              stroke={color}
              strokeWidth={2}
              fill={dk.gradient !== false ? `url(#gradient-${dk.key})` : color}
              fillOpacity={dk.gradient !== false ? 1 : 0.1}
              stackId={stacked ? 'stack' : undefined}
            />
          )
        })}
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ============================================
// BAR CHART - Best for comparisons
// ============================================
interface BarChartData {
  name: string
  [key: string]: string | number
}

interface AnalyticsBarChartProps {
  data: BarChartData[]
  dataKeys: Array<{
    key: string
    name: string
    color?: string
  }>
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  stacked?: boolean
  horizontal?: boolean
  formatter?: (value: number, name: string) => string
}

export function AnalyticsBarChart({
  data,
  dataKeys,
  height = 300,
  showGrid = true,
  showLegend = true,
  stacked = false,
  horizontal = false,
  formatter,
}: AnalyticsBarChartProps) {
  const colors = [chartColors.primary, chartColors.secondary, chartColors.tertiary, chartColors.quaternary]

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 10, right: 10, left: horizontal ? 80 : 0, bottom: 0 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartTheme.gridColor}
            horizontal={!horizontal}
            vertical={horizontal}
          />
        )}
        {horizontal ? (
          <>
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: chartTheme.tickColor, fontSize: chartTheme.fontSize }} />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: chartTheme.tickColor, fontSize: chartTheme.fontSize }} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chartTheme.tickColor, fontSize: chartTheme.fontSize }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: chartTheme.tickColor, fontSize: chartTheme.fontSize }} dx={-10} tickFormatter={(value) => value.toLocaleString()} />
          </>
        )}
        <Tooltip content={<CustomTooltip formatter={formatter} />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
        {showLegend && dataKeys.length > 1 && (
          <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ paddingBottom: '20px' }} />
        )}
        {dataKeys.map((dk, index) => {
          const color = dk.color || colors[index % colors.length]
          return (
            <Bar
              key={dk.key}
              dataKey={dk.key}
              name={dk.name}
              fill={color}
              radius={[4, 4, 0, 0]}
              stackId={stacked ? 'stack' : undefined}
            />
          )
        })}
      </BarChart>
    </ResponsiveContainer>
  )
}

// ============================================
// LINE CHART - Best for precise trends
// ============================================
interface LineChartData {
  name: string
  [key: string]: string | number
}

interface AnalyticsLineChartProps {
  data: LineChartData[]
  dataKeys: Array<{
    key: string
    name: string
    color?: string
    dashed?: boolean
  }>
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  showDots?: boolean
  formatter?: (value: number, name: string) => string
}

export function AnalyticsLineChart({
  data,
  dataKeys,
  height = 300,
  showGrid = true,
  showLegend = true,
  showDots = false,
  formatter,
}: AnalyticsLineChartProps) {
  const colors = [chartColors.primary, chartColors.secondary, chartColors.tertiary, chartColors.quaternary]

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
        )}
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: chartTheme.tickColor, fontSize: chartTheme.fontSize }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: chartTheme.tickColor, fontSize: chartTheme.fontSize }}
          dx={-10}
          tickFormatter={(value) => value.toLocaleString()}
        />
        <Tooltip content={<CustomTooltip formatter={formatter} />} />
        {showLegend && (
          <Legend verticalAlign="top" height={36} iconType="line" iconSize={14} wrapperStyle={{ paddingBottom: '20px' }} />
        )}
        {dataKeys.map((dk, index) => {
          const color = dk.color || colors[index % colors.length]
          return (
            <Line
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              name={dk.name}
              stroke={color}
              strokeWidth={2}
              strokeDasharray={dk.dashed ? '5 5' : undefined}
              dot={showDots ? { fill: color, strokeWidth: 2, r: 4 } : false}
              activeDot={{ fill: color, strokeWidth: 2, r: 6 }}
            />
          )
        })}
      </LineChart>
    </ResponsiveContainer>
  )
}

// ============================================
// PIE / DONUT CHART - Best for proportions
// ============================================
interface PieChartData {
  name: string
  value: number
  color?: string
}

interface AnalyticsPieChartProps {
  data: PieChartData[]
  height?: number
  innerRadius?: number
  showLegend?: boolean
  showLabels?: boolean
  formatter?: (value: number, name: string) => string
}

export function AnalyticsPieChart({
  data,
  height = 300,
  innerRadius = 0,
  showLegend = true,
  showLabels = false,
  formatter,
}: AnalyticsPieChartProps) {
  const defaultColors = [
    chartColors.primary,
    chartColors.secondary,
    chartColors.tertiary,
    chartColors.quaternary,
    chartColors.success,
    chartColors.danger,
  ]

  const total = data.reduce((sum, item) => sum + item.value, 0)

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    if (percent < 0.05) return null // Don't show labels for small slices
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={height / 3}
          paddingAngle={2}
          dataKey="value"
          label={showLabels ? renderCustomLabel : false}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || defaultColors[index % defaultColors.length]}
            />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null
            const item = payload[0]
            const percentage = ((item.value as number) / total * 100).toFixed(1)
            return (
              <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.payload?.fill }}
                  />
                  <span className="text-gray-400 text-xs">{item.name}</span>
                </div>
                <p className="text-lg font-bold">
                  {formatter ? formatter(item.value as number, item.name as string) : (item.value as number).toLocaleString()}
                </p>
                <p className="text-gray-400 text-xs">{percentage}% of total</p>
              </div>
            )
          }}
        />
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-gray-600 text-sm">{value}</span>}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  )
}

// ============================================
// STAT CARD WITH MINI CHART
// ============================================
interface MiniChartData {
  value: number
}

interface StatCardWithChartProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  chartData?: MiniChartData[]
  chartColor?: string
  icon?: React.ReactNode
  gradient?: 'teal' | 'purple' | 'orange' | 'blue' | 'green'
}

export function StatCardWithChart({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  chartData,
  chartColor = chartColors.primary,
  icon,
  gradient = 'teal',
}: StatCardWithChartProps) {
  const gradients = {
    teal: 'from-[#4FD1C5] to-[#38B2AC]',
    purple: 'from-[#805AD5] to-[#6B46C1]',
    orange: 'from-[#F6AD55] to-[#DD6B20]',
    blue: 'from-[#63B3ED] to-[#3182CE]',
    green: 'from-[#48BB78] to-[#38A169]',
  }

  return (
    <div className={`bg-gradient-to-br ${gradients[gradient]} rounded-3xl p-6 text-white shadow-xl relative overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full" />
      <div className="absolute -right-2 -bottom-8 w-32 h-32 bg-white/5 rounded-full" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          {icon && <div className="opacity-80">{icon}</div>}
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-medium ${change >= 0 ? 'text-green-200' : 'text-red-200'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
            </div>
          )}
        </div>
        
        <p className="text-white/80 text-sm mb-1">{title}</p>
        <p className="text-3xl font-bold mb-2">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        
        {change !== undefined && (
          <p className="text-white/60 text-xs">{changeLabel}</p>
        )}
        
        {chartData && chartData.length > 0 && (
          <div className="mt-4 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth={2}
                  fill="rgba(255,255,255,0.1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// CHART CARD WRAPPER
// ============================================
interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function ChartCard({ title, description, children, actions, className = '' }: ChartCardProps) {
  return (
    <div className={`bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden ${className}`}>
      <div className="p-6 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}
