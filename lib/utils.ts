import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type EventStatus = 'live' | 'upcoming' | 'past';

export interface EventStatusInfo {
  status: EventStatus;
  label: string;
  color: string;
  bgColor: string;
  dotColor: string;
}

/**
 * Determines if an event is live, upcoming, or past based on date and time
 * - LIVE: Current date/time is between start and end (or within time window if same day)
 * - PAST: Event end date is before today (uses end_date if available, otherwise start_date)
 * - UPCOMING: Event hasn't started yet
 */
export function getEventStatus(
  eventDate: string, 
  eventTime: string,
  endDate?: string | null,
  endTime?: string | null
): EventStatusInfo {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Parse event start date
  const startDateObj = new Date(eventDate);
  const startDateOnly = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());
  
  // Parse event end date (use start date if not provided)
  const endDateObj = endDate ? new Date(endDate) : startDateObj;
  const endDateOnly = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());
  
  // Check if event is in the past (end date is before today)
  if (endDateOnly < today) {
    return {
      status: 'past',
      label: 'Past Event',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50/50',
      dotColor: 'bg-gray-500'
    };
  }
  
  // Check if event is currently active (today is between start and end date, or is the start/end date)
  const isWithinDateRange = startDateOnly <= today && today <= endDateOnly;
  
  if (isWithinDateRange) {
    // For multi-day events, if we're between start and end dates, it's live
    if (startDateOnly < today && today < endDateOnly) {
      return {
        status: 'live',
        label: 'Active Event',
        color: 'text-teal-600',
        bgColor: 'bg-teal-50/50',
        dotColor: 'bg-teal-500'
      };
    }
    
    // If today is the start date or end date, check time
    const timeParts = eventTime.split(':');
    const eventHour = parseInt(timeParts[0], 10);
    const eventMinute = parseInt(timeParts[1], 10);
    
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Convert to minutes for easier comparison
    const startTimeInMinutes = eventHour * 60 + eventMinute;
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // Parse end time if available
    let endTimeInMinutes = startTimeInMinutes + 180; // Default 3 hours after start
    if (endTime) {
      const endTimeParts = endTime.split(':');
      endTimeInMinutes = parseInt(endTimeParts[0], 10) * 60 + parseInt(endTimeParts[1], 10);
    }
    
    // Determine if live based on current position
    let isLive = false;
    
    if (startDateOnly.getTime() === endDateOnly.getTime()) {
      // Single day event - check if within time range
      isLive = currentTimeInMinutes >= (startTimeInMinutes - 60) && 
               currentTimeInMinutes <= endTimeInMinutes;
    } else if (today.getTime() === startDateOnly.getTime()) {
      // Today is start date - live if after start time
      isLive = currentTimeInMinutes >= (startTimeInMinutes - 60);
    } else if (today.getTime() === endDateOnly.getTime()) {
      // Today is end date - live if before end time
      isLive = currentTimeInMinutes <= endTimeInMinutes;
    }
    
    if (isLive) {
      return {
        status: 'live',
        label: 'Active Event',
        color: 'text-teal-600',
        bgColor: 'bg-teal-50/50',
        dotColor: 'bg-teal-500'
      };
    }
  }
  
  // Event is upcoming (hasn't started yet)
  return {
    status: 'upcoming',
    label: 'Upcoming Event',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50/50',
    dotColor: 'bg-purple-500'
  };
}
