import { FullTOC }        from "./lib/common.ts";
import { getGroupedTOCs } from "./lib/tools.ts";
import pretty             from "npm:pretty";
import { JSDOM }          from 'npm:jsdom';


const wg = "pm-wg";

async function tocHTML(wg: string): Promise<string> {
    const tocs: FullTOC = await getGroupedTOCs(wg);

    let htmlString = '<ul>';
    for (const [year, toc] of tocs) {
        htmlString += `<li><h2>Minutes in ${year}</h2>`;
        htmlString += `<ul>`;

        for (const entry of toc) {
            htmlString += `<li><h3><a href="${entry.url}">${entry.date.toDateString()}</a></h3>`;
            htmlString += "<details><summary>Agenda</summary>"
            htmlString += entry.toc.join('\n');
            htmlString += "</details>";
            htmlString += '</li>';
        }
        htmlString += '</ul>';
        htmlString += '</li>';

    }
    htmlString += '</ul>';

    // return pretty(htmlString);
    return pretty(htmlString);
}

async function main() {
    // get hold of the template file as a JSDOM
    const template = await Deno.readTextFile("./index_template.html");
    // parse template into a DOM using JSDOM
    const document = new JSDOM(template).window.document;

    // Get hold of the TOC entries
    const tocHTMLString = await tocHTML(wg);

    // Find the right slot for the TOC
    const tocSlot = document.getElementById("list-of-calls");
    tocSlot.innerHTML = tocHTMLString;

    // Additional, minor thing: set the copyright statement to the right year
    document.getElementById('year').innerHTML = (new Date()).toISOString().split('-')[0];

    // That is it: serialize the DOM back to a string
    const newIndex = pretty(document.documentElement.outerHTML);

    // Write the new index.html file
    await Deno.writeTextFile("../minutes/index.html", newIndex);

}

await main();
