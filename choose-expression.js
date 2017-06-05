var library = require("module-library")(require)

module.exports = library.export(
  "choose-expression",
  ["./menu", "an-expression"],
  function(menu, anExpression) {

    var expressionChoices = [

      menu.choice(
        "addHtml",
        anExpression.functionCall({
          functionName: "addHtml",
          arguments: []
        })
      ),

      menu.choice(
        "Number",
        anExpression.numberLiteral(0)
      ),

      menu.choice(
        "bridgeTo.browser",
        anExpression.functionCall({
          functionName: "bridgeTo.browser",
          arguments: [
          ]
        })
      ),

      menu.choice(
        "\"text\"",
        anExpression.stringLiteral("")
      ),

      menu.choice(
        "var something =",
        anExpression.variableAssignment({
          variableName: "something",
          isDeclaration: true,
        })
      ),
    ]

    return function chooseExpression(callback) {
      menu(expressionChoices, callback)
    }
  }
)