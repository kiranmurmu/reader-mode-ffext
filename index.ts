import process from "node:process";
import path from "node:path";
import fs from "node:fs";
import { name, version, description } from "./package.json";
import type { WebExtensionManifest } from "firefox-webext-browser/_manifest";

type Info = { type: string; dir: string[]; out: string[]; };
type Data = Info & { name: string; path: string; source: string; target: string; };

class DataMap<Key extends string> extends Map<Key, Data> {
    constructor(entries: { [_ in Key]: Info }) {
        super(toMapEntry<Key>(entries));
    }
    
    toObject() {
        type DataObj = { [_ in Key]: Data; };
        return Object.fromEntries(this.entries()) as Readonly<DataObj>;
    };
}

function toMapEntry<Key>(entry: { [_: string]: Info; }) {
    const value = Object.entries<Info>(entry);
    const cwdir = process.cwd();
    
    const callback = ([key, data]: [string, Info]) => {
        const name = `${key}.${data.type}`;

        const info: Omit<Data, keyof Info> = {
            name: name,
            path: path.join(cwdir, ...data.out),
            source: path.join(cwdir, ...data.dir, name),
            target: path.join(cwdir, ...data.out, name),
        };

        return [key, { ...data, ...info }] as [Key, Data];
    }

    return value.map(callback);
};

const dataMap = new DataMap({
    "manifest": {
        type: "json",
        dir: [],
        out: ["build"]
    },
    "background": {
        type: "html",
        dir: ["src"],
        out: ["build"]
    }
}).toObject();

const { background, manifest } = dataMap;

const extension: WebExtensionManifest = {
    manifest_version: 2,
    name,
    version,
    description,
    permissions: [
        "contextMenus"
    ],
    background: {
        "page": background.name,
    }
};

Object.values(dataMap).forEach((data) => {
    if (!fs.existsSync(data.path)) {
        fs.mkdirSync(data.path);
    };
});

fs.writeFile(manifest.target, JSON.stringify(extension), (error) => {
    if (error) {
        console.error(`  ${error.message}`);
    } else {
        console.log(`  file created: ${manifest.target}`);
    }
});

fs.copyFile(background.source, background.target, (error) => {
    if (error) {
        console.error(`  ${error.message}`);
    } else {
        console.log(`  file copied: ${background.target}`);
    }
});
