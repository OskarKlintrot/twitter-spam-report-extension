const callback = details => {
    chrome.tabs.sendMessage(details.tabId, {addButton: true}, (response) => {
        console.log(response);
    })
}
const filter = {
    urls: [
        '*://twitter.com/followers',
        '*://twitter.com/followers/*',
        '*://twitter.com/*/followers',
        '*://twitter.com/*/followers/*'
    ]
}

chrome.webRequest.onCompleted.addListener(callback, filter)