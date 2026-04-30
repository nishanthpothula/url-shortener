const { nanoid } = require('nanoid');

// 7-char codes: 64^7 = ~4.4 trillion possibilities
function generateCode() {
  return nanoid(7);
}

module.exports = { generateCode };
