import type { Browser } from "firefox-webext-browser";
import type { _OnUpdatedChangeInfo, Tab } from "firefox-webext-browser/tabs";
import type { _CreateCreateProperties as CreateProps, OnClickData } from "firefox-webext-browser/contextMenus";

type MenuProps = Omit<CreateProps, "id" | "title"> & { title: string };
type TempInfo = { title?: string; url?: string; favIconUrl?: string; article?: object; };

let tempInfo: { [index: number]: TempInfo } = {};
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
    console.info(`context menu has been created. id: ${openInReaderMode.id}`);

    return this.contextMenus.create(openInReaderMode);
}

async function handleMenuClick(this: Browser, info: OnClickData, tab: Tab | undefined) {
    if (info.menuItemId !== openInReaderMode.id || !tab) return;

    try {
        const { id: tabId, title, url: _url, favIconUrl } = tab;
        const url = _url!.replace(/\/$/g, "");
        const files = ["lib/Readability.js", "lib/content-script.js"];
        
        for (const value of files) {
            await this.tabs.executeScript(tabId!, {
                file: value
            });
        }

        const { article } = await this.tabs.sendMessage(tabId!, {
            command: "article"
        }) as { article: object; };

        if (typeof article != "object") {
            throw new Error("Failed to extract article.");
        }

        tempInfo[tabId!] = { title, url, favIconUrl, article };

        await this.tabs.update(tabId!, {
            url: aboutBlank
        });
    }
    catch (error) {
        if (!(error instanceof Error)) throw error;
        console.error(`Error updating browser tab. ${error.message}`);
    }
}

async function handleTabsUpdate(this: Browser, tabId: number, changeInfo: _OnUpdatedChangeInfo, tab: Tab) {
    if (typeof tempInfo[tabId] != "object" || tab.url !== aboutBlank || changeInfo.status !== "complete") {
        return;
    }

    try {
        await this.tabs.executeScript(tabId, {
            file: "lib/reader-mode.js",
            matchAboutBlank: true,
            runAt: "document_start"
        });

        await handleSendMessage.call(this, tabId);
    }
    catch (error) {
        if (!(error instanceof Error)) throw error;
        console.error(`Error executing content script. ${error.message}`);
    }
    finally {
        delete tempInfo[tabId];
    }
}

async function handleSendMessage(this: Browser, tabId: number) {
    try {
        const response = await this.tabs.sendMessage(tabId, {
            ...tempInfo[tabId]
        });

        if (typeof response != "undefined") {
            console.info("Message has been sent to reader script");
        }
        else {
            console.warn("No response received from reader script");
        }
    }
    catch (error) {
        if (!(error instanceof Error)) throw error;
        console.error(`Error sending message. ${error.message}`);
    }
}

export { handleMenuCreate, handleMenuClick, handleTabsUpdate, aboutBlank };