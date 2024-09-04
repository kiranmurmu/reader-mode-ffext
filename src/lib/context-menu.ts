import type { Browser } from "firefox-webext-browser";
import type { _OnUpdatedChangeInfo, Tab } from "firefox-webext-browser/tabs";
import type { _CreateCreateProperties as CreateProps, OnClickData } from "firefox-webext-browser/contextMenus";

type MenuProps = Omit<CreateProps, "id" | "title"> & { title: string };

let updateId: number | undefined;
const aboutBlank = "about:blank";

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

    // TODO: add condition to check if content script is already executed or if in reader mode.
    
    const updating = this.tabs.update(tab.id!, {
        url: aboutBlank
    });
    
    updating.then((tab: Tab) => void (updateId = tab.id), (reason: unknown) => {
        console.error(`Error updating browser tab. ${reason}`);
    });
}

function handleTabsUpdate(this: Browser, tabId: number, changeInfo: _OnUpdatedChangeInfo, tab: Tab) {
    if (tabId !== updateId || tab.url !== aboutBlank || changeInfo.status !== "complete") return;

    console.log(`${tab.url} page is updated!`);
    console.log(changeInfo);
    console.log(tab);
    
    const executing = this.tabs.executeScript(tabId, {
        file: "lib/content-script.js",
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
        textContent: "This text content is from Reader Mode extension for Firefox."
    });
    
    const fulfilledCallback = (_value: unknown) => {
        console.log("Message has been sent to content script");
    };
    
    sending.then(fulfilledCallback, (reason: unknown) => {
        console.log(`Error sending message to content script. ${reason}`);
    });
}

export { handleMenuCreate, handleMenuClick, handleTabsUpdate };