import { db } from "../context";
import * as schema from "./schema";

await db.insert(schema.categoryTable).values([
  {
    path: "/home/terrason/.cache"
  },
  {
    path: "/home/terrason/.config/"
  },
  {
    path: "/home/terrason/.local/share/"
  },
  {
    path: "/home/terrason/.local/state/"
  },
  {
    path: "/home/terrason/.local"
  },
  {
    path: "/home/terrason/"
  },
  {
    path: "/usr/local"
  },
  {
    path: "/usr/"
  },
  {
    path: "/var/"
  },
  {
    path: "/opt/"
  },
]);

console.log(`Seeding complete.`);