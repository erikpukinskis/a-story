var library = require("module-library")(require)


module.exports = library.export(
  "render-expression",
  ["make-it-editable", "./expression-to-element", "./renderers", "bridge-module", "web-element", "an-expression"],
  function(makeItEditable, expressionToElement, renderers, bridgeModule, element, anExpression) {

    function renderExpression(bridge, expression, tree) {

      if (!bridge.remember("render-expression")) {

        renderers(bridge)

        var anExpressionBinding = bridgeModule(library, "an-expression", bridge)

        var get = bridge.defineFunction(
          [anExpressionBinding],
          function getExpressionProperty(anExpression, treeId, expressionId, key) {
            var tree = anExpression.getTree(treeId)
            return tree.getProperty(key, expressionId)
          }
        )

        var set = bridge.defineFunction(
          [anExpressionBinding],
          function setExpressionProperty(anExpression, treeId, expressionId, key, value) {
            var tree = anExpression.getTree(treeId)
            tree.setProperty(key, expressionId, value)
          }
        )

        bridge.see("render-expression/getExpressionProperty", get)

        bridge.see("render-expression/setExpressionProperty", set)

        bridgeModule(library, "make-it-editable", bridge)

        makeItEditable.prepareBridge(bridge)
      }

      var el = expressionToElement(expression, tree, bridge)

      bridge.send(el)
    }

    renderExpression.prepareSite = function(site) {

      site.addRoute(
        "get",
        "/render-module/styles.css",
        site.sendFile(__dirname, "styles.css")
      )

    }

    return renderExpression
  }
)



