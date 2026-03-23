import { isSameDay } from "date-fns";

export const isHourDisabled = (hour: number, date: Date, minValue?: Date): boolean => {
  if (!minValue || !isSameDay(date, minValue)) return false;
  return hour < minValue.getHours();
};

export const isMinuteDisabled = (
  minute: number,
  tempDate: Date,
  date: Date,
  minValue?: Date,
): boolean => {
  if (!minValue || !isSameDay(date, minValue)) return false;
  const selectedHour = tempDate.getHours();
  const minHour = minValue.getHours();
  const minMinute = minValue.getMinutes();

  if (selectedHour < minHour) return true;
  if (selectedHour === minHour) return minute < minMinute;
  return false;
};

export const isTimeStringDisabled = (timeString: string, date: Date, minValue?: Date): boolean => {
  if (!minValue || !isSameDay(date, minValue)) return false;

  const [hoursStr, minutesStr] = timeString.split(":");
  const hours = hoursStr ? parseInt(hoursStr, 10) : 0;
  const minutes = minutesStr ? parseInt(minutesStr, 10) : 0;

  if (isNaN(hours) || isNaN(minutes)) return true;

  const minHour = minValue.getHours();
  const minMinute = minValue.getMinutes();

  return hours < minHour || (hours === minHour && minutes < minMinute);
};
