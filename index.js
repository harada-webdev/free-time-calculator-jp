#!/usr/bin/env node

import enquirer from "enquirer";
import holidayJp from "@holiday-jp/holiday_jp";
import { validateDate, validateHolidays, validateTime } from "./validation.js";

async function main() {
  console.log("自由時間計算アプリ");
  const { firstDay, lastDay, totalDays, totalHolidays, essentialTimes } =
    await getUserInput();

  const totalEssentialTime = essentialTimes.reduce(
    (sum, time) => sum + time,
    0,
  );
  const weekdayFreeTime = 24 * 60 - totalEssentialTime;
  const workingTime = essentialTimes[2] + essentialTimes[3];
  const holidayFreeTime = weekdayFreeTime + workingTime;
  showFreeTime("平日", weekdayFreeTime);
  showFreeTime("休日", holidayFreeTime);

  const totalWeekdays = totalDays - totalHolidays;
  const totalFreeTime =
    weekdayFreeTime * totalWeekdays + holidayFreeTime * totalHolidays;
  showFreeTime("合計", totalFreeTime);
  console.log(`(${formatDate(firstDay)}から${formatDate(lastDay)}まで)`);
}

async function getUserInput() {
  try {
    const { firstDay, lastDay } = await getFirstAndLastDay();
    const totalDays =
      Math.floor((lastDay - firstDay) / (1000 * 60 * 60 * 24)) + 1;
    const totalHolidays = await countTotalHolidays(
      firstDay,
      lastDay,
      totalDays,
    );
    const essentialTimes = await getEssentialTimes();
    return { firstDay, lastDay, totalDays, totalHolidays, essentialTimes };
  } catch (error) {
    if (error === "") {
      console.error("強制終了しました");
      process.exit(130);
    } else {
      throw error;
    }
  }
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

  return {
    firstDay: parseInputDate(dateAnswer.firstDay),
    lastDay: parseInputDate(dateAnswer.lastDay),
  };
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
  return Number(otherHolidaysAnswer.otherHolidays);
}

async function getEssentialTimes() {
  const essentialTimeQuestions = getEssentialTimeQuestions();
  const essentialTimes = [];
  for (const essentialTimeQuestion of essentialTimeQuestions) {
    const essentialTimeAnswer = await enquirer.prompt({
      type: "input",
      name: essentialTimeQuestion.name,
      message: essentialTimeQuestion.message,
      validate: (input) => validateTime(input, essentialTimes),
    });
    const [hours, minutes] = essentialTimeAnswer[essentialTimeQuestion.name]
      .split(":")
      .map(Number);
    essentialTimes.push(hours * 60 + minutes);
  }
  return essentialTimes;
}

function getEssentialTimeQuestions() {
  return [
    { name: "sleepTime", message: "1日の睡眠時間は?(例: 7:30)" },
    { name: "mealTime", message: "1日の食事時間は?" },
    { name: "workTime", message: "1日の労働・授業時間は?" },
    { name: "commuteTime", message: "1日の往復の通勤・通学時間は?" },
    { name: "houseworkTime", message: "1日の家事の時間は?" },
    { name: "bathTime", message: "1日の風呂、歯磨きの時間は?" },
    { name: "otherTime", message: "その他で1日に必要な時間は?" },
  ];
}

function showFreeTime(caption, freeTime) {
  const freeHours = Math.floor(freeTime / 60);
  const freeMinutes = freeTime % 60;
  console.log(
    `${caption}の自由時間: \x1b[33m${freeHours.toString().padStart(5)}時間${freeMinutes.toString().padStart(2)}分\x1b[0m`,
  );
}

function formatDate(inputDate) {
  const date = new Date(inputDate);

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}年${month}月${day}日`;
}

main();
