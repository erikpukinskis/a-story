var library = require("nrtv-library")(require)

module.exports = library.export(
  "an-expression",
  function() {
    // HELPERS

    function pad(str) {
      var lines = str.split("\n")
      return lines.map(function(line) {
        return "  "+line
      }).join("\n")
    }


    var lastExpressionInteger = typeof window == "undefined" ? 1000*1000 : 1000

    function anExpression(json) {
      if (!json) { return }

      if (!json.id) {
        json.id = anId()
      }

      if (json.arguments) {
        json.arguments.forEach(anExpression)
      } else if (json.body) {
        json.body.forEach(anExpression)
      } else if (json.expression) {
        anExpression(json.expression)
      }

      return json
    }

    function anId() {
      lastExpressionInteger++
      return "expr-"+lastExpressionInteger.toString(36)
    }

    anExpression.id = anId

    anExpression.stringLiteral =
      function(string) {
        return {
          kind: "string literal",
          string: string,
          id: anId()
        }
      }

    anExpression.numberLiteral =
      function(number) {
        return {
          kind: "number literal",
          number: number,
          id: anId()
        }
      }

    anExpression.emptyExpression =
      function() {
        return {
          kind: "empty expression",
          id: anId()
        }
      }

    anExpression.objectLiteral =
      function(object) {
        var expression = {
          kind: "object literal",
          valuesByKey: {},
          id: anId()
        }

        for (var key in object) {
          expression.valuesByKey[key] = toExpression(object[key])
        }

        return expression
      }

    anExpression.arrayLiteral =
      function(array) {
        return {
          kind: "array literal",
          items: array.map(toExpression),
          id: anId()
        }
      }

    function toExpression(stuff) {
      if (typeof stuff == "string") {
        return anExpression.stringLiteral(stuff)
      } else if (typeof stuff == "number") {
        return anExpression.numberLiteral(stuff)
      } else if (Array.isArray(stuff)) {
        return anExpression.arrayLiteral(stuff)
      } else if (typeof stuff == "object") {
        return anExpression.objectLiteral(stuff)
      }
    }


    // CODE GENERATORS

    var codeGenerators = {
      "function call": function(expression) {
        var args = expression.arguments.map(
          expressionToJavascript
        ).join(",\n")
        return expression.functionName+"(\n"+pad(args)+"\n)"
      },
      "array literal": function(expression) {
        var items = expression.items.map(
          expressionToJavascript
        )
        return "[\n"+pad(items.join(",\n"))+"\n]"
      },
      "function literal": function(expression) {
        var names = expression.argumentNames.join(", ")
        var lines = expression.body.map(
          expressionToJavascript
        )
        var code = "function("
          +names
          +") {\n"
          +pad(lines.join("\n"))
          +"\n}"

        return code
      },
      "string literal": function(expression) {
        return JSON.stringify(expression.string)
      },
      "number literal": function(expression) {
        return expression.number.toString()
      },
      "empty expression": function() {
        return "null"
      },
      "variable assignment": function(expression) {
        return "var "
          +expression.variableName
          +" = "
          +expressionToJavascript(expression.expression)
      },
      "variable reference": function(expression) {
        return expression.variableName
      },
      "object literal": function(expression) {
        var keyPairs = []

        for(var key in expression.valuesByKey) {
          keyPairs.push(
            "  "
            +JSON.stringify(key)
            +": "
            +expressionToJavascript(expression.valuesByKey[key])
          )
        }
        return "{\n"+keyPairs.join(",\n")+"\n}"
      }
    }

    anExpression.kinds = Object.keys(codeGenerators)


    // RUN

    anExpression.run =
      function(expression, fileName) {
    
        var js = expressionToJavascript(expression)

        js = js + "\n//# sourceURL="+fileName+".js"

        eval(js)
      }

    function expressionToJavascript(expression) {

      var kind = expression.kind
      var makeCode = codeGenerators[kind]

      if (typeof makeCode != "function") {
        throw new Error("No code generator called "+kind)
      }

      return makeCode(expression)
    }

    return anExpression
  }
)
