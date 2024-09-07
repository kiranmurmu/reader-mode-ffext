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

function handleMenuClick(this: Browser, info: OnClickData, tab: Tab | undefined) {
    if (info.menuItemId !== openInReaderMode.id || !tab) return;

    updateInfo = {
        id: tab.id,
        title: tab.title,
        url: tab.url!.replace(/\/$/g, ""),
        favIconUrl: tab.favIconUrl
    };

    const updating = this.tabs.update(tab.id!, {
        url: aboutBlank
    });
    
    updating.catch((reason: unknown) => {
        console.error(`Error updating browser tab. ${reason}`);
    });
}

function handleTabsUpdate(this: Browser, tabId: number, changeInfo: _OnUpdatedChangeInfo, tab: Tab) {
    if (tabId !== updateInfo["id"] || tab.url !== aboutBlank || changeInfo.status !== "complete") {
        return;
    }
    
    delete updateInfo["id"];

    const executing = this.tabs.executeScript(tabId, {
        file: "lib/reader-mode.js",
        matchAboutBlank: true,
        runAt: "document_start"
    });

    executing.then(handleScriptExecute.bind(this), (reason: unknown) => {
        console.error(`Error executing content script. ${reason}`);
    });
}

function handleScriptExecute(this: Browser, _result: unknown[]) {
    const querying = this.tabs.query({
        active: true,
        currentWindow: true
    });
    
    querying.then(handleTabsQuery.bind(this), (reason: unknown) => {
        console.error(`Error quering browser tabs. ${reason}`);
    });
}

function handleTabsQuery(this: Browser, tabs: Tab[]) {
    const sending = this.tabs.sendMessage(tabs[0].id!, {
        ...updateInfo,
        text: "This text content is from Reader Mode extension for Firefox."
    });
    
    const fulfilledCallback = (_value: unknown) => {
        console.log("Message has been sent to content script");
    };
    
    sending.then(fulfilledCallback, (reason: unknown) => {
        console.error(`Error sending message to content script. ${reason}`);
    });
}

export { handleMenuCreate, handleMenuClick, handleTabsUpdate, aboutBlank };