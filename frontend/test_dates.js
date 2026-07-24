const m = "2026-06";
const [y, mm] = m.split('-');
const s = new Date(+y, +mm-1, 1);
const e = new Date(+y, +mm, 0); e.setHours(23,59,59,999);

console.log("Start:", s.toISOString());
console.log("End:", e.toISOString());
