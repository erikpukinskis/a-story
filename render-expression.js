var library = require("module-library")(require)


module.exports = library.export(
  "render-expression",
  ["make-it-editable", "./expression-to-element", "./renderers", "bridge-module", "web-element", "an-expression", "./line-controls", "basic-styles", "./menu"],
  function(makeItEditable, expressionToElement, renderers, bridgeModule, element, anExpression, lineControls, basicStyles, menu) {

    function renderExpression(bridge, expression, tree) {

      prepareBridge(bridge)

      var el = expressionToElement(expression, tree, bridge)

      bridge.asap(
        [bridgeModule(library, "an-expression", bridge)],
        tree.builder()
      )

      bridge.domReady(
        bridge.remember("render-expression/boot").withArgs(tree.id)
      )

      bridge.send(el)
    }

    function prepareBridge(bridge) {

      if (bridge.remember("render-expression")) { return }

      basicStyles.addTo(bridge)
      renderers.defineOn(bridge)
      lineControls.defineOn(bridge)
      menu.prepareBridge(bridge)

      var anExpressionBinding = bridgeModule(library, "an-expression", bridge)

      bridgeModule(library, "renderers", bridge)

      var boot = bridge.defineFunction(
        [anExpressionBinding, bridgeModule(library, "./line-controls", bridge)],
        function bootExpression(anExpression, lineControls, treeId) {
          var tree = anExpression.getTree(treeId)
          lineControls(tree)
        }
      )

      bridge.see("render-expression/boot", boot)

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



