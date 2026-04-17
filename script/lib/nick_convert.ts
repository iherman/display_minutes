import type { Nicknames } from "./data.ts";

/**
 * The structure of a user's information in the nickname file in
 * a more user-friendly fashion.
 *
 * The term names tells it all although, in practice, the optional values
 * are hardly ever used.
 */
export interface UserNick {
    readonly nick: string[];
    readonly name: string;
    github?:       string;
    role?:         string;
}

/**
 * Convert the more complex, but user friendly collection of user nick data
 * to a simple set of key value pairs, to make this more machine friendly...
 *
 * @param input
 * @returns
 */
export function convert(input: UserNick[]): Nicknames {
    try {
        const output: Nicknames = {};
        for (const record of input) {
            const name: string = record.name;
            for (const nc_case of record.nick) {
                const nc = nc_case.toLowerCase();
                if (!(nc in output)) {
                    output[nc] = name;
                }
            }
        }
        return output;
    } catch(e) {
        console.error(`Something is wrong with the nickname conversion ${e}`);
        return {};
    }
 }
