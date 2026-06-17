const bugfixGrammar = {
  origin: [
    "#errorType#: #errorMessage#\n    at #func# (#path#:#line#:#col#)\n    at #func2# (#path2#:#line2#:#col2#)\n [BUGFIXER] Attaching to process (port 9229)...\n [BUGFIXER] Variable state at breakpoint L#line#:\n    #var1# = #val1#\n    #var2# = #val2#\n [FIXED] #fixMsg#",
    "#errorType#: #errorMessage#\n    at #path#:#line#:#col#\n [FIXED] #fixMsg#"
  ],
  errorType: ["TypeError", "ReferenceError", "SyntaxError", "UnhandledPromiseRejectionWarning", "MongoNetworkError"],
  errorMessage: [
    "Cannot read property '#prop#' of undefined",
    "#prop# is not a function",
    "#var1# is not defined",
    "Unexpected token < in JSON at position 0",
    "pool is draining and cannot accept work"
  ],
  prop: ["price", "id", "map", "reduce", "length", "split", "config"],
  func: ["calculateTotal", "processOrder", "validateCart", "fetchData", "app.get"],
  func2: ["Module._compile", "Object.apply", "processTicksAndRejections", "runMicrotasks"],
  path: ["/src/cart.js", "/src/routes/checkout.js", "/lib/utils.js", "/app/models/user.js"],
  path2: ["internal/modules/cjs/loader.js", "internal/process/task_queues.js", "/src/server.js"],
  line: ["14", "84", "12", "102", "55", "8", "32"],
  col: ["32", "18", "5", "12", "9", "2"],
  line2: ["10", "42", "118", "99"],
  col2: ["1", "5", "14"],
  var1: ["item", "req.body", "user", "config", "db"],
  var2: ["product", "res", "session", "stripe_key"],
  val1: ["{ id: 104, qty: 2 }", "undefined", "null", "''", "[Object]"],
  val2: ["undefined (Stripe query failed)", "{}", "'secret'", "null"],
  fixMsg: [
    "Added fallbacks for empty catalog queries.",
    "Imported database helper namespace.",
    "Wrapped API call in try/catch block.",
    "Fixed typo in variable declaration.",
    "Checked for null before accessing properties.",
    "Updated package-lock dependencies."
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = bugfixGrammar;
} else {
  window.bugfixGrammar = bugfixGrammar;
}
