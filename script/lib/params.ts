/**
 * This file contains the types used for the parameters in the external json files
 * in the script.
 */
// Using node's modules instead of Deno's built in i/o functions
// It makes it easier if someone wants to convert this script in Node.js
import * as fs from 'node:fs/promises';
import process from 'node:process';

const defaultParams: string = "params.json";

/** Type to define task forces */
export interface TaskForces {
    /**
     * The title of the minutes files, depending on the file name. The convention
     * is to have the file name ending with a dash and the identifier of the meeting.
     * The values are the strings to generate the reference to the meeting (the "Meeting" word
     * is added automatically).
     * 
     * The "" and "f2f" values are required.
     */
    [key: string]: string;
};

/** Minimum parameter file */
interface MinimumParams {
    /** Location of the minutes, relative to the location of the script itself */
    directory: string;
    /** Location of the minutes, relative to the final place of the generated HTML files */
    location: string;
    /** Location of the template file for the index, relative to the location of the script itself */
    index_template: string;
    /** ID of the slot in the index template where the data should be inserted */
    index_template_id: string;
    /** Location of the template file for the resolution file, relative to the location of the script itself */
    resolution_template: string;
    /** ID of the slot in the resolution template where the data should be inserted */
    resolution_template_id: string;
    /** The task force data */
    taskForces: TaskForces;
}

/** Just to make type future proof if we need to add more parameters */
export type Params = MinimumParams & { [key: string]: string; };

/**
 * 
 * Function to get the parameters for the script. The sources for the parameters are:
 * 
 * 1. The first argument of the script or, if not provided
 * 2. The environment variable DM_PARAMS or
 * 3. The default file name `params.json`
 * 
 * @returns The parameters for the script
 * @throws If the file does not exist or is not valid JSON
 */
export async function getParams(): Promise<Params> {
    const fname = ((): string => {
        // Check if the user has provided a file name
        if (process.argv.length > 2) {
            // If the user has provided a file name, use it
            return process.argv[2];
        } else if (process.env.DM_PARAMS) {
            // If the user has provided a file name in the environment variable, use it
            return process.env.DM_PARAMS;
        } else {
            // Otherwise, use the default file name
            return defaultParams;
        }
    })();

    console.log('Using params file:', fname);
    // Check if the file exists
    try {
        await fs.access(fname);
    } catch (_err) {
        throw new Error(`The file ${fname} does not exist. Please provide a valid file name as the argument or set the DM_PARAMS environment variable.`);
    }

    const content = await fs.readFile(fname, 'utf-8');
    const params = JSON.parse(content);
    return params;
}
