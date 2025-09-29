/**
 * This script generates the index.html and resolutions.html files from the data
 * in the directory specified in the params.json file.
 * It uses the template files in the templates directory and fills them with the data
 * from the data directory.
 * The script uses the MiniDOM library to parse and manipulate the HTML files.
 * The script is written in TypeScript and uses Deno to run.
 * The script is designed to be run from the command line and takes the directory
 * as an argument. If no directory is specified, it uses the default directory
 * specified in the params.json file.  
 */

import { gen_index } from "./lib/gen_index.ts";
await gen_index();
