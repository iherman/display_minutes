import { URL, APIUrl, HTMLUrl, Minutes, DisplayedTOC, FullTOC } from "./common.ts";

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
    const final_data = sorted_data.filter((f: { name: string; }): boolean => {
        return f.name !== "index.html";
    })
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
 * Get back the content from the URL (referring to an HTML file, presumably), 
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
/*                     Handling the TOC content of a single minutes file                    */
/* **************************************************************************************** */

/**
 * Extract the Table of Contents from the content of a minutes file.
 * 
 * @param entry
 * @param content 
 * @returns 
 */
function extractTOC(entry: Minutes, content: string[]): string[] {
    const cleanupToc = (nav: string): string => {
        return nav
            // The TOC title should not be a h2
            .replace("<h2>Contents</h2>", "")
            // The nav id value should be removed
            .replace("<nav id=toc>", "<nav>")
            // References should not be relative
            .replace(/href="#/g, `href="${entry.url}#`)
            ;
        // Remove empty lines from the array
    }

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
            return toc.map(cleanupToc).filter((line: string) => line !== "");
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
async function getAllTOC(data: Minutes[]): Promise<DisplayedTOC[]> {
    const retrieveDisplayTOC = async (entry: Minutes): Promise<DisplayedTOC> => {
        const content = await getContent(entry.url);
        const toc = extractTOC(entry, content);
        return {
            url : entry.url,
            date: entry.date,
            toc: toc,
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
export async function getGroupedTOCs(wg: string): Promise<FullTOC> {
    const groupDisplayedTOCByYear = (data: DisplayedTOC[]): FullTOC => {
        const groups: FullTOC = new Map<number, DisplayedTOC[]>();
        for (const entry of data) {
            const year = entry.date.getFullYear();
            if (!groups.has(year)) {
                groups.set(year, []);
            }
            groups.get(year)?.push(entry);
        }
        return groups;
    }

    const minutes: Minutes[]      = await getMinutes(wg);
    const display: DisplayedTOC[] = await getAllTOC(minutes);
    return groupDisplayedTOCByYear(display);
}
