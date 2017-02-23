var library = require("module-library")(require)

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
      if (!json) { throw new Error("what are you trying to make an expression of?") }

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

    anExpression.fromFunction = function(func) {
      var lines = func.toString().split("\n")

      var body = []

      for(var i=1; i<lines.length-1; i++) {

        var expression = sourceToExpression(lines[i])

        if (expression) {
          body.push(expression)
        }
      }

      var stack = []
      var top

      var functionLiteral = {
        kind: "function literal",
        argumentNames: argumentNames(lines[0]),
        body: body,
      }

      return anExpression(functionLiteral)
    }

    function sourceToExpression(source) {

      var returnStatement = source.match(/^ *return (.*)/)

      var functionStart = !returnStatement && source.match(/^ *function ?[^(]*[(]([^)]*)[)]/)

      var assignment = !functionStart && source.match(/^ *(var)? ?([^=]+) ?= ?(.*)/)

      var object = !assignment && source.match(/^ *{.*} *$/)

      var functionCall = !object && source.match(/^ *([^( ]+)[(](.*)[)] *$/)

      var variable = !functionCall && source.match(/^ *([^(){}.+-]+) *$/)

      var string = !variable && source.match(/^ *"(.*)" *$/)

      var isClosingBracket = !string && !!source.match(/^ *} *$/)

      var isWhitespace = !isClosingBracket && !!source.match(/^ *$/)

      if (isClosingBracket || isWhitespace) {
        return
      } else if (returnStatement) {
        var rhs = returnStatement[1]

        var expression = {
          kind: "return",
          expression: sourceToExpression(rhs),
        }

        return expression
      } else if (functionStart) {

        var args = functionStart[1].split(/, */)

        var expression = {
          kind: "function literal",
          argumentNames: args,
          body: []
        }

        return expression

      } else if (assignment) {

        var name = assignment[2].trim()

        if (!name) { throw new Error("no name on line: "+source) }

        var rhs = assignment[3].trim()

        if (!rhs) {
          throw new Error("not assigning anything to "+JSON.stringify(expression, null, 2))
        }

        var expression = {
          kind: "variable assignment",
          isDeclaration: !!assignment[1],
          variableName: name,
          expression: sourceToExpression(rhs),
        }

        return expression

      } else if (object) {
        var expression = anExpression.objectLiteral(eval(object[0]))

        debugger
        return expression
      } else if (functionCall) {

        var args = functionCall[2].split(",").map(sourceToExpression)

        var expression = {
          kind: "function call",
          functionName: functionCall[1],
          arguments: args,
        }

        return expression
      } else if (variable) {
        var expression = {
          kind: "variable reference",
          variableName: variable[1],
        }

        return expression
      } else if (string) {
        var expression = anExpression.stringLiteral(string[1])
        return expression
      } else {
        debugger
        throw new Error("what now? "+source)
      }
    }




    function anId() {
      lastExpressionInteger++
      var id = lastExpressionInteger.toString(36)
      return "expr-"+id
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

        source = expression.variableName
          +" = "
          +expressionToJavascript(expression.expression)

        if (expression.isDeclaration) {
          source = "var "+source
        }

        return source
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


    function argumentNames(func) {
      if (typeof func == "string") {
        var firstLine = func
      } else {
        var firstLine = func.toString().match(/.*/)[0]
      }

      var argString = firstLine.match(/[(]([^)]*)/)[1]

      var args = argString.split(/, */)

      return args
    }

    return anExpression
  }
)
