var library = require("module-library")(require)


module.exports = library.export(
  "draw-expression",
  ["make-it-editable", "./expression-to-element", "./program", "./renderers", "bridge-module"],
  function(makeItEditable, expressionToElement, Program, renderers, bridgeModule) {

    function drawExpression(expression, bridge) {

      bridgeModule(library, "renderers", bridge)

      makeItEditable.prepareBridge(bridge)

      program = new Program()

      var el = expressionToElement(expression, program)

      program.element = el

      return program
    }

    return drawExpression

  }
)



