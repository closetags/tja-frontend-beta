export interface TimezoneOption {
  value: string;
  label: string;
  aliases?: string[];
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: 'UTC', label: 'UTC', aliases: ['Etc/UTC', 'Etc/GMT'] },
  { value: 'GMT', label: 'GMT', aliases: ['Europe/London'] },
  { value: 'WAT', label: 'WAT', aliases: ['Africa/Lagos'] },
  { value: 'SAST', label: 'SAST', aliases: ['Africa/Johannesburg'] },
  { value: 'EET', label: 'EET', aliases: ['Africa/Cairo'] },
  { value: 'CET', label: 'CET', aliases: ['Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome'] },
  { value: 'EST', label: 'EST', aliases: ['America/New_York', 'America/Toronto'] },
  { value: 'CST', label: 'CST', aliases: ['America/Chicago', 'Asia/Shanghai'] },
  { value: 'MST', label: 'MST', aliases: ['America/Denver', 'America/Phoenix'] },
  { value: 'PST', label: 'PST', aliases: ['America/Los_Angeles'] },
  { value: 'AKST', label: 'AKST', aliases: ['America/Anchorage'] },
  { value: 'HST', label: 'HST', aliases: ['Pacific/Honolulu'] },
  { value: 'AST', label: 'AST', aliases: ['America/Halifax'] },
  { value: 'GST', label: 'GST', aliases: ['Asia/Dubai'] },
  { value: 'PKT', label: 'PKT', aliases: ['Asia/Karachi'] },
  { value: 'IST', label: 'IST', aliases: ['Asia/Kolkata'] },
  { value: 'SGT', label: 'SGT', aliases: ['Asia/Singapore'] },
  { value: 'JST', label: 'JST', aliases: ['Asia/Tokyo'] },
  { value: 'WIB', label: 'WIB', aliases: ['Asia/Jakarta'] },
  { value: 'AEST', label: 'AEST', aliases: ['Australia/Sydney'] },
  { value: 'NZST', label: 'NZST', aliases: ['Pacific/Auckland'] },
];

const timezoneAliasMap = new Map<string, string>();

TIMEZONE_OPTIONS.forEach((option) => {
  timezoneAliasMap.set(option.value, option.value);
  option.aliases?.forEach((alias) => timezoneAliasMap.set(alias, option.value));
});

export const normalizeTimezone = (timezone?: string | null): string => {
  if (!timezone) {
    return '';
  }

  return timezoneAliasMap.get(timezone) ?? timezone;
};
