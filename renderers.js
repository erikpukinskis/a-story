var library = require("module-library")(require)

require("./actions")

var rendererModules = ["function call","array literal","function literal","string literal","number literal","empty expression","variable assignment","variable reference","object literal","return statement"].map(toModuleName)

function toModuleName(kind) {
  return "render-"+kind.replace(" ", "-")
}


library.define("colors", function() {
  return {
    canary: "#f5df2f",
    gunmetal: "#bec9d6",
    black:  "#557",
    electric: "#a9a9ff",
  }
})


library.define("symbols",
  ["web-element", "colors"],
  function(element, colors) {

    var elements = {
      "br": element("br"),
      "comma": element(".comma-symbol", ", "),
      "colon": element(".colon-symbol", ":"),
      "equals": element(".equals-symbol", "="),
      "var": element(".variable-symbol", "var"),
      "return": element(".return-symbol", "return"),
      "function": element(".function-symbol", "function "),
      "openFunction": element(".scope-symbol", "{"),
      "closeFunction": element(".scope-symbol", "}"),
      "openObject": element(".object-delimiter", "{"),
      "closeObject": element(".object-delimiter", "}"),
      "openArguments": element(".call-symbol", "("),
      "closeArguments": element(".call-symbol", ")"),
      "openArray": element(".array-symbol", "["),
      "closeArray": element(".array-symbol", "]"),
    }

    var stylesheet = element.stylesheet([

      element.style(".comma-symbol", {
        "color": colors.gunmetal,
        "display": "inline-block",
        "font-weight": "bold",
      }),

      element.style(".colon-symbol", {
        "color": colors.electric,
        "display": "inline-block",
        "font-weight": "bold",
        "margin": "0 0.5em",
      }),

      element.style(".equals-symbol", {
        "color": colors.black,
        "display": "inline-block",
        "padding-left": "0.5em",
        "font-weight": "bold",
      }),

      element.style(".variable-symbol", {
        "color": colors.black,
        "display": "inline-block",
        "padding-right": "0.5em",
        "font-weight": "bold",
      }),

      element.style(".return-symbol", {
        "color": "#eccd6b",
        "display": "inline-block",
        "padding-right": "0.5em",
        "font-weight": "bold",
      }),

      element.style(".function-symbol", {
        "color": colors.gunmetal,
        "display": "inline-block",
        "font-weight": "bold",
      }),


      element.style(".scope-symbol", {
        "color": colors.canary,
        "display": "inline-block",
        "padding-left": "0.5em",
        "font-weight": "bold",
      }),

      element.style(".object-delimiter", {
        "color": colors.electric,
        "display": "inline-block",
        "padding-left": "0.5em",
        "font-weight": "bold",
      }),

      element.style(".call-symbol", {
        "color": colors.gunmetal,
        "display": "inline-block",
        "padding-left": "0.5em",
        "font-weight": "bold",
      }),

      element.style(".array-symbol", {
        "color": colors.electric,
        "display": "inline-block",
        "padding-left": "0.5em",
        "font-weight": "bold",
      }),

    ])

    elements.stylesheet = stylesheet

    return elements
  }
)

library.define(
  "render-empty-expression",
  ["web-element", "replace-value"],
  function(element, replaceValue, chooseExpression) {


    return element.template(
      ".empty-expression.code-button",
      "empty",
      function emptyExpressionRenderer(expression) {
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
  "render-source",
  ["web-element"],
  function(element) {

    return element.template(
      ".source-code",
      function emptyExpressionRenderer(expression) {
        this.addChild(expression.source.trim())
      }
    )

  }
)


library.define(
  "render-function-call",
  ["web-element", "./expression-to-element", "make-it-editable"],
  function(element, expressionToElement, makeItEditable) {

    return element.template(
      ".function-call",
      function functionCallRenderer(expression, tree, options) {
        this.id = expression.id

        var label =           expression.functionName+"("
        if (expression.arguments.length < 1) { label += ")" }

        var button = element(
          ".code-button.function-call-name",
          label
        )

        makeItEditable(
          button,
          tree.asBinding().methodCall("getProperty").withArgs("functionName", expression.id),
          tree.asBinding().methodCall("setProperty").withArgs("functionName", expression.id)
        )

        this.children.push(button)


        var container = element(
          ".function-call-args")

        container.children =
          argumentsToElements(
            expression,
            tree,
            options,
            expression.arguments
          )

        this.children.push(container)
      }
    )

    function argumentsToElements( parent, tree, options, args) {

      var elements = []
      for(var i=0; i<args.length; i++) {

        var expression = args[i]
        var isFunctionCall = expression.kind == "function call"
        var arg = expressionToElement(expression, tree, options)

        arg.classes.push(
          "function-argument")

        if (isFunctionCall) {
          arg.classes.push("call-in-call")
        }

        if (i>0) {
          elements.push(", ")
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
      ".code-button.literal.string-literal",
      function stringLiteralRenderer(expression, tree, options) {
        this.id = expression.id

        if (!expression.string || !expression.string.replace) {
          throw new Error("Expected expression to have a string attribute: "+JSON.stringify(expression, null, 2))
        }

        var stringElement = element("span", element.raw(expression.string.replace(/\</g, "&lt;").replace(/\>/g, "&gt;")))

        this.children.push(
          element("span", "\""),
          stringElement,
          element("span", "\"")
        )

        makeItEditable(
          this,
          tree.asBinding().methodCall("getProperty").withArgs("string", expression.id),
          tree.asBinding().methodCall("setProperty").withArgs("string", expression.id),
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
      ".code-button.literal",
      function numberLiteralRenderer(expression, tree, options) {
        this.id = expression.id

        if (typeof expression.number != "number") {
          throw new Error("Number on expression "+JSON.stringify(expression)+" isn't a number")
        }
        this.children.push(element.raw(expression.number.toString()))

        makeItEditable(
          this,
          tree.asBinding().methodCall("getProperty").withArgs("number", expression.id),
          tree.asBinding().methodCall("setFloatProperty").withArgs("number", expression.id)
        )
      }
    )

  }
)




library.define(
  "render-function-literal",
  ["web-element", "make-it-editable", "symbols", "colors", "expression-to-element"],
  function(element, makeItEditable, symbols, colors, expressionToElement) {

    var renderArgumentName = element.template(
      ".function-argument",
      function(expressionId, name, argumentIndex, tree) {

        this.children.push(
          element.raw(name)
        )
        
        makeItEditable(
          this,
          tree.asBinding().methodCall("getArgumentName").withArgs(expressionId, argumentIndex),
          tree.asBinding().methodCall("renameArgument").withArgs(expressionId, argumentIndex)
        )

      }
    )


    var previous

    var functionLiteralBody = element.template(
      ".function-literal-body",
      function(parent, tree, options) {

        previous = null
        
        this.children = parent.body.map(renderChild.bind(null, parent, tree, options))
      }
    )

    function renderChild(parent, tree, options, child) {

      // do we need this after we pull fillEmptyFunction in here?

      child.role = "function literal line"

      var el = expressionToElement(child, tree, options)

      if (child.kind == "empty expression") {

        var addIt = addLine.asBinding().withArgs(
          tree.id,
          child.id,
          child.id,
          "inPlaceOf"
        )
        
        el.attributes.onclick = getExpression.withArgs(addIt).evalable()
      }

      tree.setParent(child.id, parent)

      el.classes.push("function-literal-line")

      if (previous) {
        previous.classes.push("leads-to-"+child.kind.replace(" ", "-"))

      }

      previous = el

      return el
    }

    var stylesheet = element.stylesheet([
      element.style(".function-argument", {
        "display": "inline",
      }),

      element.style(".function-literal", {
        "font-family": "sans-serif",
        "font-size": "15pt",
        "color": colors.black,
        "line-height": "1.2em",
      }),

      element.style(".function-name", {
        "color": colors.gunmetal,
        "display": "inline",
        "margin-left": "0.5em",
      }),

      element.style(".function-signature", {
        "color": colors.gunmetal,
        "margin-left": "1em",

        ".comma-symbol": {
          "color": colors.gunmetal,
          "font-weight": "bold",
        }
      }),

      element.style(".function-literal-body", {
        "margin-left": "1em",
        "border-left": "0.15em solid "+colors.canary,
        "padding-left": "0.5em",
      }),
    ])


    var renderFunctionLiteral =  element.template(
      ".function-literal",
      function functionLiteralRenderer(expression, tree, options) {

        this.id = expression.id

        this.addChild(symbols.function)

        if (expression.functionName) {
          this.addChild(element(".function-name", expression.functionName))
        }

        options.addSymbolsHere = this

        options.addSymbolsHere.addChild(symbols.openArguments)

        var sig = element(
          ".function-signature")

        expression.argumentNames.forEach(function(name, i) {
            var el = renderArgumentName(expression.id, name, i, tree)
            if (i > 0) {
              sig.addChild(symbols.comma, symbols.br)
            }
            sig.addChild(el)
          }
        )

        options.addSymbolsHere = sig

        options.addSymbolsHere.addChild(symbols.closeArguments)

        this.addChild(sig)

        options.addSymbolsHere.addChild(symbols.openFunction)

        var body = functionLiteralBody(expression, tree, options)

        options.addSymbolsHere.addChild(symbols.closeFunction)

        this.addChild(body)
      }
    )

    renderFunctionLiteral.defineOn = function(bridge) {
      bridge.addToHead(stylesheet)
    }

    return renderFunctionLiteral
  }
)



library.define(
  "render-return-statement",
  ["web-element", "./expression-to-element", "symbols"],
  function(element, expressionToElement, symbols) {

    var renderReturnStatement = element.template(
      ".return-statement",
      function returnStatementRenderer(expression, tree, options) {

        this.addChild(symbols.return)

        var rhs = expressionToElement(expression.expression, tree, options)

        rhs.addSelector(".rhs")

        this.addChild(rhs)
      }
    )

    var stylesheet = element.stylesheet([
      element.style(".render-statement", {
        "display": "inline",
      }),

      element.style(".rhs", {
        "margin-left": "1em",
      }),
    ])

    renderReturnStatement.defineOn = function(bridge) {
      bridge.addToHead(stylesheet)
    }

    return renderReturnStatement
  }
)

library.define(
  "render-variable-assignment",
  ["web-element", "./expression-to-element", "make-it-editable", "symbols"],
  function(element, expressionToElement, makeItEditable, symbols) {

    var stylesheet = element.stylesheet([
      element.style(".variable-assignment", {
        "display": "inline",
      }),
    ])

    var renderVariableAssignment = element.template(
      ".variable-assignment",
      function(expression, tree, options) {
        this.id = expression.id

        if (!expression.variableName) {
          throw new Error("can't render a variable assignment without a variable name. Expression: "+JSON.stringify(expression, null, 2))
        }

        this.addChild(symbols.var)

        var nameSpan = element("span",
          expression.variableName
        )

        makeItEditable(
          nameSpan,
          tree.asBinding().methodCall("getProperty").withArgs("variableName", expression.id),
          tree.asBinding().methodCall("setProperty").withArgs("variableName", expression.id)
        )

        this.addChild(nameSpan)

        this.addChild(symbols.equals)

        if (!expression.expression.kind) {
          throw new Error("rhs of assignment is fucked: "+JSON.stringify(expression, null, 2))
        }

        var rhs = expressionToElement(
          expression.expression, tree, options)

        // tree.setParent(rhs.id, expression)

        rhs.addSelector(".rhs")

        this.addChild(rhs)
      }
    )

    renderVariableAssignment.defineOn =function(bridge) {
      bridge.addToHead(stylesheet)
    }

    return renderVariableAssignment
  }
)



library.define(
  "render-object-literal",
  ["web-element", "render-key-pair"],
  function(element, keyPair) {
    return function() {
      return element("[[[ object ]]]")
    }
    return element.template(
      ".object-literal",
      function objectLiteralRenderer(expression, tree, options) {
        this.id = expression.id

        for(var key in expression.valuesByKey) {

          var valueExpression = expression.valuesByKey[key]

          var pair = tree.addKeyPair(expression, key, valueExpression)

          var el = keyPair(
            pair,
            tree
          )

          this.children.push(el)
        }
      }
    )
     
  }
)



library.define(
  "render-key-pair",
  ["web-element", "make-it-editable", "./expression-to-element"],
  function(element, makeItEditable, expressionToElement) {

    var keyPair = element.template(
      ".key-pair",
      function keyPairRenderer(pairexpression, tree, options) {
        this.id = pairExpression.id

        var key = pairExpression.key

        var textElement = element(
          "span",
          element.raw(key)
        )

        var keyButton = element(
          ".code-button.key",
          [
            textElement,
            element("span", ":")
          ]
        )

        makeItEditable(
          keyButton,
          tree.asBinding().methodCall("getKeyName").withArgs(pairExpression.id),
          tree.asBinding().methodCall("onKeyRename").withArgs(pairExpression.id),
          {updateElement: textElement}
        )

        this.children.push(keyButton)

        var valueExpression = pairExpression.objectExpression.valuesByKey[key]

        var valueElement =
          expressionToElement(
            valueexpression, tree, options)

        tree.setKeyValue(pairExpression, valueExpression, valueElement)

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
      ".code-button.variable-reference",
      function variableReferenceRenderer(expression) {
        this.children.push(element.raw(
          expression.variableName
        ))
      }
    )

  }
)


library.define(
  "render-array-literal",
  ["web-element", "./expression-to-element"],
  function(element, expressionToElement) {

    return element.template(
      ".array-literal", // temporarily not .indenter until we can see what that would need to look like.

      function arrayLiteralRenderer(expression, tree, options) {
        this.id = expression.id

        var items = expression.items

        this.children = items.map(itemToElement)

        function itemToElement(item) {
          return element(
            ".array-item",
            expressionToElement(item, tree, options)
          )
        }
      }
    )


  }
)



module.exports = library.export(
  "renderers",
  ["web-element", "symbols"].concat(rendererModules),
  function(element, symbols, renderFunctionCall, etc) {
    var singletons = Array.prototype.slice.call(arguments)

    function defineOn(bridge) {
      singletons.forEach(function(x) {
        if (x.defineOn) {
          x.defineOn(bridge)
        }
      })

      bridge.addToHead(symbols.stylesheet)
    }

    return defineOn
  }
)


