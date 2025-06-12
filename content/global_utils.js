window.sanitizeName = function(name) {
  return name.replace(/[().,!?"'\u2018\u2019\u201A\u201B\u2032\u2035]/g, "").trim();
};

window.logger = {
  log: (...args) => console.log("[Commendation Helper Extension]", ...args),
  warn: (...args) => console.warn("[Commendation Helper Extension]", ...args),
  error: (...args) => console.error("[Commendation Helper Extension]", ...args),
};
