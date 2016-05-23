
// HELPERS

function pad(str) {
  var lines = str.split("\n")
  return lines.map(function(line) {
    return "  "+line
  }).join("\n")
}


// RUN

var runProgram = (function() {

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

  function runProgram() {
    runIt(program)
  }

  function runIt(functionLiteral) {
    var expression = packageAsModule(functionLiteral)

    var js = expressionToJavascript(expression)

    js = js + "\n//# sourceURL=home-page.js"

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
          return stringLiteralJson(
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
    return traverseExpression(
      expression,
      codeGenerators
    )
  }

  return runProgram

})()


// RUNTIME REQUIREMENTS

var library = new Library()

var using = library.using.bind(library)

library.define("element", function () {
  return element
})

library.define("bridge-route", function() {
  return function(path, handler) {
    var bridge = {
      sendPage: function(element) {
        var out = document.querySelector(".output")

        out.innerHTML = element.html()

        setTimeout(function() {
          var el = document.querySelector(".program")
          var top = el.offsetTop
          var parentTop = el.parentNode.parentNode.offsetTop

          out.style.top = (top-parentTop)+"px"
          out.style.position = "relative"
        })
      }
    }

    handler(bridge)
  }
})

