var library = require("nrtv-library")(require)



module.exports = library.export(
  "draw-expression",
  ["web-element", "./an-expression", "make-it-editable", "bridge-module", "./program"],
  function(element, anExpression, makeItEditable, bridgeModule, Program) {

    var programBinding
    var programConstructor

    var addLine
    var addKeyPair
    var addFunctionArgument
    var replaceValue

    // EDITOR ///////////////////////

    function prepareBridge(bridge) {

      programConstructor = bridgeModule(library, "./program", bridge)

      var thisGetsPassedToTemplatesMaybe = bridgeModule(library, "make-it-editable", bridge)

      var addExpressionToNeighbors = bridge.defineFunction(function addExpressionToNeighbors(newExpression, neighbors, relationship, relativeExpression) {
        
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
      })

      addKeyPair = bridge.defineFunction(function addKeyPair(insertByThisId, relationship, objectExpressionId, relativeToKey) {

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
          program
        )

        addHtml[relationship](neighbor, el.html())

        updateSelection({controls: "none"})

        el.startEditing()
      })

      addFunctionArgument = bridge.defineFunction(function addFunctionArgument(program, expressionId, dep) {

        var index = program.addFunctionArgument(expressionId, dep)

        var el = argumentName(expressionId, dep, index)

        var selector = "#"+expressionId+" .function-argument-names"

        var container = document.querySelector(selector)

        addHtml.inside(
          container, el.html()
        )

      })


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
              return argumentName(expression.id, name, index)
            }
          )
        )

        children.push(argumentNames)

        children.push(functionLiteralBody(expression, program))
      }
    )

    var argumentName = element.template(
      ".button.argument-name",
      function(expressionId, name, argumentIndex) {

        this.children.push(
          element.raw(name)
        )
        
        makeItEditable(
          this,
          programBinding.methodCall("getArgumentName").withArgs(expressionId, argumentIndex),
          programBinding.methodCall("renameArgument").withArgs(expressionId, argumentIndex)
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
            program
          )

          this.children.push(el)
        }
      }
    )

    var keyPairTemplate = element.template(
      ".key-pair",
      function keyPairTemplate(pairExpression, keyRenameHandler, program) {
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

        var valueExpression = pairExpression.objectExpression.valuesByKey[key]

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

      program.bindings = {
        program: programBinding,
        addLine: addLine,
        addKeyPair: addKeyPair,
        addFunctionArgument: addFunctionArgument,
        replaceValue: replaceValue
      }

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



