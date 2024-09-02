import type { Browser } from "firefox-webext-browser";
import type { Tab } from "firefox-webext-browser/tabs";
import type { _CreateCreateProperties as CreateProps, OnClickData } from "firefox-webext-browser/contextMenus";

type MenuProps = Omit<CreateProps, "id" | "title"> & { title: string };

const openInReaderMode = createMenuItem({
    title: "Open in Reader Mode",
    contexts: ["page"]
});

function createMenuItem(props: MenuProps) {
    type MenuItem = MenuProps & { id: string };

    /** Returns an object with id. Id looks something like this: menu-id:menu-title */
    return { ...props, id: `menu-id:${props.title.replace(/\W+/g, "-").toLowerCase()}` } as MenuItem;
}

function createContextMenu(this: Browser) {
    console.log(`context menu has been created. id: ${openInReaderMode.id}`);

    return this.contextMenus.create(openInReaderMode);
}

function onContextMenuClicked(this: Browser, info: OnClickData, tab: Tab | undefined) {
    if (info.menuItemId !== openInReaderMode.id) return;

    // TODO: add condition to check if content script is already executed or if in reader mode.

    const executing = this.tabs.executeScript({
        file: "lib/content-script.js"
    });
    
    executing.then(onScriptExecuted.bind(this), (reason: unknown) => {
        console.error(`Error executing content script. ${reason}`);
    });
}

function onScriptExecuted(this: Browser, _result: unknown[]) {
    const querying = this.tabs.query({
        active: true,
        currentWindow: true
    });
    
    querying.then(onQueryResult.bind(this), (reason: unknown) => {
        console.error(`Error quering browser tabs. ${reason}`);
    });
}

function onQueryResult(this: Browser, tabs: Tab[]) {
    const sending = this.tabs.sendMessage(tabs[0].id!, {
        textContent: "This text content is from Read Alout Firefox web extension."
    });
    
    const fulfilledCallback = (_value: unknown) => {
        console.log("Message has been sent to content script");
    };
    
    sending.then(fulfilledCallback, (reason: unknown) => {
        console.log(`Error sending message to content script. ${reason}`);
    });
}

export { createContextMenu, onContextMenuClicked };