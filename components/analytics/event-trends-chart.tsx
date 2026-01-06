/**
 * Event Trends Chart Component
 * Shows event creation and check-in trends over time
 */
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Event {
  id: number;
  name: string;
  date: string;
  guest_count: number;
  checked_in_count: number;
}

interface EventTrendsChartProps {
  events: Event[];
}

export function EventTrendsChart({ events }: EventTrendsChartProps) {
  // Process data to show trends by month
  const processData = () => {
    const monthlyData: Record<string, { month: string; events: number; checkIns: number; guests: number }> = {};

    events.forEach((event) => {
      const date = new Date(event.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthLabel,
          events: 0,
          checkIns: 0,
          guests: 0,
        };
      }

      monthlyData[monthKey].events += 1;
      monthlyData[monthKey].checkIns += event.checked_in_count;
      monthlyData[monthKey].guests += event.guest_count;
    });

    return Object.values(monthlyData).sort((a, b) => {
      const [aYear, aMonth] = a.month.split(' ');
      const [bYear, bMonth] = b.month.split(' ');
      return new Date(`${aMonth} 1, ${aYear}`).getTime() - new Date(`${bMonth} 1, ${bYear}`).getTime();
    });
  };

  const data = processData();

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-400">
        <p>No data available. Create events to see trends.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis
          dataKey="month"
          stroke="#718096"
          style={{ fontSize: '12px', fontWeight: 500 }}
        />
        <YAxis
          stroke="#718096"
          style={{ fontSize: '12px', fontWeight: 500 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '14px', fontWeight: 500 }}
        />
        <Line
          type="monotone"
          dataKey="events"
          stroke="#4FD1C5"
          strokeWidth={3}
          dot={{ fill: '#4FD1C5', r: 5 }}
          activeDot={{ r: 7 }}
          name="Events Created"
        />
        <Line
          type="monotone"
          dataKey="guests"
          stroke="#805AD5"
          strokeWidth={3}
          dot={{ fill: '#805AD5', r: 5 }}
          activeDot={{ r: 7 }}
          name="Total Guests"
        />
        <Line
          type="monotone"
          dataKey="checkIns"
          stroke="#48BB78"
          strokeWidth={3}
          dot={{ fill: '#48BB78', r: 5 }}
          activeDot={{ r: 7 }}
          name="Check-ins"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
