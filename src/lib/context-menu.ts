import type { Browser } from "firefox-webext-browser";
import type { Tab } from "firefox-webext-browser/tabs";
import type { _CreateCreateProperties as CreateProps, OnClickData } from "firefox-webext-browser/contextMenus";

type MenuProps = Omit<CreateProps, "id" | "title"> & { title: string };

const menuItem = createMenuItem({
    title: "Open in Reader Mode",
    contexts: ["link", "page"],
    documentUrlPatterns: ["*://*/*"]
});

function createMenuItem(props: MenuProps) {
    type MenuItem = MenuProps & { id: string };

    /** Returns an object with id. Id looks something like this: menu-id:menu-title */
    return { ...props, id: `menu-id:${props.title.replace(/\W+/g, "-").toLowerCase()}` } as MenuItem;
}

function createContextMenu(this: Browser) {
    console.log(`context menu has been created. id: ${menuItem.id}`);

    return this.contextMenus.create(menuItem);
}

function onContextMenuClicked(this: Browser, info: OnClickData, tab: Tab | undefined) {
    if (info.menuItemId !== menuItem.id || !tab) return;

    if (tab.id) {
        this.tabs.update(tab.id, {
            url: "about:blank",
        });
        console.log(`updating tab: ${tab.id}`);
    }
}

export { createContextMenu, onContextMenuClicked };