

// Grab data sent by the api and check if it's a real date 
export function HandleDateInput(dateString: string) {
  const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

  if (!datePattern.test(dateString)) {
    return false
  }

  const [, year, month, day] = dateString.match(datePattern)!;

  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return (
    date.getUTCFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)
  )

}