import Mozilla = require("@mozilla/readability");
import Default = require("firefox-webext-browser");
import Runtime = require("firefox-webext-browser/runtime");

declare var chrome: Default.Browser;
declare var browser: Default.Browser;

declare var Readability: Mozilla.Readability<string> & {
    new(document: Document | Node): Mozilla.Readability<string>;
};

(function() {
    type ResponseCallback = (response: unknown) => void;
    type MessageData = {
        command: "article";
    };
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

    if (typeof Readability == "undefined") return;

    function getArticle(): Article {
        return new Readability(document.cloneNode(true)).parse();
    }

    function handleMessageEvent(message: MessageData, _sender: Runtime.MessageSender, sendResponse: ResponseCallback) {
        if (message.command == "article") {
            sendResponse({
                article: getArticle()
            });
        }
    }

    browser.runtime.onMessage.addListener(handleMessageEvent);
})();