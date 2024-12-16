#!/usr/bin/env node

import enquirer from "enquirer";
import holidayJp from "@holiday-jp/holiday_jp";
import { validateDate, validateHolidays } from "./validation.js";

async function main() {
  console.log("自由時間計算アプリ");
  const { firstDay, lastDay } = await getFirstAndLastDay();
  const totalDays =
    Math.floor((lastDay - firstDay) / (1000 * 60 * 60 * 24)) + 1;
  const totalHolidays = await countTotalHolidays(firstDay, lastDay, totalDays);
  console.log(totalHolidays);
}

async function getFirstAndLastDay() {
  const dateAnswer = await enquirer.prompt([
    {
      type: "input",
      name: "firstDay",
      message: "いつから?(例: 2025-01-01)",
      validate: validateDate,
    },
    {
      type: "input",
      name: "lastDay",
      message: "いつまで?(例: 2025-12-31)",
      validate: validateDate,
    },
  ]);

  const firstDay = parseInputDate(dateAnswer.firstDay);
  const lastDay = parseInputDate(dateAnswer.lastDay);

  return { firstDay, lastDay };
}

function parseInputDate(inputDate) {
  const [year, month, day] = inputDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

async function countTotalHolidays(firstDay, lastDay, totalDays) {
  const holidaysAnswer = await enquirer.prompt({
    type: "input",
    name: "holidays",
    message: "その期間の休日数は?（土日祝休みならdonichiと入力）",
    validate: (input, state) => validateHolidays(input, state, totalDays),
  });

  let totalHolidays = 0;
  if (holidaysAnswer.holidays === "donichi") {
    totalHolidays +=
      countWeekends(firstDay, lastDay) +
      countWeekdayHolidays(firstDay, lastDay);
    const otherholidays = await countOtherHolidays(totalDays, totalHolidays);
    totalHolidays += otherholidays;
    console.log(`合計の休日数: \x1b[33m${totalHolidays}日\x1b[0m`);
    return totalHolidays;
  }

  return Number(holidaysAnswer.holidays);
}

function countWeekends(firstDay, lastDay) {
  let day = new Date(firstDay);
  let weekends = 0;

  while (day <= lastDay) {
    const dayOfWeek = day.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekends++;
    }
    day.setDate(day.getDate() + 1);
  }
  return weekends;
}

function countWeekdayHolidays(firstDay, lastDay) {
  const holidays = holidayJp.between(firstDay, lastDay);
  const weekdayHolidays = holidays.filter(
    (holiday) => holiday.week !== "土" && holiday.week !== "日",
  );
  return weekdayHolidays.length;
}

async function countOtherHolidays(totalDays, holidays) {
  const otherHolidaysAnswer = await enquirer.prompt([
    {
      type: "input",
      name: "otherHolidays",
      message: "(土日祝休みの場合)その他の休日数は?",
      validate: (input, state) =>
        validateHolidays(input, state, totalDays, holidays),
    },
  ]);
  const otherHolidays = Number(otherHolidaysAnswer.otherHolidays);
  return otherHolidays;
}

try {
  await main();
} catch (error) {
  if (error === "") {
    console.error("強制終了しました");
    process.exit(130);
  } else {
    throw error;
  }
}
