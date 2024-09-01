import type { Browser } from "firefox-webext-browser";
import type { _OnInstalledDetails } from "firefox-webext-browser/runtime";
import { createContextMenu, onContextMenuClicked } from "./lib/context-menu.js";

declare var chrome: Browser;
declare var browser: Browser;

/** if browser not found then use chrome */
if (typeof browser == "undefined") {
    globalThis.browser = chrome;
}

/** WebExtention Events */
browser.runtime.onInstalled.addListener(createContextMenu.bind(browser));
browser.runtime.onStartup.addListener(createContextMenu.bind(browser));

/** ContextMenu Event */
browser.contextMenus.onClicked.addListener(onContextMenuClicked.bind(browser));