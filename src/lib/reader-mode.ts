import Default = require("firefox-webext-browser");
import Runtime = require("firefox-webext-browser/runtime");

declare var chrome: Default.Browser;
declare var browser: Default.Browser;

(function () {
    type MessageData = { title?: string; url?: string; favIconUrl?: string; article?: Article };
    type ResponseCallback = (response: unknown) => void;
    type Article = {
        title: string;
        content: string;
        textContent: string;
        length: number;
        excerpt: string;
        byline: string;
        dir: string;
        siteName: string;
        lang: string;
        publishedTime: string;
    } | null;

    if (typeof browser == "undefined") {
        globalThis.browser = chrome;
    }

    function handleMessageEvent(message: MessageData, _sender: Runtime.MessageSender, sendResponse: ResponseCallback) {
        location.hash = `!${message.url}`;

        document.title = message.title!;
        document.body.textContent = "";
        
        if (message.favIconUrl) {
            const favIconUrl = document.createElement("link");
            favIconUrl.rel = "shortcut icon";
            favIconUrl.href = message.favIconUrl;
            document.head.appendChild(favIconUrl);
        }

        const { content, title } = message.article!;

        const htmlHeadingElement = document.createElement("h1");
        htmlHeadingElement.textContent = title;
        document.body.appendChild(htmlHeadingElement);
        
        const htmlDivElement = document.createElement("div");
        htmlDivElement.innerHTML = content;
        document.body.appendChild(htmlDivElement.firstChild!);

        console.info(`reader mode: ${message.url}`);

        sendResponse(true);
    }

    browser.runtime.onMessage.addListener(handleMessageEvent);
})();