import { gen_index } from "./lib/gen_index.ts";
import { handle_nicknames } from "./lib/nicknames.ts";

console.log("Generating index and resolution files");
await gen_index();

console.log("Replacing nicknames by full names");
await handle_nicknames();
