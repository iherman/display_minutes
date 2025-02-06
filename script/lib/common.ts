
export const APIUrl: string = "https://api.github.com/repos/w3c/{wg}/contents/minutes";
export const HTMLUrl: string   = "https://w3c.github.io/{wg}/{path}";

export type URL = string;

export interface Minutes {
    fname : string;
    url   : URL;
    date  : Date;
}

export interface DisplayedData {
    url  : URL;
    date : Date;
    toc  : string[];
    res  : string[];
}

export type GroupedData = Map<number, DisplayedData[]>;

export const ignoredFiles: string[] = ["index.html","resolutions.html"];
