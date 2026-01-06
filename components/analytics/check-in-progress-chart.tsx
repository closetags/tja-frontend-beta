'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Event } from '@/types/event';

interface CheckInProgressChartProps {
  events: Event[];
}

export function CheckInProgressChart({ events }: CheckInProgressChartProps) {
  const data = useMemo(() => {
    // Get events from the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData: Record<
      string,
      {
        month: string;
        totalGuests: number;
        checkedIn: number;
        pending: number;
        rate: number;
      }
    > = {};

    events
      .filter((event) => new Date(event.date) >= sixMonthsAgo)
      .forEach((event) => {
        const date = new Date(event.date);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthName,
            totalGuests: 0,
            checkedIn: 0,
            pending: 0,
            rate: 0,
          };
        }

        const totalGuests = event.total_guests || 0;
        const checkedIn = event.checked_in_count || 0;
        const pending = totalGuests - checkedIn;

        monthlyData[monthKey].totalGuests += totalGuests;
        monthlyData[monthKey].checkedIn += checkedIn;
        monthlyData[monthKey].pending += pending;
      });

    // Calculate check-in rate
    Object.values(monthlyData).forEach((data) => {
      data.rate =
        data.totalGuests > 0
          ? Math.round((data.checkedIn / data.totalGuests) * 100)
          : 0;
    });

    return Object.values(monthlyData).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  }, [events]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No check-in data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorCheckedIn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#48BB78" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#48BB78" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F6AD55" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#F6AD55" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
        <XAxis
          dataKey="month"
          stroke="#9CA3AF"
          fontSize={12}
          tickLine={false}
        />
        <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F9FAFB',
          }}
          labelStyle={{ color: '#F9FAFB', fontWeight: 600 }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="circle"
          formatter={(value) => (
            <span style={{ color: '#9CA3AF', fontSize: '14px' }}>{value}</span>
          )}
        />
        <Area
          type="monotone"
          dataKey="checkedIn"
          stackId="1"
          stroke="#48BB78"
          strokeWidth={2}
          fill="url(#colorCheckedIn)"
          name="Checked In"
        />
        <Area
          type="monotone"
          dataKey="pending"
          stackId="1"
          stroke="#F6AD55"
          strokeWidth={2}
          fill="url(#colorPending)"
          name="Pending"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
