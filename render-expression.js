var library = require("module-library")(require)


module.exports = library.export(
  "render-expression",
  ["make-it-editable", "./expression-to-element", "./renderers", "bridge-module", "web-element", "an-expression", "./line-controls"],
  function(makeItEditable, expressionToElement, renderers, bridgeModule, element, anExpression, lineControls) {

    function renderExpression(bridge, expression, tree) {

      prepareBridge(bridge)

      var el = expressionToElement(expression, tree, bridge)

      bridge.domReady(
        bridge.remember("render-expression/loadTree").withArgs(tree.data())
      )

      bridge.send(el)
    }

    renderExpression.prepareSite = function(site) {

      site.addRoute(
        "get",
        "/render-module/styles.css",
        site.sendFile(__dirname, "styles.css")
      )

    }

    function prepareBridge(bridge) {

      if (bridge.remember("render-expression")) { return }

      renderers.defineOn(bridge)

      lineControls.defineOn(bridge)

      var anExpressionBinding = bridgeModule(library, "an-expression", bridge)

      bridgeModule(library, "renderers", bridge)

      var loadTree = bridge.defineFunction(
        [anExpressionBinding, bridgeModule(library, "./line-controls", bridge)],
        function loadExpressionTree(anExpression, lineControls, data) {
          var tree = anExpression.tree(data)
          console.log("booted tree "+tree.id)
          lineControls(tree)
        }
      )

      bridge.see("render-expression/loadTree", loadTree)

      var get = bridge.defineFunction(
        [anExpressionBinding],
        function getExpressionProperty(anExpression, treeId, expressionId, key) {
          var tree = anExpression.getTree(treeId)
          return tree.getProperty(key, expressionId)
        }
      )

      bridge.see("render-expression/getExpressionProperty", get)

      var set = bridge.defineFunction(
        [anExpressionBinding],
        function setExpressionProperty(anExpression, treeId, expressionId, key, value) {
          var tree = anExpression.getTree(treeId)
          tree.setProperty(key, expressionId, value)
        }
      )

      bridge.see("render-expression/setExpressionProperty", set)

      bridgeModule(library, "make-it-editable", bridge)

      makeItEditable.prepareBridge(bridge)

      bridge.see("render-expression", true)
    }

    return renderExpression
  }
)



