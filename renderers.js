var library = require("nrtv-library")(require)

library.define(
  "render-empty-expression",
  ["web-element", "replace-value", "choose-expression"],
  function(element, replaceValue, chooseExpression) {


    return element.template(
      ".empty-expression.button",
      "empty",
      function(expression) {
        this.id = expression.id

        // this stuff is really weird. It seems like I have to do it because expressionToElement is recursive. But really I could do the same thing with expressionRoles and valueExpressionKeys objects.

        if (expression.role != "key value") {
          return
        }

        // This is almost certainly broken and probable needs to be moved out into server or line-controls or something like that. We're trying to not have any dependencies on choose-expression in here
        var replaceIt = 
          replaceValue
          .withArgs(
            expression.id
          )

        this.onclick(chooseExpression.asBinding().withArgs(replaceIt))

      }
    )

  }
)


library.define(
  "render-function-call",
  ["web-element", "expression-to-element", "make-it-editable"],
  function(element, expressionToElement, makeItEditable) {

    return element.template(
      ".function-call",
      function(expression, program) {
        this.id = expression.id

        var button = element(
          ".button.function-call-name.indenter",
          expression.functionName
        )

        makeItEditable(
          button,
          program.asBinding().methodCall("getProperty").withArgs("functionName", expression.id),
          program.asBinding().methodCall("setProperty").withArgs("functionName", expression.id)
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

  }
)



library.define(
  "render-string-literal",
  ["web-element", "make-it-editable"],
  function(element, makeItEditable) {

    return element.template(
      ".button.literal",
      function(expression, program) {
        this.id = expression.id

        var stringElement = element("span", element.raw(expression.string.replace(/\</g, "&lt;").replace(/\>/g, "&gt;")))

        this.children.push(
          element("span", "\""),
          stringElement,
          element("span", "\"")
        )

        makeItEditable(
          this,
          program.asBinding().methodCall("getProperty").withArgs("string", expression.id),
          program.asBinding().methodCall("setProperty").withArgs("string", expression.id),
          {updateElement: stringElement}
        )
      }
    )

  }
)




library.define(
  "render-number-literal",
  ["web-element", "make-it-editable"],
  function(element, makeItEditable) {

    return element.template(
      ".button.literal",
      function(expression, program) {
        this.id = expression.id

        this.children.push(element.raw(expression.number.toString()))

        makeItEditable(
          this,
          program.asBinding().methodCall("getProperty").withArgs("number", expression.id),
          program.asBinding().methodCall("setFloatProperty").withArgs("number", expression.id)
        )
      }
    )

  }
)




library.define(
  "render-function-literal",
  ["web-element", "render-function-literal-body", "stringify-expression", "render-argument-name"],
  function(element, functionLiteralBody, stringify, argumentName) {

    return element.template(
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
  }
)



library.define(
  "render-argument-name",
  ["web-element", "make-it-editable"],
  function(element, makeItEditable) {

    return element.template(
      ".button.argument-name",
      function(expressionId, name, argumentIndex) {

        this.children.push(
          element.raw(name)
        )
        
        makeItEditable(
          this,
          program.asBinding().methodCall("getArgumentName").withArgs(expressionId, argumentIndex),
          program.asBinding().methodCall("renameArgument").withArgs(expressionId, argumentIndex)
        )

      }
    )

  }
)




library.define(
  "render-function-literal-body",
  ["web-element", "add-line", "expression-to-element"],
  function(element, addLine, expressionToElement) {

    var previous

    return element.template(
      ".function-literal-body",
      function(parent, program) {

        previous = null
        
        this.children = parent.body.map(renderChild.bind(null, parent, program))
      }
    )

    function renderChild(parent, program, child) {

      // do we need this after we pull fillEmptyFunction in here?

      child.role = "function literal line"

      var el = expressionToElement(child, program)

      if (child.kind == "empty expression") {

        var addIt = addLine.asBinding().withArgs(
          program.id,
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


library.define(
  "render-variable-assignment",
  ["web-element", "expression-to-element", "make-it-editable"],
  function(element, expressionToElement, makeItEditable) {

    return element.template(
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
          program.asBinding().methodCall("getProperty").withArgs("variableName", expression.id),
          program.asBinding().methodCall("setProperty").withArgs("variableName", expression.id),
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

  }
)



library.define(
  "render-object-literal",
  ["web-element", "render-key-pair"],
  function(element, keyPair) {

    return element.template(
      ".object-literal",
      function(expression, program) {
        this.id = expression.id

        for(var key in expression.valuesByKey) {

          var valueExpression = expression.valuesByKey[key]

          var pair = program.addKeyPair(expression, key, valueExpression)

          var el = keyPair(
            pair,
            program
          )

          this.children.push(el)
        }
      }
    )
     
  }
)



library.define(
  "render-key-pair",
  ["web-element", "make-it-editable", "expression-to-element"],
  function(element, makeItEditable, expressionToElement) {

    var keyPair = element.template(
      ".key-pair",
      function(pairExpression, program) {
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
          program.asBinding().methodCall("getKeyName").withArgs(pairExpression.id),
          program.asBinding().methodCall("onKeyRename").withArgs(pairExpression.id),
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

    return keyPair
  }
)

library.define(
  "render-variable-reference",
  ["web-element"],
  function(element) {

    return element.template(
      ".button.variable-reference",
      function(expression) {
        this.children.push(element.raw(
          expression.variableName
        ))
      }
    )

  }
)


library.define(
  "render-array-literal",
  ["web-element", "expression-to-element"],
  function(element, expressionToElement) {

    return element.template(
      ".array-literal", // temporarily not .indenter until we can see what that would need to look like.

      function(expression, program) {
        this.id = expression.id

        var items = expression.items

        this.children = items.map(itemToElement)

      }
    )

    function itemToElement(item) {
      return element(
        ".array-item",
        expressionToElement(item, program)
      )
    }

  }
)
