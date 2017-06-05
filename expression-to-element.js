var library = require("module-library")(require)

module.exports = library.export(
  "expression-to-element",
  function() {

    function expressionToElement(bridge, expressionId, tree, options) {

      if (!options) { options = {} }

      var kind = tree.getAttribute("kind", expressionId)

      var moduleName = "render-"+kind.replace(" ", "-")

      var render = library.get(moduleName)

      if (typeof render != "function") {
        throw new Error("No renderer for "+kind)
      }

      if (!tree) {throw new Error()}
      var el = render(expressionId, tree, bridge, options)

      if (el.id && el.id != expressionId) {
        console.log("expression:", expressionId)
        console.log("element:", el)
        throw new Error("Expression element ids must match the expression id")
      }

      el.id = expressionId

      // if (tree.getRole(expressionId) == "function literal line") {
      //   el.addSelector(".function-literal-line")
      // }

      return el
    }

    function stringify(thing) {
      if (typeof thing == "function") {
        return thing.toString()
      } else {
        return JSON.stringify(thing)
      }
    }

    return expressionToElement
  }
)