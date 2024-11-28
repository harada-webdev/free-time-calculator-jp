export function validateDate(input, state) {
  if (!isValidDateFormat(input)) {
    return "年月日をそれぞれ - で区切ってください";
  }

  if (!isValidDate(input)) {
    return "無効な日付です";
  }

  if (state.answers.firstDay) {
    if (!isValidDateOrder(input, state)) {
      return "最終日は初日より後の日付にしてください";
    }
  }

  return true;
}

function isValidDateFormat(input) {
  const dateRegex = /^\d{4}-\d{1,2}-\d{1,2}$/;
  return dateRegex.test(input);
}

function isValidDate(input) {
  const [year, month, day] = input.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    year >= 1970 &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function isValidDateOrder(input, state) {
  const firstDay = new Date(state.answers.firstDay);
  const lastDay = new Date(input);
  return lastDay >= firstDay;
}
