// Purpose: Intercept XMLHttpRequest to capture reputation data from the game API and send it to the content script.

const originalOpen = XMLHttpRequest.prototype.open;
const originalSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url) {
  this._url = url;
  return originalOpen.apply(this, arguments);
};

XMLHttpRequest.prototype.send = function() {
  if (this._url && this._url.includes('/api/profilev2/reputation')) {
    this.addEventListener('load', function() {
      try {
        const responseText = this.responseText;
        const json = JSON.parse(responseText);
        window.postMessage({
            source: "commendation-helper-extension",
            type: "REPUTATION_JSON",
            data: json
        }, "*");
        console.log("[Commendation Helper Extension] Reputation JSON sent to content.");
      } catch (err) {
        console.error("[Commendation Helper Extension] Failed to parse reputation response:", err);
      }
    });
  }
  return originalSend.apply(this, arguments);
};
