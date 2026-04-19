const issuedWarnings = new Set();

function warnOnce(key, message, error) {
  if (issuedWarnings.has(key)) {
    return;
  }

  issuedWarnings.add(key);
  if (error) {
    console.warn(message, error.message || error);
    return;
  }

  console.warn(message);
}

module.exports = {
  warnOnce,
};

