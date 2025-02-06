import { URL, APIUrl, HTMLUrl, Minutes, DisplayedData, GroupedData, ignoredFiles } from "./common.ts";

/**
 * Get the URLs of all the minutes for a given WG.
 * 
 * (This is a github specific version for the PM WG. The goal is to be able, in time, to 
 * exchange that against the W3C specific API.)
 * 
 * @param wg
 * @returns 
 */
async function getMinutes(wg: string): Promise<Minutes[]> {
    const apiUrl = APIUrl.replace("{wg}", wg);

    const ghResponse = await fetch(apiUrl);
    if (!ghResponse.ok) {
        console.error(`Error: ${ghResponse.statusText} (${ghResponse.status}) for "${apiUrl}"`);
        return [];
    }   

    const response = (await ghResponse.json()) as any[];
    
    const sorted_data = response.sort((a: { name: string; }, b: { name: string; }) => {
        if (a.name > b.name) return -1;
        if (a.name < b.name) return 1;
        else return 0;
    });

    // remove the index file, if it is there:
    const final_data = sorted_data.filter((f: { name: string; }): boolean => !ignoredFiles.includes(f.name));

    // deno-lint-ignore no-explicit-any
    const links = final_data.map((entry: any): Minutes => {
        // The current setup is such that the date is part of the filename.
        const date = entry.name.split(".")[0];
        return {
            fname : entry.name,
            url   : HTMLUrl.replace("{wg}", wg).replace("{path}", entry.path),
            date  : new Date(date),
        };
    });

    return links as Minutes[];
}

/**
 * Get back the content from a URL (referring to an HTML file, presumably), 
 * as an array of strings.
 *
 * @param url 
 * @returns 
 */
async function getContent(url: URL): Promise<string[]> {
    const response = await (await fetch(url)).text();
    const content = response.split("\n");
    return content;
}

/* **************************************************************************************** */
/*                     Handling the Data content of a single minutes file                    */
/* **************************************************************************************** */

function cleanupDataFunc(entry: Minutes): (content: string) => string {
    const cleanupData = (nav: string): string => {
        return nav
            // The TOC title should not be a h2
            .replace("<h2>Contents</h2>", "")
            // The TOC title should not be a h2
            .replace("<h2>Summary of resolutions</h2>", "")
            // The nav id value should be removed
            .replace("<nav id=toc>", "<nav>")
            // References should not be relative
            .replace(/href="#/g, `href="${entry.url}#`)
            ;
    };
    return cleanupData;
}

/**
 * Extract the Table of Contents from the content of a minutes file.
 * 
 * @param entry
 * @param content 
 * @returns 
 */
function extractTOC(entry: Minutes, content: string[]): string[] {
    const nav_begin_i: number = content.indexOf("<nav id=toc>");

    if (nav_begin_i === -1) {
        // console.log(">>> no nav");
        return [];
    } else {
        const nav_begin = content.slice(nav_begin_i);
        const nav_end_i = nav_begin.indexOf("</nav>");
        if (nav_end_i === -1) {
            // console.log(">>> wrong nav");
            return [];
        } else {
            const toc = nav_begin.slice(0, nav_end_i + 1);
            return toc.map(cleanupDataFunc(entry)).filter((line: string) => line !== "");
        }
    }
}

function extractResolutions(entry: Minutes, content: string[]): string[] {
    const res_begin_i: number = content.indexOf("<div id=ResolutionSummary>");
    if (res_begin_i === -1) {
        return [];
    } else {
        const res_begin = content.slice(res_begin_i);
        const res_end_i = res_begin.indexOf("</div>");
        if (res_end_i === -1) {
            return [];
        } else {
            // Note that the minute HTML begins with the
            // lines "<div id=ResolutionSummary"> and is followed by an "<h2>"
            // These are removed, as well as the closing "</div>".
            const output = res_begin.slice(1, res_end_i);
            return output.map(cleanupDataFunc(entry)).filter((line: string) => line !== "");
        }
    }
}

/**
 * Get all TOCs with the respective date; it is one block that can 
 * be displayed in the generated HTML
 * 
 * @param data 
 * @returns 
 */
// deno-lint-ignore require-await
async function getAllTOC(data: Minutes[]): Promise<DisplayedData[]> {
    const retrieveDisplayTOC = async (entry: Minutes): Promise<DisplayedData> => {
        const content = await getContent(entry.url);
        return {
            url : entry.url,
            date: entry.date,
            toc: extractTOC(entry, content),
            res: extractResolutions(entry, content),
        };
    }

    // Gather all the Promises for a parallel execution
    const promises = data.map(retrieveDisplayTOC);
    return Promise.all(promises);
}


/**
 * Main entry point to get the TOCs grouped by year. The TOCs themselves are arrays of strings, in HTML format.
 * 
 * @param wg 
 * @returns 
 */
export async function getGroupedData(wg: string): Promise<GroupedData> {
    const groupDisplayedDataByYear = (data: DisplayedData[]): GroupedData => {
        const groups: GroupedData = new Map<number, DisplayedData[]>();
        for (const entry of data) {
            const year = entry.date.getFullYear();
            if (!groups.has(year)) {
                groups.set(year, []);
            }
            groups.get(year)?.push(entry);
        }
        return groups;
    }

    const minutes: Minutes[]       = await getMinutes(wg);
    const display: DisplayedData[] = await getAllTOC(minutes);
    return groupDisplayedDataByYear(display);
}
