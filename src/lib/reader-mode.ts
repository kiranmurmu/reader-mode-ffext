import Default = require("firefox-webext-browser");
import Runtime = require("firefox-webext-browser/runtime");

declare var chrome: Default.Browser;
declare var browser: Default.Browser;

(function () {
    type MessageData = { text?: string; url?: string; title?: string; favIconUrl?: string; };
    type ResponseCallback = (response: unknown) => void;

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

        const header = document.createElement("h1");
        header.textContent = message.text!;
        document.body.appendChild(header);
        
        console.log(`reader mode: ${message.url}`);

        sendResponse(true);
    }

    browser.runtime.onMessage.addListener(handleMessageEvent);
})();