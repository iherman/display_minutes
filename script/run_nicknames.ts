/**
 * Replace irc nicknames with real names (if available) in W3C minutes
 * 
 */

import { handle_nicknames } from "./lib/nicknames.ts";
await handle_nicknames();
