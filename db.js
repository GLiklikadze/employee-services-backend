// import { JSONFilePreset } from "lowdb/node";

// const db = await JSONFilePreset("./employee-data.json", { users: [] });

// export default db;
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const adapter = new JSONFile("db.json"); // relative to project root
const db = new Low(adapter);
await db.read();
db.data ||= { users: [] }; // fallback if empty

export default db;
