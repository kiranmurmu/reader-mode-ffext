import process from "node:process";
import path from "node:path";
import fs from "node:fs";
import { name, version, description } from "./package.json";
import type { WebExtensionManifest } from "firefox-webext-browser/_manifest";

const manifest: WebExtensionManifest = {
    manifest_version: 2,
    name,
    version,
    description,
    permissions: [
        "contextMenus"
    ],
    background: {
        persistent: false,
        type: "module",
        scripts: [
            "background.js"
        ]
    }
};

const dataBuffer = JSON.stringify(manifest);
const buildPath = path.join(process.cwd(), "build");

if (!fs.existsSync(buildPath)) {
    fs.mkdirSync(buildPath);
}

fs.writeFileSync(path.join(buildPath, "manifest.json"), dataBuffer);
