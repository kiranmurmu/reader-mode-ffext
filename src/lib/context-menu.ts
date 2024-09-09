import type { Browser } from "firefox-webext-browser";
import type { _OnUpdatedChangeInfo, Tab } from "firefox-webext-browser/tabs";
import type { _CreateCreateProperties as CreateProps, OnClickData } from "firefox-webext-browser/contextMenus";

type MenuProps = Omit<CreateProps, "id" | "title"> & { title: string };
type UpdateInfo = { id?: number; title?: string; url?: string; favIconUrl?: string; };

let updateInfo: UpdateInfo = {};
const aboutBlank = "about:blank";

// TODO: add readability feature

const openInReaderMode = createMenuItem({
    title: "Open in Reader Mode",
    contexts: ["page"],
    documentUrlPatterns: ["*://*/*"]
});

function createMenuItem(props: MenuProps) {
    type MenuItem = MenuProps & { id: string };

    return { ...props, id: `menu-id:${props.title.replace(/\W+/g, "-").toLowerCase()}` } as MenuItem;
}

function handleMenuCreate(this: Browser) {
    console.log(`context menu has been created. id: ${openInReaderMode.id}`);

    return this.contextMenus.create(openInReaderMode);
}

async function handleMenuClick(this: Browser, info: OnClickData, tab: Tab | undefined) {
    if (info.menuItemId !== openInReaderMode.id || !tab) return;

    try {
        updateInfo = {
            id: tab.id,
            title: tab.title,
            url: tab.url!.replace(/\/$/g, ""),
            favIconUrl: tab.favIconUrl
        };

        await this.tabs.update(tab.id!, {
            url: aboutBlank
        });
    }
    catch (error) {
        console.error(`Error updating browser tab. ${error}`);
    }
}

async function handleTabsUpdate(this: Browser, tabId: number, changeInfo: _OnUpdatedChangeInfo, tab: Tab) {
    if (tabId !== updateInfo["id"] || tab.url !== aboutBlank || changeInfo.status !== "complete") {
        return;
    }
    
    try {
        const executionResult = await this.tabs.executeScript(tabId, {
            file: "lib/reader-mode.js",
            matchAboutBlank: true,
            runAt: "document_start"
        });

        handleScriptExecute.call(this, executionResult);
    }
    catch (error) {
        console.error(`Error executing content script. ${error}`);
    }
    finally {
        delete updateInfo["id"];
    }
}

async function handleScriptExecute(this: Browser, _result: unknown[]) {
    try {
        const queryResult = await this.tabs.query({
            active: true,
            currentWindow: true
        });

        handleTabsQuery.call(this, queryResult);
    }
    catch (error) {
        console.error(`Error quering browser tabs. ${error}`);
    }
}

async function handleTabsQuery(this: Browser, tabs: Tab[]) {
    try {
        const messageResult = await this.tabs.sendMessage(tabs[0].id!, {
            ...updateInfo,
            text: "This text content is from Reader Mode extension for Firefox."
        });

        if (typeof messageResult != "undefined") {
            console.log("Message has been sent to content script");
        }
        else {
            console.warn("Could not send message to content script");
        }
    }
    catch (error) {
        console.error(`Error sending message to content script. ${error}`);
    }
}

export { handleMenuCreate, handleMenuClick, handleTabsUpdate, aboutBlank };