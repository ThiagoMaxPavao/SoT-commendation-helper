window.sanitizeName = function(name) {
  return name.replace(/[().,!?"'\u2018\u2019\u201A\u201B\u2032\u2035]/g, "").trim();
};
