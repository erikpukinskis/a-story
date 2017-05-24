var library = require("module-library")(require)

require("./actions")

var expressionKinds = ["function call","array literal","function literal","string literal","number literal","empty expression","variable assignment","variable reference","object literal","return statement"]

var rendererModules = expressionKinds.map(toModuleName)

function toModuleName(kind) {
  return "render-"+kind.replace(" ", "-")
}


library.define("theme", function() {
  return {
    canary: "#f5df2f",
    gunmetal: "#bec9d6",
    black:  "#779", //"#557",
    electric: "#a9a9ff",
    borderWidth: "2pt",
    tab: "0.5em",
  }
})


library.define("symbols",
  ["web-element", "theme"],
  function(element, theme) {

    var elements = {
      "br": element("br"),
      "comma": element(".comma-symbol", ", "),
      "colon": element(".colon-symbol", ":"),
      "equals": element(".equals-symbol", "="),
      "var": element(".variable-symbol", "var"),
      "return": element(".return-symbol", "return"),
      "function": element(".function-symbol", "function "),
      "openFunction": element(".scope-symbol.symbol", "{"),
      "closeFunction": element(".scope-symbol.symbol", "}"),
      "openObject": element(".object-delimiter.symbol", "{"),
      "closeObject": element(".object-delimiter.symbol", "}"),
      "openArguments": element(".call-symbol.symbol", "("),
      "closeArguments": element(".call-symbol.symbol", ")"),
      "openArray": element(".array-symbol.symbol", "["),
      "closeArray": element(".array-symbol.symbol", "]"),
      "arrayDelimiter": element(".array-delimiter", ","),
      "emptyLine": element(".break"),
    }

    var stylesheet = element.stylesheet([

      // element.style(".symbol", {
      //   "display": "none !important",
      // }),

      // element.style(".function-body, .array-literal", {
      //   "border-left": "none !important",
      // }),

      element.style(".comma-symbol", {
        "display": "inline-block",
        "margin-left": theme.tab,
        "font-weight": "bold",
        "font-size": "1.25em",
        "line-height": "0.8em",
        "color": theme.gunmetal,
      }),

      element.style(".array-delimiter", {
        "display": "inline-block",
        "font-weight": "bold",
        "font-size": "1.25em",
        "line-height": "0.8em",
        "color": "#808eff",
        "margin-left": "0.4em",
      }),

      element.style(".colon-symbol", {
        "color": theme.electric,
        "display": "inline-block",
        "font-weight": "bold",
        "margin": "0 "+theme.tab,
      }),

      element.style(".equals-symbol", {
        "color": theme.black,
        "display": "inline-block",
        "padding-left": "0.5em",
        "font-weight": "bold",
      }),

      element.style(".variable-symbol", {
        "color": theme.black,
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
        "color": theme.gunmetal,
        "display": "inline-block",
        "font-weight": "bold",
      }),


      element.style(".scope-symbol", {
        "color": theme.canary,
        "display": "inline-block",
        "padding-left": "0.5em",
        "font-weight": "bold",
      }),

      element.style(".object-delimiter", {
        "color": theme.electric,
        "display": "inline-block",
        "padding-left": "0.5em",
        "font-weight": "bold",
      }),

      element.style(".call-symbol", {
        "color": theme.gunmetal,
        "display": "inline-block",
        "padding-left": "0.5em",
        "font-weight": "bold",
      }),

      element.style(".array-symbol", {
        "color": theme.electric,
        "display": "inline-block",
        "padding-left": "0.5em",
        "font-weight": "bold",
      }),

      element.style(".break", {
        "height": "0.75em",
        "width": "1.5em",
        "visibility": "hidden",
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
      function renderEmptyExpression(expression, tree, bridge, options) {


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
      function(expression) {
        this.addChild(expression.source.trim())
      }
    )

  }
)


library.define(
  "render-function-call",
  ["web-element", "./expression-to-element", "make-it-editable", "symbols", "theme"],
  function(element, expressionToElement, makeItEditable, symbols, theme) {


    var stylesheet = element.stylesheet([
      element.style(".function-call", {
        // "display": "block",
      }),

      element.style(".function-reference", {
        "display": "inline",
      }),

      element.style(".arguments", {
        "margin-left": theme.tab,
      })
    ])

    var renderFunctionCall = element.template(
      ".function-call",
      function functionCallRenderer(expression, tree, bridge, options) {

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
          }

          var argEl = expressionToElement(bridge, arg, tree, options)

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
      ".string-literal",
      function stringLiteralRenderer(expression, tree, bridge, options) {

        if (typeof expression.string != "string") {
          throw new Error("Expected expression to have a string attribute: "+JSON.stringify(expression, null, 2))
        }

        var escaped = expression.string.replace(/\</g, "&lt;").replace(/\>/g, "&gt;")

        var textEl = element("span.string", escaped)

        makeItEditable(
          textEl,
          bridge.remember("render-expression/getExpressionProperty").withArgs(tree.id, expression.id, "string"),
          bridge.remember("render-expression/setExpressionProperty").withArgs(tree.id, expression.id, "string")
        )

        this.addChild(textEl)

        options.addSymbolsHere = this

      }
    )

    var stylesheet = element.stylesheet([
      element.style(".string-literal", {
        "display": "inline",
      }),

      element.style(".string-literal .string", {
        // "background-color": "#f7f7f7", //"#fffde6",
        "display": "inline",
        "border-bottom": "1px solid #aaa",
        "line-height": "1.2em",
        // "color": "#496953",
      }),

      element.style(".selected .string", {
        "border-bottom-color": "#ade4ff",
      }),
    ])

    renderStringLiteral.defineOn = function(bridge) {
      bridge.addToHead(stylesheet)
    }

    return renderStringLiteral
  }
)




library.define(
  "render-number-literal",
  ["web-element", "make-it-editable"],
  function(element, makeItEditable) {

    var stylesheet = element.stylesheet([
      element.style(".number-literal", {
        // "display": "inline",
      }),
    ])

    var renderNumberLiteral = element.template(
      "span.number-literal",
      function numberLiteralRenderer(expression, tree, bridge, options) {

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
  "render-argument-name",
  ["web-element", "make-it-editable"],
  function(element, makeItEditable) {

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

    return renderArgumentName
  }
)


library.define(
  "render-function-literal",
  ["web-element", "make-it-editable", "symbols", "theme", "expression-to-element", "render-argument-name"],
  function(element, makeItEditable, symbols, theme, expressionToElement, renderArgumentName) {

    var previous

    function renderChild(parent, tree, bridge, options, child) {

      // do we need this after we pull fillEmptyFunction in here?

      child.role = "function literal line"

      var el = expressionToElement(bridge, child, tree, options)

      if (child.kind == "empty expression") {

        var addIt = addLine.asBinding().withArgs(
          tree.id,
          child.id,
          child.id,
          "inPlaceOf"
        )
        
        el.attributes.onclick = getExpression.withArgs(addIt).evalable()
      }

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
        "color": theme.black,
        "line-height": "1.2em",
        "display": "block",
      }),

      element.style(".function-literal-line", {
        "margin-bottom": "0.5em",
        "display": "block",
      }),

      element.style(".function-name", {
        "color": theme.gunmetal,
        "display": "inline",
        "margin-left": "0.5em",
      }),

      element.style(".function-signature", {
        "color": theme.gunmetal,
        "margin-left": "1em",
        "margin-bottom": "0.5em",

        ".no-arguments": {
          "display": "inline",
          "margin-left": "0em",
        },

        ".comma-symbol": {
          "color": theme.gunmetal,
          "font-weight": "bold",
        }
      }),

      element.style(".selected .function-signature, .selected .function-symbol, .selected .function-name", {
        "color": "#99bbe4",
      }),

      element.style(".function-body", {
        "margin-left": "1em",
        "border-left": theme.borderWidth+" solid "+theme.canary,
        "padding-left": theme.tab,
      }),
    ])

    var renderFunctionLiteral =  element.template(
      ".function-literal",
      function functionLiteralRenderer(expression, tree, bridge, options) {

        var moduleSymbol = element("module", element.style({
          "font-weight": "bold",
          "display": "inline-block",
          "margin-right": "0.5em",
          "color": theme.gunmetal,
        }))

        if (expression == tree.root()) {
          this.addChild(moduleSymbol)
        }

        this.addChild(symbols.function)

        if (expression.functionName) {
          this.addChild(element(".function-name", expression.functionName))
        }

        options.addSymbolsHere = this

        options.addSymbolsHere.addChild(symbols.openArguments)

        var sig = element(
          ".function-signature")

        if (expression.argumentNames.length == 0) {
          sig.addSelector(".no-arguments")
        }

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
          // if (i > 0) {
          //   body.addChild(symbols.emptyLine)
          // }

          var child = renderChild(expression, tree, bridge, options, expression.body[i])

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
      function returnStatementRenderer(expression, tree, bridge, options) {

        this.addChild(symbols.return)

        var rhs = expressionToElement(bridge, expression.expression, tree, options)
        rhs.addSelector(".returned-expression")
        this.addChild(rhs)
      }
    )

    var stylesheet = element.stylesheet([
      element.style(".render-statement", {
        "display": "inline",
      }),

      element.style(".returned-expression", {
        "display": "inline",
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
  ["web-element", "./expression-to-element", "make-it-editable", "symbols", "theme"],
  function(element, expressionToElement, makeItEditable, symbols, theme) {

    var stylesheet = element.stylesheet([
      element.style(".variable-assignment", {
        "display": "block",
      }),

      element.style(".rhs", {
        "margin-left": theme.tab,
      })
    ])

    var renderVariableAssignment = element.template(
      ".variable-assignment",
      function(expression, tree, bridge, options) {

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

        var rhs = expressionToElement(bridge, 
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
  ["web-element", "render-key-pair", "symbols", "theme"],
  function(element, renderKeyPair, symbols, theme) {

    var stylesheet = element.stylesheet([
      element.style(".object-literal", {
        "display": "inline",
      }),

      element.style(".object-pairs", {
        // "margin-left": "1em",
      }),

      element.style(".object-key", {
        "font-weight": "bold",
        "color": theme.electric,
      }),

      element.style(".key-pair", {
        "display": "inline",
      }),
    ])

    var renderObjectLiteral = element.template(
      ".object-literal",
      function(expression, tree, bridge, options) {

        options.addSymbolsHere.addChild(symbols.openObject)

        var pairs = element(".object-pairs")

        var first = true

        for(var i=0; i<expression.keys.length; i++) {
          var key = expression.keys[i]
          var pairId = expression.pairIds[i]
          var valueExpression = expression.values[i]

          if (!first) {
            pairs.addChildren(symbols.br)
          }
          first = false

          var el = renderKeyPair(bridge, pairId, key, valueExpression, tree, options)

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
      function(bridge, pairId, key, valueExpression, tree, options) {

        var keyEl = element(
          "span.object-key",
          element.raw(key)
        )

        makeItEditable(
          keyEl,
          tree.asBinding().methodCall("getKeyName").withArgs(pairId),
          tree.asBinding().methodCall("onKeyRename").withArgs(pairId)
        )

        this.addChildren(keyEl, symbols.colon)

        var valueElement =
          expressionToElement(bridge, 
            valueExpression, tree, options)

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
      function(expression, tree, bridge, options) {
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
  ["web-element", "./expression-to-element", "symbols", "theme"],
  function(element, expressionToElement, symbols, theme) {

    var stylesheet = element.stylesheet([
      element.style(".array-literal", {
        "border-left": theme.borderWidth+" solid #a9a9ff",
        "padding-left": theme.tab,
      }),

      element.style(".array-item", {
        "display": "block",
      })
    ])

    var renderArrayLiteral = element.template(
      ".array-literal",
      function(expression, tree, bridge, options) {

        options.addSymbolsHere.addChild(symbols.openArray)

        for (var i=0; i< expression.items.length; i++) {

          var itemExpression = expression.items[i]

          var itemEl = element(".array-item")

          if (i > 0) {
            options.addSymbolsHere.addChild(symbols.arrayDelimiter)
          }

          var expressionEl = expressionToElement(bridge, itemExpression, tree, options)

          itemEl.id = itemExpression.id
          delete expressionEl.id

          itemEl.addChild(expressionEl)

          this.addChild(itemEl)

          options.addSymbolsHere = itemEl
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

    return {defineOn: defineOn}
  }
)


