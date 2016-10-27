var library = require("nrtv-library")(require)

require("./renderers")
require("./actions")

var rendererModules = library.using(
  ["./an-expression"],
  function(anExpression) {

    function toModuleName(kind) {
      return "render-"+kind.replace(" ", "-")
    }

    return anExpression.kinds.map(toModuleName)
  }
)


library.define(
  "expression-to-element",
  ["stringify-expression"],
  function(stringify) {

    var expressionIdWritePosition = 0

    function expressionToElement(expression, program) {

      var i = expressionIdWritePosition
      expressionIdWritePosition++

      if (typeof expression != "object" || !expression || !expression.kind) {
        throw new Error("Trying to turn "+stringify(expression)+" into an element, but it doesn't look like an expression")
      }

      var kind = expression.kind

      var moduleName = "render-"+kind.replace(" ", "-")

      var render = library.get(moduleName)

      if (typeof render != "function") {
        throw new Error("No renderer for "+kind)
      }

      if (!program) {throw new Error()}
      var el = render(expression, program)

      if (el.id && el.id != expression.id) {
        console.log("expression:", expression)
        console.log("element:", el)
        throw new Error("Expression element ids must match the expression id")
      }

      el.id = expression.id

      program.addExpressionAt(expression, i)

      return el
    }

    return expressionToElement
  }
)


library.define(
  "stringify-expression",
  function() {

    function stringify(thing) {
      if (typeof thing == "function") {
        return thing.toString()
      } else {
        return JSON.stringify(thing)
      }
    }

    return stringify
  }
)

    
module.exports = library.export(
  "draw-expression",
  ["make-it-editable", "expression-to-element", "./program"],
  function(makeItEditable, expressionToElement, Program) {

    function drawExpression(expression, bridge) {

      makeItEditable.prepareBridge(bridge)

      program = new Program()

      var el = expressionToElement(expression, program)

      program.element = el

      return program
    }

    return drawExpression

  }
)



