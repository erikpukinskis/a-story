var library = require("nrtv-library")(require)

module.exports = library.export(
  "draw-expression",
  ["nrtv-element", "./an-expression", "function-call"],
  function(element, anExpression, functionCall) {

    var parentExpressionsByChildId = {}
    var expressionIds = []
    var expressionsById = {}


    function getProperty(property, expressionId) {
      var expression = expressionsById[expressionId]
      return expression[property]
    }

    function setProperty(property, expressionId, newValue, oldValue) {
      var expression = expressionsById[expressionId]
      expression[property] = newValue
      programChanged()
    }

    function setFloatProperty(property, expressionId, newValue, oldValue) {
      var expression = expressionsById[expressionId]
      expression[property] = parseFloat(newValue)
      programChanged()
    }

    function getKeyName(id) {
      var pairExpression = expressionsById[id]
      return pairExpression.key
    }

    function onKeyRename(pairId, newKey) {
      var pairExpression = expressionsById[pairId]
      var object = pairExpression.objectExpression.valuesByKey
      var oldKey = pairExpression.key

      pairExpression.key = newKey
      object[newKey] = object[oldKey]

      delete object[oldKey]
      programChanged()
    }

    function getArgumentName(expressionId, index) {
      var expression = expressionsById[expressionId]

      return expression.argumentNames[index]
    }

    function renameArgument(expressionId, index, newName) {
      var expression = expressionsById[expressionId]

      expression.argumentNames[index] = newName

      programChanged()
    }





    // LAST DESCENDANT AFTER

    function lastDescendantAfter(elementIds, startIndex) {

      var possibleParentIds = [elementIds[startIndex]]
      var lastDescendant = startIndex

      for(var i = startIndex+1; i<elementIds.length; i++) {

        var testId = elementIds[i]
        var testExpr = expressionsById[testId]

        var testParent = parentExpressionsByChildId[testId]

        if (!testParent) {
          var isDescendant = false
        } else {
          var testParentId = testParent.elementId
          var isDescendant = contains(possibleParentIds, testParent.elementId)
        }

        if (isDescendant) {
          possibleParentIds.push(testId)
          lastDescendant = i
        } else {
          return lastDescendant
        }      
      }

      return lastDescendant
    }

    function indexBefore(list, value) {

      for(var i = 0; i < list.length; i++) {
        if (list[i] == value) {
          return i
        }
      }

      throw new Error("can't find "+value+" to insert before it")

    }

    function indexAfter(elementIds, relativeId) {

      var parentIdStack = []

      for(var i = 0; i < elementIds.length; i++) {
        var testId = elementIds[i]

        if (testId == relativeId) {
          return lastDescendantAfter(elementIds, i)+1
        }
      }

      throw new Error("can't find "+relativeId+" to insert after it")
    }

    function contains(array, value) {
      if (!Array.isArray(array)) {
        throw new Error("looking for "+JSON.stringify(value)+" in "+JSON.stringify(array)+", which is supposed to be an array. But it's not.")
      }
      var index = -1;
      var length = array.length;
      while (++index < length) {
        if (array[index] == value) {
          return true;
        }
      }
      return false;
    }























    // EDITOR ///////////////////////

    var drawExpression = (function() {

      var replaceValue
      var addLine

      function prepareBridge(bridge) {

        addLine = bridge.defineFunction(function addLine(ghostElementId, relativeToThisId, relationship, newExpression) {
          
          var parentExpression = parentExpressionsByChildId[relativeToThisId]

          var relativeExpression = expressionsById[relativeToThisId]

          addExpressionToNeighbors(
            newExpression,
            parentExpression.body,
            relationship,
            relativeExpression
          )

          newExpression.role = "function literal line"

          if (relationship == "before") {

            var splicePosition = indexBefore(expressionIds, relativeToThisId)
            var deleteThisMany = 0

          } else if (relationship == "after") {

            var splicePosition = indexAfter(expressionIds, relativeToThisId)
            var deleteThisMany = 0

          } else if (relationship == "inPlaceOf") {

            var splicePosition = 0
            var deleteThisMany = 1

          } else { throw new Error() }

          var newElement = expressionToElement(
              newExpression)

          parentExpressionsByChildId[newExpression.id] = parentExpression

        
          expressionIds.splice(splicePosition, deleteThisMany, newElement.id)

          var ghostElement = document.getElementById(ghostElementId)

          addHtml[relationship](ghostElement, newElement.html())

          onNewExpression(parentExpression, newExpression)

          programChanged()
          hideSelectionControls()
          updateSelection()
          if (relationship != "inPlaceOf") {
            offsetCameraUp(1)
          }
        })


        var rememberKeyValue = bridge.defineFunction(function rememberKeyValue(valueElement, pairExpression) {

          parentExpressionsByChildId[valueElement.id] = pairExpression.objectExpression

          keyPairsByValueId[valueElement.id] = pairExpression

          valueElement.classes.push("key-value")
        })

        var forgetKeyValue = bridge.defineFunction(function forgetKeyValue(oldExpression) {
          delete parentExpressionsByChildId[oldExpression.id]

          delete keyPairsByValueId[oldExpression.id]
        })

        replaceValue = bridge.defineFunction([rememberKeyValue, forgetKeyValue],function replaceValue(rememberKeyValue, forgetKeyValue, valueElementId, newExpression) {

          var pairExpression = keyPairsByValueId[valueElementId]

          var objectExpression = pairExpression.objectExpression

          var key = pairExpression.key

          var oldExpression = objectExpression.valuesByKey[key]

          objectExpression.valuesByKey[key] = newExpression

          var oldElement = document.getElementById(valueElementId)

          var newElement = expressionToElement(newExpression)

          rememberKeyValue(newElement, pairExpression)

          addHtml.inPlaceOf(oldElement, newElement.html())

          forgetKeyValue(oldExpression)

        })
      }

      // RENDERERS 

      var emptyExpression = element.template(
        ".empty-expression.button",
        "empty",
        function(expression) {
          this.id = expression.id

          // this stuff is really weird. It seems like I have to do it because expressionToElement is recursive. But really I could do the same thing with expressionRoles and valueExpressionKeys objects.

          if (expression.role == "key value") {

            var replaceIt = 
              replaceValue
              .withArgs(
                expression.id
              )

            var showMenu = chooseExpression.withArgs(replaceIt)

          }

          if (showMenu) {
            this.onclick(showMenu)
          }

        }
      )

      var renderFunctionCall = element.template(
        ".function-call",
        function(expression) {
          this.id = expression.id

          var button = element(
            ".button.function-call-name.indenter",
            expression.functionName
          )

          makeItEditable(
            button,
            functionCall(getProperty).withArgs("functionName", expression.id),
            functionCall(setProperty).withArgs("functionName", expression.id)
          )

          this.children.push(button)


          var container = element(
            ".function-call-args")

          container.children =
            argumentsToElements(
              expression.arguments,
              expression
            )

          this.children.push(container)
        }
      )

      function argumentsToElements(args, parent) {

        var elements = []
        for(var i=0; i<args.length; i++) {

          var expression = args[i]
          var isFunctionCall = expression.kind == "function call"
          var arg = expressionToElement(expression)

          arg.classes.push(
            "function-argument")

          if (isFunctionCall) {
            arg.classes.push("call-in-call")
          }

          elements.push(arg)
        }

        return elements
      }




      var stringLiteral = element.template(
        ".button.literal",
        function(expression) {
          this.id = expression.id

          var stringElement = element("span", element.raw(expression.string.replace(/\</g, "&lt;").replace(/\>/g, "&gt;")))

          this.children.push(
            element("span", "\""),
            stringElement,
            element("span", "\"")
          )

          makeItEditable(
            this,
            functionCall(getProperty).withArgs("string", expression.id),
            functionCall(setProperty).withArgs("string", expression.id),
            {updateElement: stringElement}
          )
        }
      )


      var numberLiteral = element.template(
        ".button.literal",
        function(expression) {
          this.id = expression.id

          this.children.push(element.raw(expression.number.toString()))

          makeItEditable(
            this,
            functionCall(getProperty).withArgs("number", expression.id),
            functionCall(setFloatProperty).withArgs("number", expression.id)
          )
        }
      )




      var functionLiteral = element.template(
        ".function-literal",
        function(expression) {
          this.id = expression.id

          var children = this.children

          children.push(
            element(
              ".button.function-literal-label.indenter",
              "function"
            )
          )

          if (!expression.argumentNames) {
            throw new Error("Your function literal ("+stringify(expression)+") needs an argumentNames array. At least an empty one.")
          }

          var argumentNames = element(
            ".function-argument-names",
            expression.argumentNames.map(
              function(name, index) {
                return argumentName(expression, name, index)
              }
            )
          )

          children.push(argumentNames)

          children.push(functionLiteralBody(expression))
        }
      )

      var argumentName = element.template(
        ".button.argument-name",
        function(expression, name, argumentIndex) {

          this.children.push(
            element.raw(name)
          )
          
          makeItEditable(
            this,
            functionCall(getArgumentName).withArgs(expression.id, argumentIndex),
            functionCall(renameArgument).withArgs(expression.id, argumentIndex)
          )

        }
      )

      var functionLiteralBody = element.template(
        ".function-literal-body",
        function(parent) {

          var previous

          this.children = parent.body.map(renderChild)

          function renderChild(child) {

            // do we need this after we pull fillEmptyFunction in here?

            child.role = "function literal line"

            var el = expressionToElement(child)

            if (child.kind == "empty expression") {

              var fillIt = addLine.withArgs(
                child.id,
                child.id,
                "inPlaceOf"
              )

              debugger
              
              var showMenu = chooseExpression
              .withArgs(fillIt)

              el.attributes.onclick = showMenu.evalable()
            }

            parentExpressionsByChildId[child.id] = parent

            el.classes.push("function-literal-line")

            if (previous) {
              previous.classes.push("leads-to-"+child.kind.replace(" ", "-"))

            }

            previous = el

            return el
          }

        }
      )




      var variableAssignment = element.template(
        ".variable-assignment",
        function(expression) {
          this.id = expression.id

          var nameSpan = element("span",
            expression.variableName
          )

          var lhs = element(
            ".button.variable-name.indenter",
            [
              element("span", "var&nbsp;"),
              nameSpan,
              element("span", "&nbsp;=")
            ]
          )

          makeItEditable(
            lhs,
            functionCall(getProperty).withArgs("variableName", expression.id),
            functionCall(setProperty).withArgs("variableName", expression.id),
            {updateElement: nameSpan}
          )

          var rhs = expressionToElement(
            expression.expression)

          // parentExpressionsByChildId[rhs.id] = expression

          rhs.classes.push("rhs")
          this.children.push(lhs)
          this.children.push(rhs)
        }
      )




      var objectLiteral = element.template(
        ".object-literal",
        function(expression) {
          this.id = expression.id

          expression.keys = []

          for(var key in expression.valuesByKey) {

            expression.keys.push(key)

            var pair = {
              kind: "key pair",
              key: key,
              objectExpression: expression,
              id: anExpression.id()
            }

            expressionsById[pair.id] = pair

            var el = keyPairTemplate(
              pair,
              functionCall(onKeyRename).withArgs(pair.id),
              expression
            )

            this.children.push(el)
          }
        }
      )

      var keyPairTemplate = element.template(
        ".key-pair",
        function keyPairTemplate(pairExpression, keyRenameHandler, objectExpression) {
          this.id = pairExpression.id

          var key = pairExpression.key

          var textElement = element(
            "span",
            element.raw(key)
          )

          var keyButton = element(
            ".button.key",
            [
              textElement,
              element("span", ":")
            ]
          )

          makeItEditable(
            keyButton,
            functionCall(getKeyName).withArgs(pairExpression.id),
            keyRenameHandler,
            {updateElement: textElement}
          )

          this.children.push(keyButton)

          var valueExpression = objectExpression.valuesByKey[key]

          valueExpression.key = key

          var valueElement =
            expressionToElement(
              valueExpression)

          rememberKeyValue(valueElement, pairExpression)

          this.children.push(valueElement)

          this.startEditing = function() {
            eval(keyButton.attributes.onclick)
          }
        }
      )


      var variableReference = element.template(
        ".button.variable-reference",
        function(expression) {
          this.children.push(element.raw(
            expression.variableName
          ))
        }
      )




      var arrayLiteral = element.template(
        ".array-literal", // temporarily not .indenter until we can see what that would need to look like.

        function(expression) {
          this.id = expression.id

          var items = expression.items

          this.children = items.map(itemToElement)

          function itemToElement(item) {
            return element(
              ".array-item",
              expressionToElement(item)
            )
          }

        }
      )

      function itemToElement(item) {
        return 
      }





      // DRAW THE PROGRAM

      var renderers = {
        "function call": renderFunctionCall,
        "function literal": functionLiteral,
        "variable reference": variableReference,
        "variable assignment": variableAssignment,
        "object literal": objectLiteral,
        "array literal": arrayLiteral,
        "string literal": stringLiteral,
        "number literal": numberLiteral,
        "empty expression": emptyExpression
      }


      var expressionIdWritePosition = 0

      function expressionToElement(expression) {

        var i = expressionIdWritePosition
        expressionIdWritePosition++

        if (typeof expression != "object" || !expression || !expression.kind) {
          throw new Error("Trying to turn "+stringify(expression)+" into an element, but it doesn't look like an expression")
        }

        var kind = expression.kind
        var render = renderers[kind]

        if (typeof render != "function") {
          throw new Error("No renderer for "+kind)
        }

        var el = render(expression)

        if (el.id && el.id != expression.id) {
          console.log("expression:", expression)
          console.log("element:", el)
          throw new Error("Expression element ids must match the expression id")
        }

        el.id = expression.id

        expressionsById[expression.id] = expression

        expressionIds[i] = expression.id

        return el
      }

      function stringify(thing) {
        if (typeof thing == "function") {
          return thing.toString()
        } else {
          return JSON.stringify(thing)
        }
      }

      function addExpressionToNeighbors(newExpression, neighbors, relationship, relativeExpression) {
        
        for(var i = 0; i < neighbors.length; i++) {
          var neighborExpression = neighbors[i]

          if (neighborExpression == relativeExpression) {

            lineIndex = i

            if (relationship == "after") {
              lineIndex++
            }

            break
          }
        }

        if (relationship == "inPlaceOf") {
          var deleteThisMany = 1
        } else {
          var deleteThisMany = 0
        }

        neighbors.splice(lineIndex, deleteThisMany,  newExpression)
      }

      function addKeyPair(insertByThisId, relationship, objectExpressionId, relativeToKey) {

        var objectExpression = expressionsById[objectExpressionId]

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

        var el = keyPairTemplate(
          pairExpression,
          functionCall(onKeyRename).withArgs(pairExpression.id),
          objectExpression
        )

        addHtml[relationship](neighbor, el.html())

        updateSelection({controls: "none"})

        el.startEditing()
      }

      function addFunctionArgument(expressionId, dep) {

        // This part is the program manipulation part:

        var package = expressionsById[expressionId]

        var index = package.argumentNames.length

        package.argumentNames.push(dep)


        // and then we have the editor part:

        var el = argumentName(package, dep, index)

        var selector = "#"+expressionId+" .function-argument-names"

        var container = document.querySelector(selector)

        addHtml.inside(
          container, el.html()
        )

      }

      var chooseExpression

      function drawExpression(expression, options) {
        if (!options) { options = {} }

        chooseExpression = options.chooseExpression

        return expressionToElement(expression)
      }

      drawExpression.addKeyPair = addKeyPair

      drawExpression.prepareBridge = prepareBridge

      drawExpression.addFunctionArgument = addFunctionArgument

      return drawExpression

    })()

    return drawExpression
  }
)



