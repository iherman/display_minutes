import { getGroupedData, GroupedData } from "./lib/tools.ts";
import { MiniDOM }                     from './lib/minidom.ts';
import pretty                          from "npm:pretty";
// Using the node:fs/promises module instead of Deno's built in i/o functions
// if someone wants to run this script in a Node.js environment
import * as fs                         from 'node:fs/promises';

// Adapt it to your need: the working group repository name
const wg = "pm-wg";

/**
 * Generate the TOC HTML content.
 * 
 * @param document 
 * @param parent 
 * @param data 
 */
function tocHTML(document: MiniDOM, parent: Element, data: GroupedData): void {
    const ul = document.addChild(parent, 'ul');
    let open_details = true
    for (const [year, datum] of data) {
        const li_year = document.addChild(ul, 'li');
        document.addChild(li_year, 'h2', `Minutes in ${year}`);
        const details_year = document.addChild(li_year, 'details');
        if (open_details) {
            // This trick makes the minutes of the current year initially visible, the rest hidden
            open_details = false;
            details_year.setAttribute('open', 'true');
        }
        document.addChild(details_year, 'summary', 'List of Meetings');
        const ul_meetings = document.addChild(details_year, 'ul');

        for (const entry of datum) {
            const li_meeting = document.addChild(ul_meetings, 'li');
            document.addChild(li_meeting, 'h3', `<a target="_blank" href="${entry.url}">${entry.date.toDateString()}</a>`);
            const details_meeting = document.addChild(li_meeting, 'details');
            document.addChild(details_meeting, 'summary', 'Agenda');
            const ul_toc = document.addChild(details_meeting, 'ul');
            for (const em of entry.toc) {
                document.addChild(ul_toc, 'li', em)
            }
        }
    }
}

/**
 * Generate the resolutions HTML content.
 * 
 * @param document 
 * @param parent 
 * @param data 
 */
function resolutionHTML(document: MiniDOM, parent: Element, data: GroupedData): void {
    const ul = document.addChild(parent, 'ul');
    for (const [year, datum] of data) {
        const li_year = document.addChild(ul, 'li');
        document.addChild(li_year, 'h2', `Resolutions in ${year}`);
        const ul_resolutions = document.addChild(li_year, 'ul');
        for (const entry of datum) {
            const date = entry.date.toDateString();
            for (const res of entry.res) {
                document.addChild(ul_resolutions, 'li',  `${res} (${date})`);
            }
        }
    }
}

/**
 * Generic wrapper function to generate content from a template.
 * 
 * @param data - The data to be inserted into the template
 * @param template_file - The template file name
 * @param id - The id of the slot in the template where the data should be inserted
 * @param output_file - Output file name
 * @param func - The content generation function
 */
async function generateContent(
        data: GroupedData, 
        template_file: string, 
        id: string, 
        output_file: string, 
        func: (document: MiniDOM, parent: Element, data: GroupedData) => void): Promise<void> {
    // get hold of the template file as a JSDOM
    const template = await fs.readFile(template_file, 'utf-8');

    // parse template into a DOM using JSDOM
    const document = new MiniDOM(template);

    const slot = document.getElementById(id);

    if (!slot) {
        throw new Error(`Could not find the right slot ${id} in the template`);
    }

    func(document, slot, data);

    // Additional, minor thing: set the copyright statement to the right year
    const cc = document.getElementById('year');
    if (cc) {
        cc.innerHTML = (new Date()).toISOString().split('-')[0];
    }

    // That is it: serialize the DOM back to a string
    const newRes = pretty(document.serialize());

    // Write the new index.html file
    await fs.writeFile(output_file, newRes);
}


/**
 * Main entry point to generate the HTML files.
 */
async function main() {
    // Get hold of the data to work on
    const data: GroupedData = await getGroupedData(wg);

    // Get the data into the HTML templates and write the files
    // The functions are async, so we need to wait for all of them to finish
    // hence this extra step with an array or promises
    const promises: Promise<void>[] = 
        [
            {
                template : "./templates/index_template.html", 
                id       : "list-of-calls", 
                output   : "index.html", 
                func     : tocHTML
            },
            {
                template : "./templates/resolutions_template.html", 
                id       : "list-of-resolutions", 
                output   : "resolutions.html", 
                func     : resolutionHTML
            },
        ]
        .map((entry) => generateContent(data, entry.template, entry.id, entry.output, entry.func));
    await Promise.allSettled(promises);
}

await main();
