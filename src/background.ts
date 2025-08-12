import type { Browser } from "firefox-webext-browser";
import type { _OnInstalledDetails } from "firefox-webext-browser/runtime";
import {
    handleMenuCreate, handleMenuClick, handleTabsUpdate,
    handleTabRemove, handleTabNavigate, aboutBlank
} from "./lib/context-menu.js";
import type { _OnUpdatedChangeInfo } from "firefox-webext-browser/tabs";
import type { _OnBeforeRequestDetails } from "firefox-webext-browser/webRequest";

declare var chrome: Browser;
declare var browser: Browser;

if (typeof browser == "undefined") {
    globalThis.browser = chrome;
}

browser.runtime.onInstalled.addListener(handleMenuCreate.bind(browser));
browser.runtime.onStartup.addListener(handleMenuCreate.bind(browser));
browser.contextMenus.onClicked.addListener(handleMenuClick.bind(browser));

browser.tabs.onUpdated.addListener(handleTabsUpdate.bind(browser), {
    properties: ["status"],
    urls: [aboutBlank]
});

browser.tabs.onRemoved.addListener(handleTabRemove.bind(browser));
browser.webNavigation.onBeforeNavigate.addListener(handleTabNavigate.bind(browser));