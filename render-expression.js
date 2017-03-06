var library = require("module-library")(require)


module.exports = library.export(
  "render-expression",
  ["make-it-editable", "./expression-to-element", "./renderers", "bridge-module"],
  function(makeItEditable, expressionToElement, Program, renderers, bridgeModule) {

    function renderExpression(program, expression, bridge) {

      bridgeModule(library, "renderers", bridge)

      makeItEditable.prepareBridge(bridge)

      var el = expressionToElement(expression, program)

      program.element = el

      return program
    }

    return renderExpression
  }
)



