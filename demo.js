var library = require("module-library")(require)

library.using(
  ["web-host", "an-expression", "./", "javascript-to-ezjs"],
  function(host, anExpression, renderExpression, javascriptToEzjs) {

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

      var functionLiteral = javascriptToEzjs(func.toString())

      var tree = anExpression()

      renderExpression(bridge, functionLiteral, tree)
    })

  }
)

