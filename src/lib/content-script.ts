import Mozilla = require("@mozilla/readability");
import Default = require("firefox-webext-browser");
import Runtime = require("firefox-webext-browser/runtime");

type Readability = Mozilla.Readability<string>;

interface ReadabilityConstructor extends Readability {
    new(document: Document | Node): Readability;
}

declare var chrome: Default.Browser;
declare var browser: Default.Browser;
declare var Readability: ReadabilityConstructor;

type MessageSender = Runtime.MessageSender;
type ResponseCallback = (response: unknown) => void;
type MessageData = { command: "extract"; };

(function() {
    if (typeof browser == "undefined") {
        globalThis.browser = chrome;
    }

    if (typeof Readability == "undefined") return;

    function getArticle() {
        return new Readability(document.cloneNode(true)).parse();
    }

    function handleMessageEvent(message: MessageData, _sender: MessageSender, sendResponse: ResponseCallback) {
        if (message.command === "extract") {
            const article = getArticle();

            sendResponse(article);
        }
    }

    browser.runtime.onMessage.addListener(handleMessageEvent);
})();