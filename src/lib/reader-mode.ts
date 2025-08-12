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
    article?: Article;
}

type MessageSender = Runtime.MessageSender;
type ResponseCallback = (response: unknown) => void;

(function () {
    if (typeof browser == "undefined") {
        globalThis.browser = chrome;
    }

    function handleMessageEvent(message: MessageData, _sender: MessageSender, sendResponse: ResponseCallback) {
        const { title, url, favIconUrl, article } = message;
        const { parentNode } = document.documentElement;

        const documentElement = document.implementation.createHTMLDocument(title);
        const documentType = document.implementation.createDocumentType("html", "", "");
        const favIcon = document.createElement("link");
        const heading = document.createElement("h1");
        const container = document.createElement("div");

        location.hash = `reader-mode?url=${url}`;

        try {
            favIcon.rel = "shortcut icon";
            favIcon.href = favIconUrl!;
            documentElement.head.appendChild(favIcon);

            heading.id = "readability-title";
            heading.textContent = article!.title;
            container.innerHTML = article!.content;
            container.className = "readability-container";
            container.insertBefore(heading, container.firstChild);

            documentElement.body.appendChild(container);
            documentElement.documentElement.setAttribute("lang", "en-US");

            parentNode!.insertBefore(documentType, document.documentElement);
            parentNode!.replaceChild(documentElement.documentElement, document.documentElement);
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