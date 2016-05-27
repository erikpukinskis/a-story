
// HELPERS

function pad(str) {
  var lines = str.split("\n")
  return lines.map(function(line) {
    return "  "+line
  }).join("\n")
}


var aProgramAppeared = (function() {

  function aProgramAppeared(json) {
    return new Program(json)
  }

  function Program(expression) {
    this.expression = expression
  }

  aProgramAppeared.stringLiteral =
    function(string) {
      return {
        kind: "string literal",
        string: string
      }
    }

  aProgramAppeared.numberLiteral =
    function(number) {
      return {
        kind: "number literal",
        number: number
      }
    }

  aProgramAppeared.emptyExpression =
    function() {
      return {
        kind: "empty expression" 
      }
    }

  aProgramAppeared.objectLiteral =
    function(object) {
      var expression = {
        kind: "object literal",
        object: {}
      }

      for (var key in object) {
        expression.object[key] = toExpression(object[key])
      }

      return expression
    }

  aProgramAppeared.arrayLiteral =
    function(array) {
      return {
        kind: "array literal",
        items: array.map(toExpression)
      }
    }

  function toExpression(stuff) {
    if (typeof stuff == "string") {
      return aProgramAppeared.stringLiteral(stuff)
    } else if (typeof stuff == "number") {
      return aProgramAppeared.numberLiteral(stuff)
    } else if (Array.isArray(stuff)) {
      return aProgramAppeared.arrayLiteral(stuff)
    } else if (typeof stuff == "object") {
      return aProgramAppeared.objectLiteral(stuff)
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

      for(var key in expression.object) {
        keyPairs.push(
          "  "
          +JSON.stringify(key)
          +": "
          +expressionToJavascript(expression.object[key])
        )
      }
      return "{\n"+keyPairs.join(",\n")+"\n}"
    }
  }


  // RUN

  Program.prototype.run = function() {
    var expression = packageAsModule(this.expression)

    var js = expressionToJavascript(expression)

    js = js + "\n//# sourceURL=program-being-edited.js"

    eval(js)
  }

  function packageAsModule(functionLiteral) {
    
    return {
      kind: "function call",
      functionName: "using",
      arguments: [
        {
          kind: "array literal",
          items: argumentNamesToStringLiterals(functionLiteral)
        },
        functionLiteral
      ]
    }

  }

  function argumentNamesToStringLiterals(functionLiteral) {

    return functionLiteral
      .argumentNames
      .map(
        function(camelCase) {
          return aProgramAppeared.stringLiteral(
            dasherized(camelCase)
          )
        }
      )

  }

  function dasherized(camelCase) {
    var words = []
    var wordStart = 0

    for(var i=0; i<camelCase.length+1; i++) {

      var letter = camelCase[i]
      var isEnd = i == camelCase.length
      var isUpperCase = letter && letter.toUpperCase() == letter

      if (isUpperCase || isEnd) {
        // new word!
        var word = camelCase.slice(wordStart, i)
        words.push(word.toLowerCase())
        wordStart = i
      }
    }

    return words.join("-")
  }

  function expressionToJavascript(expression) {

    var kind = expression.kind
    var makeCode = codeGenerators[kind]

    if (typeof makeCode != "function") {
      throw new Error("No code generator called "+kind)
    }

    return makeCode(expression)
  }

  return aProgramAppeared
})()



// RUNTIME REQUIREMENTS

var library = new Library()

var using = library.using.bind(library)

library.define("element", function () {
  return element
})

library.define("bridge-to",
  function() {
  
    return {
      webPage: handlePage
    }

    function handlePage(handler) {
      var page = {
        send: function(element) {
          var out = document.querySelector(".output")

          out.innerHTML = element.html()

        }
      }
      handler(page)
    }

  }
)


