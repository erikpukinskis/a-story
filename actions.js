var library = require("module-library")(require)

library.define(
  "add-key-pair",
  ["render-key-pair", "an-expression", "add-html"],
  function(keyPair, anExpression, addHtml) {

    return function addKeyPair(treeId, insertByThisId, relationship, objectExpressionId, relativeToKey) {

      var tree = anExpression.getTree(treeId)

      var objectExpression = tree.get(objectExpressionId)

      var index = objectExpression.keys.indexOf(relativeToKey)
      if (relationship == "after") {
        index = index + 1
      }

      var valueExpression = anExpression.emptyExpression()

      var pairExpression = tree.addKeyPair(objectExpression, "", valueExpression, {index: index})

      var el = keyPair(
        pairExpression, tree
      )

      var neighbor = document.getElementById(insertByThisId)

      addHtml[relationship](neighbor, el.html())

      el.startEditing()
    }
  }
)



library.define(
  "add-function-argument",
  ["render-argument-name", "an-expression"],
  function(argumentName, anExpression) {

    return function addFunctionArgument(treeId, expressionId, dep) {

      var tree = anExpression.getTree(treeId)
      
      var index = tree.addFunctionArgument(expressionId, dep)

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
  ["expression-to-element", "add-html", "an-expression"],
  function(expressionToElement, addHtml, anExpression) {

    function addLine(treeId, ghostElementId, relativeToThisId, relationship, newExpression) {
    
      var tree = anExpression.getTree(treeId)

      var parentExpression = tree.getParentOf(relativeToThisId)

      newExpression.role = "function literal line"

      var newElement = expressionToElement(
          newExpression, tree)

      tree.insertExpression(newExpression, relationship, relativeToThisId)

      var ghostElement = document.getElementById(ghostElementId)

      addHtml[relationship](ghostElement, newElement.html()+"<div class=\"break\"></div>")

      tree.newexpression(parentExpression, newExpression)

      tree.changed({
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
  ["expression-to-element", "an-expression"],
  function(expressionToElement, anExpression) {

    function replaceValue(treeId, valueElementId, newExpression) {

      var tree = anExpression.getTree(treeId)

      var pairExpression = tree.getPairForValue(valueElementId)

      var oldElement = document.getElementById(valueElementId)

      var newElement = expressionToElement(newExpression, tree)

      tree.replaceKeyValue(pairExpression, newExpression, newElement)

      newElement.classes.push("key-value")

      addHtml.inPlaceOf(oldElement, newElement.html())


    }

    return replaceValue

  }
)



