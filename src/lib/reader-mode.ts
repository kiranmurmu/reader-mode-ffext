import Default = require("firefox-webext-browser");
import Runtime = require("firefox-webext-browser/runtime");

declare var chrome: Default.Browser;
declare var browser: Default.Browser;

interface Article {
    title: string;
    content: string;
    textcontent: string;
    length: number;
    excerpt: string;
    byline: string;
    dir: string;
    sitename: string;
    lang: string;
    publishedtime: string;
}

interface MessageData {
    title?: string;
    url?: string;
    favIconUrl?: string;
    article?: Article | null;
}

type MessageSender = Runtime.MessageSender;
type ResponseCallback = (response: unknown) => void;

(function () {
    if (typeof browser == "undefined") {
        globalThis.browser = chrome;
    }

    function handleMessageEvent(message: MessageData, _sender: MessageSender, sendResponse: ResponseCallback) {
        location.hash = `!${message.url}`;
        document.title = message.title!;
        document.body.textContent = "";

        try {
            if (message.favIconUrl) {
                const favIconUrl = document.createElement("link");
                favIconUrl.rel = "shortcut icon";
                favIconUrl.href = message.favIconUrl;
                document.head.appendChild(favIconUrl);
            }

            const { content, title } = message.article!;
            const htmlHeadingElement = document.createElement("h1");
            const htmlDivElement = document.createElement("div");

            htmlHeadingElement.textContent = title;
            document.body.appendChild(htmlHeadingElement);

            htmlDivElement.innerHTML = content;
            document.body.appendChild(htmlDivElement.firstChild!);
        }
        catch (error) {
            if (error instanceof Error) {
                sendResponse(error.message);
            }
            else {
                sendResponse(error);
            }
        }
    }

    browser.runtime.onMessage.addListener(handleMessageEvent);
})();