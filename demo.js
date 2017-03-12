var library = require("module-library")(require)

library.using(
  ["web-host", "an-expression", "./"],
  function(host, anExpression, renderExpression) {

    var func = function() {
      return function(bridge) {
        bridge.send("hello, world")
      }
    }

    host.onSite(function(site) {
      renderExpression.prepareSite(site)
    })

    host.onRequest(function(getBridge) {

      var bridge = getBridge()

      var expression = anExpression.functionLiteral(func)

      var program = anExpression.program()

      renderExpression(bridge, expression, program)
    })

  }
)