var library = require("module-library")(require)

library.define(
  "add-key-pair",
  ["render-key-pair", "an-expression", "program", "add-html"],
  function(keyPair, anExpression, Program, addHtml) {

    return function(programId, insertByThisId, relationship, objectExpressionId, relativeToKey) {

      var program = Program.findById(programId)

      var objectExpression = program.get(objectExpressionId)

      var index = objectExpression.keys.indexOf(relativeToKey)
      if (relationship == "after") {
        index = index + 1
      }

      var valueExpression = anExpression.emptyExpression()

      var pairExpression = program.addKeyPair(objectExpression, "", valueExpression, {index: index})

      var el = keyPair(
        pairExpression, program
      )

      var neighbor = document.getElementById(insertByThisId)

      addHtml[relationship](neighbor, el.html())

      el.startEditing()
    }
  }
)



library.define(
  "add-function-argument",
  ["render-argument-name"],
  function(argumentName) {

    return function addFunctionArgument(program, expressionId, dep) {

      var index = program.addFunctionArgument(expressionId, dep)

      var el = argumentName(expressionId, dep, index)

      var selector = "#"+expressionId+" .function-argument-names"

      var container = document.querySelector(selector)

      addHtml.inside(
        container, el.html()
      )

    }

  }
)     




library.define(
  "add-line",
  ["expression-to-element", "add-html", "program"],
  function(expressionToElement, addHtml, Program) {

    function addLine(programId, ghostElementId, relativeToThisId, relationship, newExpression) {
    
      var program = Program.findById(programId)

      var parentExpression = program.getParentOf(relativeToThisId)

      newExpression.role = "function literal line"

      var newElement = expressionToElement(
          newExpression, program)

      program.insertExpression(newExpression, relationship, relativeToThisId)

      var ghostElement = document.getElementById(ghostElementId)

      addHtml[relationship](ghostElement, newElement.html())

      program.newexpression(parentExpression, newExpression)

      program.changed({
        linesAdded: relationship == "inPlaceOf" ? 0 : 1
      })
    }

    addLine.asBinding = function() {
      return functionCall("library.get(\"add-line\")")
    }

    return addLine
  }
)


library.define(
  "replace-value",
  ["expression-to-element"],
  function(expressionToElement) {

    function replaceValue(program, valueElementId, newExpression) {

      var pairExpression = program.getPairForValue(valueElementId)

      var oldElement = document.getElementById(valueElementId)

      var newElement = expressionToElement(newExpression, program)

      program.replaceKeyValue(pairExpression, newExpression, newElement)

      newElement.classes.push("key-value")

      addHtml.inPlaceOf(oldElement, newElement.html())


    }

    return replaceValue

  }
)



