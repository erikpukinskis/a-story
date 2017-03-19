var library = require("module-library")(require)

require("./actions")

var expressionKinds = ["function call","array literal","function literal","string literal","number literal","empty expression","variable assignment","variable reference","object literal","return statement"]

var rendererModules = expressionKinds.map(toModuleName)

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
      "arrayDelimiter": element(".array-delimiter", ","),
      "emptyLine": element(".break"),
    }

    var stylesheet = element.stylesheet([

      element.style(".comma-symbol", {
        "display": "inline-block",
        "font-weight": "bold",
      }),

      element.style(".array-delimiter", {
        "display": "inline-block",
        "font-weight": "bold",
        "color": colors.electric,
        "margin-left": "0.5em",
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

      element.style(".break", {
        "height": "0.75em",
        "width": "1.5em",
        "background": "#fff"
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
  ["web-element", "./expression-to-element", "make-it-editable", "symbols"],
  function(element, expressionToElement, makeItEditable, symbols) {


    var stylesheet = element.stylesheet([
      element.style(".function-call", {
        "display": "inline",
      }),

      element.style(".function-reference", {
        "display": "inline",
      }),

      element.style(".arguments", {
        "margin-left": "1em",
      })
    ])

    var renderFunctionCall = element.template(
      ".function-call",
      function functionCallRenderer(expression, tree, options) {
        this.id = expression.id

        var label = element(".function-reference", expression.functionName)

        makeItEditable(
          label,
          tree.asBinding().methodCall("getProperty").withArgs("functionName", expression.id),
          tree.asBinding().methodCall("setProperty").withArgs("functionName", expression.id)
        )

        this.addChildren(label, symbols.openArguments)

        options.addSymbolsHere = this

        var args = element(
          ".arguments")

        for(var i=0; i<expression.arguments.length; i++) {

          var arg = expression.arguments[i]

          if (i > 0) {
            options.addSymbolsHere.addChild(symbols.comma)
            args.addChild(symbols.br)
          }

          var argEl = expressionToElement(arg, tree, options)

          args.addChild(argEl)
        }


        options.addSymbolsHere.addChild(symbols.closeArguments)

        this.addChild(args)
      }
    )

    renderFunctionCall.defineOn = function(bridge) {
      bridge.addToHead(stylesheet)
    }

    return renderFunctionCall
  }
)



library.define(
  "render-string-literal",
  ["web-element", "make-it-editable"],
  function(element, makeItEditable) {

    var renderStringLiteral = element.template(
      "span",
      function stringLiteralRenderer(expression, tree, options) {
        this.id = expression.id

        if (!expression.string || !expression.string.replace) {
          throw new Error("Expected expression to have a string attribute: "+JSON.stringify(expression, null, 2))
        }

        var escaped = expression.string.replace(/\</g, "&lt;").replace(/\>/g, "&gt;")

        this.addChild(element.raw(escaped))

        makeItEditable(
          this,
          tree.asBinding().methodCall("getProperty").withArgs("string", expression.id),
          tree.asBinding().methodCall("setProperty").withArgs("string", expression.id)
        )

        options.addSymbolsHere = this

      }
    )

    return renderStringLiteral
  }
)




library.define(
  "render-number-literal",
  ["web-element", "make-it-editable"],
  function(element, makeItEditable) {

    var stylesheet = element.stylesheet([
      element.style(".number-literal", {
        "display": "inline",
      }),
    ])

    var renderNumberLiteral = element.template(
      ".number-literal",
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

        options.addSymbolsHere = this

      }
    )

    renderNumberLiteral.defineOn = function(bridge) {
      bridge.addToHead(stylesheet)
    }

    return renderNumberLiteral
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
        "color": colors.black,
        "line-height": "1.2em",
        "display": "inline",
      }),

      element.style(".function-name", {
        "color": colors.gunmetal,
        "display": "inline",
        "margin-left": "0.5em",
      }),

      element.style(".function-signature", {
        "color": colors.gunmetal,
        "margin-left": "1em",
        "margin-bottom": "0.5em",

        ".comma-symbol": {
          "color": colors.gunmetal,
          "font-weight": "bold",
        }
      }),

      element.style(".function-body", {
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


        var body = element(".function-body")

        for(var i=0; i<expression.body.length; i++) {
          if (i > 0) {
            body.addChild(symbols.emptyLine)
          }

          var child = renderChild(expression, tree, options, expression.body[i])

          body.addChild(child)
        }

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

        this.addChild(rhs)
      }
    )

    var stylesheet = element.stylesheet([
      element.style(".render-statement", {
        "display": "inline",
      }),

      element.style(".rhs", {
        "margin-left": "1em",
        "display": "block",
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
  ["web-element", "render-key-pair", "symbols", "colors"],
  function(element, renderKeyPair, symbols, colors) {

    var stylesheet = element.stylesheet([
      element.style(".object-literal", {
        "display": "inline",
      }),

      element.style(".object-pairs", {
        // "margin-left": "1em",
      }),

      element.style(".object-key", {
        "font-weight": "bold",
        "color": colors.electric,
      }),

      element.style(".key-pair", {
        "display": "inline",
      }),
    ])

    var renderObjectLiteral = element.template(
      ".object-literal",
      function(expression, tree, options) {
        this.id = expression.id

        options.addSymbolsHere.addChild(symbols.openObject)

        var pairs = element(".object-pairs")

        var first = true

        for(var key in expression.valuesByKey) {

          var valueExpression = expression.valuesByKey[key]

          if (!first) {
            pairs.addChildren(symbols.br)
          }
          first = false

          var pair = tree.addKeyPair(expression, key, valueExpression)

          var el = renderKeyPair(pair, tree, options)

          pairs.addChild(el)
        }

        this.addChild(pairs)

        options.addSymbolsHere.addChild(symbols.closeObject)
      }
    )

    renderObjectLiteral.defineOn = function(bridge) {
      bridge.addToHead(stylesheet)
    }
     
    return renderObjectLiteral
  }
)



library.define(
  "render-key-pair",
  ["web-element", "make-it-editable", "./expression-to-element", "symbols"],
  function(element, makeItEditable, expressionToElement, symbols) {

    var renderKeyPair = element.template(
      ".key-pair",
      function(pairExpression, tree, options) {
        this.id = pairExpression.id

        var key = pairExpression.key

        var keyEl = element(
          "span.object-key",
          element.raw(key)
        )

        makeItEditable(
          keyEl,
          tree.asBinding().methodCall("getKeyName").withArgs(pairExpression.id),
          tree.asBinding().methodCall("onKeyRename").withArgs(pairExpression.id)
        )

        this.addChildren(keyEl, symbols.colon)

        var valueExpression = pairExpression.objectExpression.valuesByKey[key]

        var valueElement =
          expressionToElement(
            valueExpression, tree, options)

        tree.setKeyValue(pairExpression, valueExpression, valueElement)

        valueElement.classes.push("key-value")

        this.addChild(valueElement)

        this.startEditing = function() {
          eval(keyButton.attributes.onclick)
        }
      }

    )

    return renderKeyPair
  }
)

library.define(
  "render-variable-reference",
  ["web-element"],
  function(element) {

    var stylesheet = element.stylesheet([
      element.style(".variable-reference", {
        "display": "inline",
      }),
    ])

    var renderVariableReference = element.template(
      ".variable-reference",
      function(expression, tree, options) {
        this.addChild(element.raw(
          expression.variableName
        ))

        options.addSymbolsHere = this
      }
    )

    renderVariableReference.defineOn = function(bridge) {
      bridge.addToHead(stylesheet)
    }

    return renderVariableReference
  }
)


library.define(
  "render-array-literal",
  ["web-element", "./expression-to-element", "symbols"],
  function(element, expressionToElement, symbols) {

    var stylesheet = element.stylesheet([
      element.style(".array-literal", {
        "border-left": "0.15em solid #a9a9ff",
        "padding-left": "0.5em",
      }),
    ])

    var renderArrayLiteral = element.template(
      ".array-literal",
      function(expression, tree, options) {
        this.id = expression.id

        options.addSymbolsHere.addChild(symbols.openArray)

        for (var i=0; i< expression.items.length; i++) {

          if (i > 0) {
            options.addSymbolsHere.addChild(symbols.arrayDelimiter)

            this.addChild(symbols.br)
          }

          var item = expressionToElement(expression.items[i], tree, options)

          this.addChildren(item)
        }

        options.addSymbolsHere.addChild(symbols.closeArray)
      }
    )

    renderArrayLiteral.defineOn = function(bridge) {
      bridge.addToHead(stylesheet)
    }

    return renderArrayLiteral
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


