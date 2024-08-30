import type { _OnInstalledDetails } from "firefox-webext-browser/runtime";
import type { Browser } from "firefox-webext-browser";
import { createContextMenu, onContextMenuClicked } from "./lib/context-menu.js";

const browser: Browser = globalThis.browser;

/** WebExtention Events */
browser.runtime.onInstalled.addListener(createContextMenu.bind(browser));
browser.runtime.onStartup.addListener(createContextMenu.bind(browser));

/** ContextMenu Event */
browser.contextMenus.onClicked.addListener(onContextMenuClicked.bind(browser));