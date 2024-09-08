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
    const article = new Readability(document.cloneNode(true)).parse();

    browser.runtime.sendMessage({ article });
    
    function getArticle(): Article {
        return new Readability(document.cloneNode(true)).parse();
    }

    function handleMessageEvent(message: MessageData, _sender: Runtime.MessageSender, _sendResponse?: ResponseCallback) {
        switch (message.command) {
            case "article":
                browser.runtime.sendMessage({ article }).then(
                    (value: unknown) => {},
                    (reason: unknown) => {}
                );
                break;
            default:
                break;
        }
    }

    browser.runtime.onMessage.addListener(handleMessageEvent);
})();