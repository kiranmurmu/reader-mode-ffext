import type { Browser } from "firefox-webext-browser";
import type { _OnUpdatedChangeInfo as ChangeInfo, _OnRemovedRemoveInfo as RemoveInfo, Tab } from "firefox-webext-browser/tabs";
import type { _CreateCreateProperties as CreateProps, OnClickData } from "firefox-webext-browser/contextMenus";
import type { _OnBeforeNavigateDetails as NavigateDetails } from "firefox-webext-browser/webNavigation";
import type { InjectDetails } from "firefox-webext-browser/extensionTypes";

interface MenuProps extends Omit<CreateProps, "id" | "title"> {
    title: string;
};

interface MenuItem extends MenuProps {
    id: string;
}

interface ReaderData {
    title?: string;
    url?: string;
    favIconUrl?: string;
    article?: object;
}

const current: Record<number, ReaderData> = {};
const aboutBlank = "about:blank";
const aboutReader = `${aboutBlank}#reader-mode`;

const toggleReaderMode = createMenuItem({
    title: "Toggle Reader Mode",
    contexts: ["page"],
});

function createMenuItem(props: MenuProps) {
    const menuId = `menu-id:${props.title.replace(/\W+/g, "-").toLowerCase()}`;

    return { ...props, id: menuId } as MenuItem;
}

function handleMenuCreate(this: Browser) {
    console.info(`Context Menu created: ${toggleReaderMode.id}`);
    this.contextMenus.create(toggleReaderMode);
}

async function executeScript(this: Browser, tabId: number, details: InjectDetails) {
    const { file } = details;

    try {
        await this.tabs.executeScript(tabId, details);
    } catch (error) {
        const isErrorInstance = error instanceof Error;

        if (isErrorInstance && "fileName" in error && error.fileName === "undefined") {
            throw new Error(`Unable to inject script '${file}'`);
        }

        throw error;
    }
}

async function sendMessage(this: Browser, tabId: number, message: unknown) {
    try {
        return await this.tabs.sendMessage(tabId, message);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error("Unable to send message");
        }

        throw error;
    }
}

async function openAboutBlank(this: Browser, tabId: number) {
    try {
        await this.tabs.update(tabId, {
            url: aboutBlank
        });
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Unable to open ${aboutBlank}`);
        }

        throw error;
    }
}

async function handleMenuClick(this: Browser, info: OnClickData, tab: Tab | undefined) {
    if (info.menuItemId !== toggleReaderMode.id || !tab) {
        return;
    }

    const { id: tabId, title, url: _url, favIconUrl } = tab;
    const url = _url!.replace(/\/$/g, "");
    const scripts = ["lib/Readability.js", "lib/content-script.js"];

    if (url.startsWith(aboutReader)) {
        this.tabs.goBack(tabId);
        return;
    }

    try {
        for (const script of scripts) {
            await executeScript.call(this, tabId!, {
                file: script
            });
        }

        const article = await sendMessage.call(this, tabId!, { command: "extract" });

        if (typeof article == "undefined") {
            throw new Error("Failed to extract article");
        }

        current[tabId!] = { title, url, favIconUrl, article };
        await openAboutBlank.call(this, tabId!);
    }
    catch (error) {
        const message: string = "Error updating browser tab.";

        if (error instanceof Error) {
            console.error(message, error.message);
        }
        else {
            console.error(message, error);
        }
    }
}

async function handleTabNavigate(this: Browser, details: NavigateDetails) {
    const isAboutReader = details.url.startsWith(aboutReader);

    if (isAboutReader) {
        await this.tabs.update({
            url: aboutBlank,
            loadReplace: true,
        });
        console.info("Reader Mode replaced:", details.tabId);
    }
}

async function handleTabRemove(this: Browser, tabId: number, _removeInfo: RemoveInfo) {
    if (typeof current[tabId] != "undefined") {
        delete current[tabId];
        console.info("Reader Mode cleared:", tabId);
    }
}

async function handleTabsUpdate(this: Browser, tabId: number, changeInfo: ChangeInfo, tab: Tab) {
    const isNotAboutBlank = tab.url !== aboutBlank;
    const isNotComplete = changeInfo.status !== "complete";
    const hasDifferentId = typeof current[tabId] != "object";

    if (hasDifferentId || isNotAboutBlank || isNotComplete) {
        return;
    }

    try {
        await executeScript.call(this, tabId, {
            file: "lib/reader-mode.js",
            matchAboutBlank: true,
            runAt: "document_start"
        });

        const response: Error | undefined = await sendMessage.call(this, tabId, {
            ...current[tabId]
        });

        if (typeof response != "undefined") {
            throw response;
        }

        console.info(`Reader Mode opened: ${current[tabId].url}`);
    }
    catch (error) {
        const message: string = "Error opening reader mode.";

        if (error instanceof Error) {
            console.error(message, error.message);
        }
        else {
            console.error(message, error);
        }
    }
}

export { handleMenuCreate, handleMenuClick, handleTabsUpdate, handleTabRemove, handleTabNavigate, aboutBlank };