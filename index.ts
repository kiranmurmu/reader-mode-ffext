import process from "node:process";
import path from "node:path";
import fs from "node:fs";
import { displayName, version, description } from "./package.json";
import type { WebExtensionManifest } from "firefox-webext-browser/_manifest";

type Info = { fileType: string; sourceDir: string[]; targetDir: string[]; };
type Data = Pick<Info, "targetDir"> & { fileName: string; sourceFile: string; targetFile: string; };

const currentDir = process.cwd();

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
    const entries = Object.entries<Info>(entry);

    const callback = ([keyName, { fileType, sourceDir, targetDir }]: [string, Info]) => {
        const fileName = `${keyName}.${fileType}`;
        const dataObj: Data = {
            fileName,
            targetDir,
            sourceFile: path.join(currentDir, ...sourceDir, fileName),
            targetFile: path.join(currentDir, ...targetDir, fileName),
        };

        return [keyName, dataObj] as [Key, Data];
    }

    return entries.map(callback);
};

function createDirectory({ targetDir }: Data) {
    let parentDir = currentDir;

    for (const dirName of targetDir) {
        parentDir = path.join(parentDir, dirName);

        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir);

            console.log(`> make directory:\t${path.relative(currentDir, parentDir)}`);
        }
    }
};

const dataMap = new DataMap({
    "manifest": {
        fileType: "json",
        sourceDir: [],
        targetDir: ["build"]
    },
    "background": {
        fileType: "html",
        sourceDir: ["src"],
        targetDir: ["build"]
    },
    "Readability": {
        fileType: "js",
        sourceDir: ["node_modules", "@mozilla", "readability"],
        targetDir: ["build", "lib"]
    }
}).toObject();

const extension: WebExtensionManifest = {
    manifest_version: 2,
    name: displayName,
    version,
    description,
    permissions: [
        "contextMenus",
        "activeTab",
        "tabs"
    ],
    background: {
        "page": dataMap["background"].fileName,
    }
};

(Object.entries(dataMap) as [keyof typeof dataMap, Data][]).forEach(([key, data]) => {
    createDirectory(data);

    if (key === "manifest") {
        fs.writeFile(data.targetFile, JSON.stringify(extension), (error) => {
            if (error) {
                console.error(`> ${error.message}`);
            }
            else {
                console.log(`> write file:\t\t${path.relative(currentDir, data.targetFile)}`);
            }
        });
    }
    else {
        fs.copyFile(data.sourceFile, data.targetFile, (error) => {
            if (error) {
                console.error(`> ${error.message}`);
            }
            else {
                console.log(`> copy file:\t\t${path.relative(currentDir, data.targetFile)}`);
            }
        });
    }
});
