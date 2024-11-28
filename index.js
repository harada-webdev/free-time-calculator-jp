#!/usr/bin/env node

import enquirer from "enquirer";
import { validateDate } from "./validation.js";

async function main() {
  console.log("自由時間計算アプリ");
  const { firstDay, lastDay } = await getFirstAndLastDay();

  console.log(firstDay, lastDay);
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

try {
  await main();
} catch (error) {
  if (error === "") {
    console.error("アプリを終了しました");
    process.exit(130);
  } else {
    throw error;
  }
}
