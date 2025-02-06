import { GroupedData }    from "./lib/common.ts";
import { getGroupedData } from "./lib/tools.ts";
import pretty             from "npm:pretty";
import { JSDOM }          from 'npm:jsdom';


const wg = "pm-wg";

function tocHTML(data: GroupedData): string {
    let htmlString = '<ul>';
    for (const [year, datum] of data) {
        htmlString += `<li><h2>Minutes in ${year}</h2>`;
        htmlString += `<details><summary>List of Meetings</summary>`;
        htmlString += `<ul>`;

        for (const entry of datum) {
            htmlString += `<li><h3><a target="_blank" href="${entry.url}">${entry.date.toDateString()}</a></h3>`;
            htmlString += "<details><summary>Agenda</summary>"
            htmlString += entry.toc.join('\n');
            htmlString += "</details>";
            if (entry.res.length > 0) {
                htmlString += "<details><summary>Resolutions</summary>";
                htmlString += entry.res.join('\n');
                htmlString += "</details>";
            }
            htmlString += '</li>';
        }
        htmlString += '</ul>';
        htmlString += '</details>';
        htmlString += '</li>';
    }
    htmlString += '</ul>';

    return pretty(htmlString);
}

function resolutionHTML(data: GroupedData): string {
    let htmlString = '<ul>';
    for(const [year, datum] of data) {
        htmlString += `<li><h2>Resolutions in ${year}</h2>`;
        htmlString += `<ul>`;
        for (const entry of datum) {
            const date = entry.date.toDateString();
            for (const res of entry.res) {
                htmlString += res.replace('</li>', ` (${date})</li>`);
            }
        }
        htmlString += '</ul>';
        htmlString += '</li>';
    }
    htmlString += '</ul>';

    return pretty(htmlString);
}

async function generateIndex(data: GroupedData): Promise<void> {
    // get hold of the template file as a JSDOM
    const template = await Deno.readTextFile("./templates/index_template.html");
    // parse template into a DOM using JSDOM
    const document = new JSDOM(template).window.document;

    // Get hold of the TOC entries
    const tocHTMLString = tocHTML(data);

    // Find the right slot for the TOC
    const tocSlot = document.getElementById("list-of-calls");
    tocSlot.innerHTML = tocHTMLString;

    // Additional, minor thing: set the copyright statement to the right year
    document.getElementById('year').innerHTML = (new Date()).toISOString().split('-')[0];

    // That is it: serialize the DOM back to a string
    const newIndex = pretty(document.documentElement.outerHTML);

    // Write the new index.html file
    await Deno.writeTextFile("index.html", newIndex);
}

async function generateResolutions(data: GroupedData): Promise<void> {
    // get hold of the template file as a JSDOM
    const template = await Deno.readTextFile("./templates/resolutions_template.html");
    // parse template into a DOM using JSDOM
    const document = new JSDOM(template).window.document;

    // Get hold of the TOC entries
    const resHTMLString = resolutionHTML(data);

    // Find the right slot for the TOC
    const resSlot = document.getElementById("list-of-resolutions");
    resSlot.innerHTML = resHTMLString;

    // Additional, minor thing: set the copyright statement to the right year
    document.getElementById('year').innerHTML = (new Date()).toISOString().split('-')[0];

    // That is it: serialize the DOM back to a string
    const newRes = pretty(document.documentElement.outerHTML);

    // Write the new index.html file
    await Deno.writeTextFile("resolutions.html", newRes);
}

async function main() {
    // Get hold of the data to work on
    const data: GroupedData = await getGroupedData(wg);
    await Promise.all([generateIndex(data), generateResolutions(data)]);
}

await main();
