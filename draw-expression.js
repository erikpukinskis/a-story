var library = require("nrtv-library")(require)


library.define(
  "program",
  ["an-expression"],
  function(anExpression) {

    function Program() {
      this.expressionIds = []
      this.expressionsById = {}
      this.keyPairsByValueId = {}
      this.parentExpressionsByChildId = {}
      this.onchangedCallbacks = []
      this.onnewexpressionCallbacks = []
    }

    Program.prototype.rootExpression = function() {
      var rootId = this.expressionIds[0]
      return this.expressionsById[rootId]
    }

    Program.prototype.onchanged = function(callback) {
      this.onchangedCallbacks.push(callback)
    }

    Program.prototype.onnewexpression = function(callback) {
      this.onnewexpressionCallbacks.push(callback)
    }

    Program.prototype.changed = function() {

      window.__nrtvFocusSelector = ".output"

      document.querySelector(".output").innerHTML = ""

      var expression = this.rootExpression()

      this.onchangedCallbacks.forEach(function(callback) {
        callback(expression)
      })
    }

    Program.prototype.newexpression =
      function(parent, newExpression) {
        this.onnewexpressionCallbacks.forEach(function(callback) {

          callback(parent, newExpression)
        })
      }

    function call(func) { func() }

    Program.prototype.data = function() {
      var parentExpressionIds = {}

      for(var childId in this.parentExpressionsByChildId) {
        var parentId = this.parentExpressionsByChildId[childId]

        parentExpressionIds[childId] = parentId
      }

      return {
        expressionIds: this.expressionIds,
        expressionsById: this.expressionsById,
        keyPairsByValueId: this.keyPairsByValueId,
        parentExpressionIds: parentExpressionIds
      }
    }

    Program.prototype.load = function(data) {

      this.expressionIds = data.expressionIds

      this.expressionsById = data.expressionsById

      this.keyPairsByValueId = data.keyPairsByValueId

      this.parentExpressionsByChildId = {}

      for(var childId in data.parentExpressionIds) {
        var parentId = data.parentExpressionIds[childId]

        this.parentExpressionsByChildId[childId] = this.expressionsById[parentId]
      }
    }



    Program.prototype.getProperty = function(property, expressionId) {
      var expression = this.expressionsById[expressionId]
      return expression[property]
    }

    Program.prototype.setProperty = function(property, expressionId, newValue, oldValue) {
      var expression = this.expressionsById[expressionId]
      expression[property] = newValue
      this.changed()
    }

    Program.prototype.setFloatProperty = function(property, expressionId, newValue, oldValue) {
      var expression = expressionsById[expressionId]
      expression[property] = parseFloat(newValue)
      this.changed()
    }

    Program.prototype.getKeyName = function(id) {
      var pairExpression = this.expressionsById[id]
      return pairExpression.key
    }

    Program.prototype.onKeyRename = function(pairId, newKey) {
      var pairExpression = this.expressionsById[pairId]
      var object = pairExpression.objectExpression.valuesByKey
      var oldKey = pairExpression.key

      pairExpression.key = newKey
      object[newKey] = object[oldKey]

      delete object[oldKey]
      this.changed()
    }

    Program.prototype.getArgumentName = function(expressionId, index) {
      var expression = this.expressionsById[expressionId]

      return expression.argumentNames[index]
    }

    Program.prototype.getPairForValue = function(valueElementId) {
      return this.keyPairsByValueId[valueElementId]
    }

    Program.prototype.renameArgument = function(expressionId, index, newName) {
      var expression = this.expressionsById[expressionId]

      expression.argumentNames[index] = newName

      this.changed()
    }

    Program.prototype.addVirtualExpression = function(newExpression) {

      this.expressionsById[newExpression.id] = newExpression
    }

    Program.prototype.addExpressionAt = function(newExpression, i) {

      this.expressionsById[newExpression.id] = newExpression

      this.expressionIds[i] = newExpression.id
    }


    Program.prototype.insertExpression = function(newExpression, relationship, relativeToThisId) {

      if (!relationship) {
        this.expressionsById[newExpression.id] = newExpression

        this.expressionIds.push(newExpression.id)

        return
      }

      if (relationship == "before") {

        var splicePosition = indexBefore(this, expressionIds, relativeToThisId)
        var deleteThisMany = 0

      } else if (relationship == "after") {

        var splicePosition = indexAfter(this, expressionIds, relativeToThisId)
        var deleteThisMany = 0

      } else if (relationship == "inPlaceOf") {

        var splicePosition = 0
        var deleteThisMany = 1

      } else { throw new Error() }

      this.parentExpressionsByChildId[newExpression.id] = parentExpression

      this.expressionIds.splice(splicePosition, deleteThisMany, newElement.id)
    }

    function lastDescendantAfter(program, ids, startIndex) {

      var possibleParentIds = [elementIds[startIndex]]
      var lastDescendant = startIndex

      for(var i = startIndex+1; i<elementIds.length; i++) {

        var testId = ids[i]
        var testExpr = program.expressionsById[testId]

        var testParent = program.parentExpressionsByChildId[testId]

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

    function indexBefore(program, ids, relativeId) {

      for(var i = 0; i < ids.length; i++) {
        if (list[i] == relativeId) {
          return i
        }
      }

      throw new Error("Wanted to insert before "+relativeId+" but I can't find it!")

    }

    function indexAfter(program, ids, relativeId) {

      var parentIdStack = []

      for(var i = 0; i < ids.length; i++) {
        var testId = ids[i]

        if (testId == relativeId) {
          return lastDescendantAfter(program, ids, i)+1
        }
      }

      throw new Error("Wanted to insert after "+relativeId+" but I can't find it!")
    }

    Program.prototype.setParent = function(childId, parent) {
      this.parentExpressionsByChildId[childId] = parent
    }

    Program.prototype.setKeyValue = function(pairExpression, newExpression, newElement) {

      var key = pairExpression.key

      var objectExpression = pairExpression.objectExpression

      var oldExpression = objectExpression.valuesByKey[key]

      objectExpression.valuesByKey[key] = newExpression

      if (oldExpression.id != newExpression.id) {

        delete program.parentExpressionsByChildId[oldExpression.id]

        delete program.keyPairsByValueId[oldExpression.id]
      }

      program.parentExpressionsByChildId[newExpression.id] = pairExpression.objectExpression

      program.keyPairsByValueId[newExpression.id] = pairExpression

    }

    return Program
  }
)


module.exports = library.export(
  "draw-expression",
  ["web-element", "./an-expression", "make-it-editable", "bridge-module", "program"],
  function(element, anExpression, makeItEditable, bridgeModule, Program) {

    var programBinding
    var programConstructor



    // EDITOR ///////////////////////

    function prepareBridge(bridge) {

      programConstructor = bridgeModule(library, "program", bridge)

      var thisGetsPassedToTemplatesMaybe = bridgeModule(library, "make-it-editable", bridge)

      addLine = bridge.defineFunction(function addLine(program,ghostElementId, relativeToThisId, relationship, newExpression) {
        

        var parentExpression = program.getParentOf(relativeToThisId)

        var relativeExpression = program.getExpression(relativeToThisId)

        addExpressionToNeighbors(
          newExpression,
          parentExpression.body,
          relationship,
          relativeExpression
        )

        newExpression.role = "function literal line"

        var newElement = expressionToElement(
            newExpression, program)

        program.insertExpression(relationship, relativeToThisId, newExpression)

        var ghostElement = document.getElementById(ghostElementId)

        addHtml[relationship](ghostElement, newElement.html())

        program.newexpression(parentExpression, newExpression)

        program.changed()
        hideSelectionControls()
        updateSelection()
        if (relationship != "inPlaceOf") {
          offsetCameraUp(1)
        }
      })

      replaceValue = bridge.defineFunction(function replaceValue(program, valueElementId, newExpression) {

        var pairExpression = program.getPairForValue(valueElementId)

        var oldElement = document.getElementById(valueElementId)

        var newElement = expressionToElement(newExpression, program)

        program.replaceKeyValue(pairExpression, newExpression, newElement)

        newElement.classes.push("key-value")

        addHtml.inPlaceOf(oldElement, newElement.html())


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

          var showMenu = getExpression.withArgs(replaceIt)

        }

        if (showMenu) {
          this.onclick(showMenu)
        }

      }
    )


    var renderFunctionCall = element.template(
      ".function-call",
      function(expression, program) {
        this.id = expression.id

        var button = element(
          ".button.function-call-name.indenter",
          expression.functionName
        )

        makeItEditable(
          button,
          programBinding.methodCall("getProperty").withArgs("functionName", expression.id),
          programBinding.methodCall("setProperty").withArgs("functionName", expression.id)
        )

        this.children.push(button)


        var container = element(
          ".function-call-args")

        container.children =
          argumentsToElements(
            expression.arguments,
            expression, program
          )

        this.children.push(container)
      }
    )

    function argumentsToElements(args, parent, program) {

      var elements = []
      for(var i=0; i<args.length; i++) {

        var expression = args[i]
        var isFunctionCall = expression.kind == "function call"
        var arg = expressionToElement(expression, program)

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
          programBinding.methodCall("getProperty").withArgs("string", expression.id),
          programBinding.methodCall("setProperty").withArgs("string", expression.id),
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
          programBinding.methodCall("getProperty").withArgs("number", expression.id),
          programBinding.methodCall("setFloatProperty").withArgs("number", expression.id)
        )
      }
    )

    var functionLiteral = element.template(
      ".function-literal",
      function(expression, program) {
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

        children.push(functionLiteralBody(expression, program))
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
          programBinding.methodCall("getArgumentName").withArgs(expression.id, argumentIndex),
          programBinding.methodCall("renameArgument").withArgs(expression.id, argumentIndex)
        )

      }
    )

    var functionLiteralBody = element.template(
      ".function-literal-body",
      function(parent, program) {

        var previous

        this.children = parent.body.map(renderChild)

        function renderChild(child) {

          // do we need this after we pull fillEmptyFunction in here?

          child.role = "function literal line"

          var el = expressionToElement(child, program)

          if (child.kind == "empty expression") {

            var addIt = addLine.withArgs(
              child.id,
              child.id,
              "inPlaceOf"
            )
            
            el.attributes.onclick = getExpression.withArgs(addIt).evalable()
          }

          program.setParent(child.id, parent)

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
      function(expression, program) {
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
          programBinding.methodCall("getProperty").withArgs("variableName", expression.id),
          programBinding.methodCall("setProperty").withArgs("variableName", expression.id),
          {updateElement: nameSpan}
        )

        var rhs = expressionToElement(
          expression.expression, program)

        // parentExpressionsByChildId[rhs.id] = expression

        rhs.classes.push("rhs")
        this.children.push(lhs)
        this.children.push(rhs)
      }
    )


    var objectLiteral = element.template(
      ".object-literal",
      function(expression, program) {
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

          program.addVirtualExpression(pair)

          var el = keyPairTemplate(
            pair,
            programBinding.methodCall("onKeyRename").withArgs(pair.id),
            expression,
            program
          )

          this.children.push(el)
        }
      }
    )

    var keyPairTemplate = element.template(
      ".key-pair",
      function keyPairTemplate(pairExpression, keyRenameHandler, objectExpression, program) {
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
          programBinding.methodCall("getKeyName").withArgs(pairExpression.id),
          keyRenameHandler,
          {updateElement: textElement}
        )

        this.children.push(keyButton)

        var valueExpression = objectExpression.valuesByKey[key]

        valueExpression.key = key

        var valueElement =
          expressionToElement(
            valueExpression, program)

        program.setKeyValue(pairExpression, valueExpression, valueElement)

        valueElement.classes.push("key-value")

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

      function(expression, program) {
        this.id = expression.id

        var items = expression.items

        this.children = items.map(itemToElement)

        function itemToElement(item) {
          return element(
            ".array-item",
            expressionToElement(item, program)
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

    function expressionToElement(expression, program) {

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

      if (!program) {throw new Error()}
      var el = render(expression, program)

      if (el.id && el.id != expression.id) {
        console.log("expression:", expression)
        console.log("element:", el)
        throw new Error("Expression element ids must match the expression id")
      }

      el.id = expression.id

      program.addExpressionAt(expression, i)

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
        programBinding.methodCall("onKeyRename").withArgs(pairExpression.id),
        objectExpression,
        program
      )

      addHtml[relationship](neighbor, el.html())

      console.log("ya")
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

    var drawing

    function drawExpression(expression, bridge, getExpression) {

      prepareBridge(bridge)

      makeItEditable.prepareBridge(bridge)

      programBinding = bridge.defineSingleton(
        "program",
        [programConstructor],
        function(Program) {
          return new Program()
        }
      )

      program = new Program()

      var el = expressionToElement(expression, program)

      bridge.asap(
        programBinding.methodCall("load")
        .withArgs(program.data())
      )

      program.element = el
      program.binding = programBinding

      return program
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


    return drawExpression
  }
)



