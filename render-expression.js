var library = require("module-library")(require)


module.exports = library.export(
  "render-expression",
  ["make-it-editable", "./expression-to-element", "./renderers", "bridge-module", "web-element", "an-expression", "./line-controls", "basic-styles", "./menu", library.ref()],
  function(makeItEditable, expressionToElement, renderers, bridgeModule, element, anExpression, lineControls, basicStyles, menu, lib) {

    function renderExpression(bridge, expressionId, tree) {

      prepareBridge(bridge)

      var el = expressionToElement(bridge, expressionId, tree)

      bridge.asap(
        [bridgeModule(lib, "an-expression", bridge)],
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

      var anExpressionBinding = bridgeModule(lib, "an-expression", bridge)

      bridgeModule(lib, "renderers", bridge)

      var boot = bridge.defineFunction(
        [
        anExpressionBinding,
        bridgeModule(lib, "./line-controls", bridge),
        bridge.asBinding()
        ],
        function bootExpression(anExpression, lineControls, bridge, treeId) {
          var tree = anExpression.getTree(treeId)
          lineControls(tree, bridge)
        }
      )

      bridge.see("render-expression/boot", boot)

      var get = bridge.defineFunction(
        [anExpressionBinding],
        function getExpressionProperty(anExpression, treeId, expressionId, key) {
          var tree = anExpression.getTree(treeId)
          return tree.getAttribute(key, expressionId)
        }
      )

      bridge.see("render-expression/getExpressionProperty", get)

      var set = bridge.defineFunction(
        [anExpressionBinding],
        function setExpressionProperty(anExpression, treeId, expressionId, key, value) {
          var tree = anExpression.getTree(treeId)
          tree.setAttribute(key, expressionId, value)
        }
      )

      bridge.see("render-expression/setExpressionProperty", set)

      bridgeModule(lib, "make-it-editable", bridge)

      makeItEditable.prepareBridge(bridge)

      bridge.see("render-expression", true)
    }

    renderExpression.defineOn = function(bridge) {
      prepareBridge(bridge)

      return bridgeModule(lib, "expression-to-element", bridge)
    }

    return renderExpression
  }
)



