var library = require("nrtv-library")(require)

library.define(
  "add-key-pair",
  ["render-key-pair", "an-expression", "program"],
  function(keyPair, anExpression, Program) {

    return function(programId, insertByThisId, relationship, objectExpressionId, relativeToKey) {

      var program = Program.findById(programId)

      var objectExpression = program.get(objectExpressionId)

      var index = objectExpression.keys.indexOf(relativeToKey)

      if (relationship == "after") {
        index = index + 1
      }

      objectExpression.keys.splice(index, 0, "")

      var valueExpression = anExpression.emptyExpression()

      valueExpression.role = "key value"

      objectExpression.valuesByKey[""] = valueExpression

      var neighbor = document.getElementById(insertByThisId)

      var pairExpression = {
        key: "",
        objectExpression: objectExpression,
        id: anExpression.id()
      }

      expressionsById[pairExpression.id] = pairExpression

      var el = keyPair(
        pairExpression, program
      )

      addHtml[relationship](neighbor, el.html())

      updateSelection({controls: "none"})

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

      program.changed()

      if (relationship != "inPlaceOf") {
        offsetCameraUp(1)
      }
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



