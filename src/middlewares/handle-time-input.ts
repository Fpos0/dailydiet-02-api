
export function HandleTimeInput(timeStr: string) {
  const timePattern = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;

  if (!timePattern.test(timeStr)) {
    return false
  }

  const [, hours, minutes] = timeStr.match(timePattern)!;

  const validHours = Number(hours) >= 0 && Number(hours) <= 23;
  const validMinutes = Number(minutes) >= 0 && Number(minutes) <= 59;

  return validHours && validMinutes;
}