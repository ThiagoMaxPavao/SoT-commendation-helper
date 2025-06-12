// Inject the script into the page context to capture the reputation data
const script = document.createElement('script');
script.src = chrome.runtime.getURL('intercept_reputation.js');
script.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);
