import Default = require("firefox-webext-browser");
import Runtime = require("firefox-webext-browser/runtime");

declare var chrome: Default.Browser;
declare var browser: Default.Browser;

(function () {
    /** if browser not found then use chrome */
    if (typeof browser == "undefined") {
        globalThis.browser = chrome;
    }

    type RequestData = { textContent: string };
    type ResponseCallback = (response: unknown) => void;

    function replaceBodyContent(message: RequestData, _sender: Runtime.MessageSender, _sendResponse?: ResponseCallback) {
        document.body.textContent = "";

        let header = document.createElement("h1");
        header.textContent = message.textContent;
        document.body.appendChild(header);
    }

    browser.runtime.onMessage.addListener(replaceBodyContent);
})();