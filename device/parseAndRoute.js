inlets = 1;
outlets = 1;

function msg_int() { /* ignore */ }
function msg_float() { /* ignore */ }

function msg_symbol(s) {
  try {
    const obj = JSON.parse(s);
    if (obj.landmarks) {
      // flatten floats into a Max list
      outlet(0, "landmarks", ...obj.landmarks);
    }
  } catch(e) {
    post("parse error:", e);
  }
}

// ensure bang, list, anything are covered too:
function anything() {
  const a = arrayfromargs(messagename, arguments);
  // ignore everything except msg_symbol above
}
