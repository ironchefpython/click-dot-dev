const codeGrammar = {
  origin: [
    "#imports#\n\n#classDef#",
    "#imports#\n\n#functionDef#",
    "#imports#\n\n#apiEndpoint#"
  ],
  imports: [
    "const #module# = require('#moduleName#');\nconst #module2# = require('#moduleName2#');",
    "import { #func# } from '#moduleName#';",
    "const express = require('express');\nconst app = express();"
  ],
  module: ["fs", "path", "axios", "lodash", "crypto", "utils"],
  module2: ["logger", "config", "database", "cache", "metrics", "stripe"],
  moduleName: ["fs", "path", "axios", "lodash", "crypto", "./utils"],
  moduleName2: ["./logger", "./config", "./database", "./cache", "./metrics", "stripe"],
  func: ["map", "reduce", "filter", "connect", "query", "hash"],

  classDef: [
    "class #className# extends #parentClass# {\n  constructor(#args#) {\n    super(#args#);\n    this.#prop# = #initialValue#;\n  }\n\n  #methodName#(#args#) {\n    #methodBody#\n  }\n}"
  ],
  className: ["UserController", "PaymentService", "DataProcessor", "CacheManager", "InventoryModel"],
  parentClass: ["BaseController", "EventEmitter", "Model", "Service"],
  args: ["data", "options", "req, res, next", "id", "payload", "config"],
  prop: ["state", "db", "logger", "config", "status", "cache"],
  initialValue: ["{}", "null", "false", "[]", "new Map()"],
  methodName: ["initialize", "process", "fetchData", "update", "delete", "handleWebhook"],
  methodBody: [
    "try {\n      const result = await this.#methodCall#;\n      return result;\n    } catch (e) {\n      this.logger.error(e);\n      throw e;\n    }",
    "if (!#args#) return null;\n    return Object.keys(#args#).map(k => #args#[k]);",
    "return new Promise((resolve) => {\n      setTimeout(() => resolve(#initialValue#), 100);\n    });"
  ],
  methodCall: ["db.query('SELECT * FROM users')", "cache.get(id)", "stripe.charges.create(payload)"],

  functionDef: [
    "/**\n * #comment#\n */\nconst #funcName# = async (#args#) => {\n  #funcBody#\n};"
  ],
  comment: ["Processes the incoming request", "Calculates total cart value", "Validates user permissions", "Fetches configuration from DB"],
  funcName: ["calculateTotal", "validateSession", "fetchConfig", "processOrder", "sendEmail"],
  funcBody: [
    "const user = await getUser(#args#);\n  if (!user.active) throw new Error('User inactive');\n  return user.profile;",
    "let total = 0;\n  for (const item of #args#) {\n    total += item.price * item.quantity;\n  }\n  return total;",
    "return Object.assign({}, config, #args#);"
  ],

  apiEndpoint: [
    "app.#httpMethod#('/api/#resource#', async (req, res) => {\n  #apiBody#\n});"
  ],
  httpMethod: ["get", "post", "put", "delete"],
  resource: ["users", "products", "orders", "checkout", "inventory"],
  apiBody: [
    "try {\n    const data = await db.query('SELECT * FROM #resource#');\n    res.json({ success: true, data });\n  } catch (err) {\n    res.status(500).json({ error: err.message });\n  }",
    "const { id } = req.body;\n  if (!id) return res.status(400).send('Missing ID');\n  res.send({ status: 'ok' });"
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = codeGrammar;
} else {
  window.codeGrammar = codeGrammar;
}
