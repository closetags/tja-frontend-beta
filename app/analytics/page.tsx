'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { showError, showSuccess } from '@/lib/toast'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import { 
  BarChart3, 
  Users, 
  Calendar, 
  TrendingUp, 
  ArrowUp, 
  ArrowDown, 
  Activity, 
  ArrowLeft,
  Download,
  RefreshCw,
  Mail,
  QrCode,
  Gift,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AnalyticsAreaChart,
  AnalyticsBarChart,
  AnalyticsLineChart,
  AnalyticsPieChart,
  StatCardWithChart,
  ChartCard,
  chartColors,
} from '@/components/analytics/charts'

interface AnalyticsData {
  period: {
    start_date: string
    end_date: string
    label: string
  }
  totals: {
    events_created: number
    guests_added: number
    guests_checked_in: number
    qr_codes_generated: number
    qr_codes_scanned: number
    invitations_sent: number
    souvenirs_sent: number
    api_calls: number
    api_errors: number
    avg_active_users: number
  }
  current_stats: {
    total_events: number
    total_guests: number
    active_events: number
  }
  trends: {
    events_change: number
    guests_change: number
    checkins_change: number
  }
  daily_breakdown: Array<{
    date: string
    events: number
    guests: number
    checkins: number
    invitations: number
    qr_scans: number
  }>
  upcoming_events: Array<{
    id: number
    name: string
    date: string
    time: string
    venue: string
    guest_count: number
  }>
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { isLoading: isCheckingAccess } = useProtectedRoute()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [period, setPeriod] = useState('current')

  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (isCheckingAccess) return

    fetchAnalytics()
  }, [isCheckingAccess, period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await apiClient.request(`/analytics/usage/monthly/?period=${period}`)

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        showError(errorData, 'Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      showError(error, 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAnalytics()
    setIsRefreshing(false)
    showSuccess('Analytics refreshed')
  }

  if (isCheckingAccess || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4FD1C5] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  // Create chart-ready data
  const dailyChartData = analytics?.daily_breakdown?.map(day => ({
    name: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Guests: day.guests,
    'Check-ins': day.checkins,
    Invitations: day.invitations,
    'QR Scans': day.qr_scans,
  })) || []

  const engagementPieData = [
    { name: 'Check-ins', value: analytics?.totals.guests_checked_in || 0, color: chartColors.primary },
    { name: 'QR Scans', value: analytics?.totals.qr_codes_scanned || 0, color: chartColors.secondary },
    { name: 'Invitations', value: analytics?.totals.invitations_sent || 0, color: chartColors.tertiary },
    { name: 'Souvenirs', value: analytics?.totals.souvenirs_sent || 0, color: chartColors.quaternary },
  ].filter(item => item.value > 0)

  const eventComparisonData = analytics?.upcoming_events?.map(event => ({
    name: event.name.length > 12 ? event.name.substring(0, 12) + '...' : event.name,
    Guests: event.guest_count,
  })) || []

  // Mini sparkline data for stat cards
  const generateSparklineData = (total: number) => {
    const data = []
    for (let i = 0; i < 7; i++) {
      data.push({ value: Math.floor(Math.random() * (total / 5)) + total / 10 })
    }
    return data
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const TrendIndicator = ({ value }: { value: number }) => {
    if (value === 0) return <span className="text-gray-400 text-xs">No change</span>

    const isPositive = value > 0
    return (
      <span className={`flex items-center text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? <ArrowUp className="h-3 w-3 mr-0.5" /> : <ArrowDown className="h-3 w-3 mr-0.5" />}
        {Math.abs(value)}%
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B8DFD8] via-[#C8E6E0] to-[#D8EDE8]">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl shadow-teal-900/10 p-8 min-h-[calc(100vh-4rem)]">
          
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6 group"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics & Reports</h1>
                <p className="text-gray-600">
                  Comprehensive insights from{' '}
                  <span className="font-semibold">{analytics ? formatDate(analytics.period.start_date) : ''}</span> to{' '}
                  <span className="font-semibold">{analytics ? formatDate(analytics.period.end_date) : ''}</span>
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="rounded-xl"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Period Selector */}
          <div className="mb-8 flex gap-2 flex-wrap">
            {[
              { value: 'current', label: 'This Month' },
              { value: 'last_month', label: 'Last Month' },
              { value: 'last_3_months', label: '3 Months' },
              { value: 'last_6_months', label: '6 Months' },
              { value: 'year_to_date', label: 'Year to Date' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`px-5 py-2.5 rounded-2xl font-medium transition-all ${
                  period === option.value
                    ? 'bg-gradient-to-r from-[#4FD1C5] to-[#38B2AC] text-white shadow-lg shadow-teal-500/30'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {!analytics ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-xl font-semibold text-gray-700 mb-2">No Analytics Data</p>
              <p className="text-gray-500">Start creating events to see your analytics</p>
            </div>
          ) : (
            <>
              {/* Stat Cards with Mini Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCardWithChart
                  title="Events Created"
                  value={analytics.totals.events_created}
                  change={analytics.trends.events_change}
                  changeLabel="vs previous period"
                  gradient="purple"
                  icon={<Calendar className="h-6 w-6" />}
                  chartData={generateSparklineData(analytics.totals.events_created)}
                />
                
                <StatCardWithChart
                  title="Guests Added"
                  value={analytics.totals.guests_added}
                  change={analytics.trends.guests_change}
                  changeLabel="vs previous period"
                  gradient="blue"
                  icon={<Users className="h-6 w-6" />}
                  chartData={generateSparklineData(analytics.totals.guests_added)}
                />
                
                <StatCardWithChart
                  title="Check-ins"
                  value={analytics.totals.guests_checked_in}
                  change={analytics.trends.checkins_change}
                  changeLabel="vs previous period"
                  gradient="teal"
                  icon={<Activity className="h-6 w-6" />}
                  chartData={generateSparklineData(analytics.totals.guests_checked_in)}
                />
                
                <StatCardWithChart
                  title="QR Scans"
                  value={analytics.totals.qr_codes_scanned}
                  gradient="orange"
                  icon={<QrCode className="h-6 w-6" />}
                  chartData={generateSparklineData(analytics.totals.qr_codes_scanned)}
                />
              </div>

              {/* Main Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Activity Trend Chart - Takes 2 columns */}
                <ChartCard
                  title="Activity Trends"
                  description="Daily activity breakdown over the selected period"
                  className="lg:col-span-2"
                >
                  {dailyChartData.length === 0 ? (
                    <div className="flex items-center justify-center h-[350px] text-gray-400">
                      No daily data available for this period
                    </div>
                  ) : (
                    <AnalyticsAreaChart
                      data={dailyChartData}
                      dataKeys={[
                        { key: 'Guests', name: 'Guests Added', color: chartColors.quaternary },
                        { key: 'Check-ins', name: 'Check-ins', color: chartColors.primary },
                      ]}
                      height={350}
                      stacked={false}
                    />
                  )}
                </ChartCard>

                {/* Engagement Distribution */}
                <ChartCard
                  title="Engagement Distribution"
                  description="How guests interact with your events"
                >
                  {engagementPieData.length === 0 ? (
                    <div className="flex items-center justify-center h-[350px] text-gray-400">
                      No engagement data available
                    </div>
                  ) : (
                    <AnalyticsPieChart
                      data={engagementPieData}
                      height={350}
                      innerRadius={70}
                      showLabels
                    />
                  )}
                </ChartCard>
              </div>

              {/* Secondary Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Communication Metrics */}
                <ChartCard
                  title="Communication Metrics"
                  description="Invitations and QR code performance"
                >
                  {dailyChartData.length === 0 ? (
                    <div className="flex items-center justify-center h-[300px] text-gray-400">
                      No communication data available
                    </div>
                  ) : (
                    <AnalyticsLineChart
                      data={dailyChartData}
                      dataKeys={[
                        { key: 'Invitations', name: 'Invitations Sent', color: chartColors.secondary },
                        { key: 'QR Scans', name: 'QR Scans', color: chartColors.primary },
                      ]}
                      height={300}
                      showDots
                    />
                  )}
                </ChartCard>

                {/* Upcoming Events Comparison */}
                <ChartCard
                  title="Upcoming Events"
                  description="Guest count comparison for upcoming events"
                >
                  {eventComparisonData.length === 0 ? (
                    <div className="flex items-center justify-center h-[300px] text-gray-400">
                      No upcoming events
                    </div>
                  ) : (
                    <AnalyticsBarChart
                      data={eventComparisonData}
                      dataKeys={[
                        { key: 'Guests', name: 'Expected Guests', color: chartColors.primary },
                      ]}
                      height={300}
                      showLegend={false}
                    />
                  )}
                </ChartCard>
              </div>

              {/* Detailed Metrics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Current Stats */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-3xl p-6 border border-gray-200/50">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Current Overview</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                        <span className="text-gray-700 font-medium">Total Events</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{analytics.current_stats.total_events}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="text-gray-700 font-medium">Total Guests</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{analytics.current_stats.total_guests}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                          <Activity className="h-5 w-5 text-teal-600" />
                        </div>
                        <span className="text-gray-700 font-medium">Active Events</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{analytics.current_stats.active_events}</span>
                    </div>
                  </div>
                </div>

                {/* Engagement Metrics */}
                <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-3xl p-6 border border-teal-200/50">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Engagement</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-teal-600" />
                        </div>
                        <span className="text-gray-700 font-medium">Invitations</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{analytics.totals.invitations_sent}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                          <QrCode className="h-5 w-5 text-purple-600" />
                        </div>
                        <span className="text-gray-700 font-medium">QR Generated</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{analytics.totals.qr_codes_generated}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                          <Gift className="h-5 w-5 text-orange-600" />
                        </div>
                        <span className="text-gray-700 font-medium">Souvenirs</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{analytics.totals.souvenirs_sent}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Events List */}
              {analytics.upcoming_events.length > 0 && (
                <ChartCard
                  title="Upcoming Events"
                  description="Events scheduled in the next 30 days"
                  actions={
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => router.push('/events/new')}
                    >
                      Create Event
                    </Button>
                  }
                >
                  <div className="space-y-3">
                    {analytics.upcoming_events.map((event) => (
                      <div
                        key={event.id}
                        className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer group"
                        onClick={() => router.push(`/events/${event.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-[#4FD1C5] transition-colors">
                              {event.name}
                            </h4>
                            <p className="text-gray-600 text-sm mb-1">{event.venue}</p>
                            <p className="text-gray-500 text-sm">
                              {formatDate(event.date)} at {event.time}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-[#4FD1C5]">{event.guest_count}</p>
                            <p className="text-gray-500 text-sm">guests</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
