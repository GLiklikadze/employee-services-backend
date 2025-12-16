import { JSONFilePreset } from "lowdb/node";

const db = await JSONFilePreset("./employee-data.json", { users: [] });

export default db;
