import Default = require("firefox-webext-browser");
import Runtime = require("firefox-webext-browser/runtime");

declare var chrome: Default.Browser;
declare var browser: Default.Browser;

(function () {
    type MessageData = { textContent: string };
    type ResponseCallback = (response: unknown) => void;

    if (typeof browser == "undefined") {
        globalThis.browser = chrome;
    }

    function handleMessageEvent(message: MessageData, _sender: Runtime.MessageSender, _sendResponse?: ResponseCallback) {
        document.body.textContent = "";

        let header = document.createElement("h1");
        header.textContent = message.textContent;
        document.body.appendChild(header);
        
        // TODO: update about:page url using `window.history`
    }

    browser.runtime.onMessage.addListener(handleMessageEvent);
})();