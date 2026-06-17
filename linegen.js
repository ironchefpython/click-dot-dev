function createLineGenerator(grammar, selectFn) {
  let buffer = [];
  const select = selectFn || ((len) => Math.floor(Math.random() * len));

  function resolve(tag) {
    if (!grammar[tag]) return tag; // If tag doesn't exist in grammar, leave it as is or return empty

    const choices = grammar[tag];
    if (!choices || choices.length === 0) return "";

    const choice = choices[select(choices.length)];

    // Recursively replace #tag#
    return choice.replace(/#([a-zA-Z0-9_]+)#/g, (match, innerTag) => {
      return resolve(innerTag);
    });
  }

  return function() {
    if (buffer.length === 0) {
      const generated = resolve('origin');
      buffer = generated.split('\n');
    }
    return buffer.shift() || "";
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = createLineGenerator;
} else {
  window.createLineGenerator = createLineGenerator;
}
