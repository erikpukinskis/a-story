// GLOBAL API SHIT

var cachedBody
function body() {
  if (!cachedBody) {
    cachedBody = document.querySelector("body")
  }
  return cachedBody
}

function addToDom(html) {
  body().innerHTML = body().innerHTML + html
}




// OUR PROGRAM

var program = {
  kind: "function call",
  functionName: "using",
  arguments: [
    {
      kind: "array literal",
      items: [
        stringLiteralJson("element"),
        stringLiteralJson("bridge-route")
      ]
    },
    {
      kind: "function literal",
      argumentNames: ["element", "bridgeRoute"],
      body: [
        {//////////
          kind: "variable assignment",
          variableName: "page",
          expression: {
            kind: "function call",
            functionName: "element",
            arguments: [
              stringLiteralJson("sup family"),
              // stringLiteralJson("body"),
              {
                kind: "function call",
                functionName: "element.style",
                arguments: [
                  {
                    kind: "object literal",
                    object:
                      {
                    "background": stringLiteralJson("lightgray"),
                    "color": stringLiteralJson("burlywood"),
                    "font-size": stringLiteralJson("30pt"),
                    "font-family": stringLiteralJson("Georgia")
                      }
                  }
                ]
              }
            ]
          }
        }, /////////////////
        {
          kind: "function call",
          functionName: "bridgeRoute",
          arguments: [
            stringLiteralJson("/"),
            {
              kind: "function literal",
              argumentNames: ["bridge"],
              body: [
            {
              kind: "function call",
              functionName: "bridge.sendPage",
              arguments: [
                {
                  kind: "variable reference",
                  variableName: "page"
                }
              ]
            }
              ]
            }
          ]
        }//////////////////
      ]
    }
  ]
}

function stringLiteralJson(string) {
  return {
    kind: "string literal",
    string: string
  }
}




// RENDERERS

var renderFunctionCall = element.template(
  ".function-call",
  function(expression) {

    var button = element(
      ".button.depth-1.function-call-name",
      expression.functionName
    )

    makeEditable(
      button,
      get.bind(null, expression, "functionName"),
      set.bind(null, expression, "functionName")
    )

    this.children.push(button)

    var elements = argumentsToElements(
      expression.arguments
    )

    this.children = this.children.concat(elements)
  }
)

function get(object, key) {
  return object[key]
}

function set(object, key, value) {
  object[key] = value
  runIt(program)
}

function argumentsToElements(args) {
  var container = element(
    ".function-call-args"
  )

  for(var i=0; i<args.length; i++) {

    var expression = args[i]
    var isFunctionCall = expression.kind == "function call"
    var arg = expressionToElement(expression)

    arg.classes.push(
      "function-argument")

    if (isFunctionCall) {
      arg.classes.push("call-in-call")
    }

    container.children.push(arg)
  }

  return container
}




var stringLiteral = element.template(
  ".button.literal.depth-2",
  function(expression) {

    var stringElement = element("span", element.raw(expression.string))

    this.children.push(
      element("span", "\""),
      stringElement,
      element("span", "\"")
    )

    makeEditable(
      this,
      get.bind(null, expression, "string"),
      set.bind(null, expression, "string"),
      {updateElement: stringElement}
    )

  }
)




var functionLiteral =
  element.template(
    ".function-literal.depth-2",
    function(expression) {
      var children = this.children

      children.push(
        element(
          ".button.depth-2",
          "function"
        )
      )

      children.push(argumentNames(
        expression.argumentNames
      ))

      children.push(
        functionLiteralBody(
          expression.body
        )
      )

    }
   )

function argumentNames(names) {
  return element(
    ".function-argument-names",
    names.map(argumentName)
  )
}

function argumentName(name) {
  return element(
    ".button.argument-name",
    element.raw(name)
  )
}

var functionLiteralBody = element.template(
  ".function-literal-body",
  function(lines) {

    this.children = lines.map(
      function(line) {
        return element(
          expressionToElement(line),
          ".function-literal-line"
        )
      }
    )

  }
)




var variableAssignment = element.template(
  ".variable-assignment",
  function(expression) {
    var lhs = element(
      ".button.variable-name",
      [
        element("span", "var&nbsp;"),
        element("span",
          expression.variableName
        ),
        element("span", "&nbsp;=")
      ]
    )

    this.children.push(lhs)
    this.children.push(
      expressionToElement(
        expression.expression
      )
    )
  }
)



var indexedById = {}
var specificity = 3

function barCode(expression) {
  var id = expression.id

  if (!id) {
    do {
      var id = Math.random().toString(36).substr(2, specificity)
    } while(indexedById[id] && specificity++)

    expression.id = id
    indexedById[id] = expression
  }

  return id
}

barCode.scan = function(id) {
  return indexedById[id]
}




var objectLiteral = element.template(
  ".object-literal",
  function(expression) {

    var object = expression.object

    for(var key in object) {
      var pair = keyPair(
        key,
        object[key],
        onKeyRename.bind(null, object)
      )

      this.children.push(pair)
    }

    var id = barCode(expression)

    this.classes.push("container-"+id)

    this.attributes.onclick =functionCall(addGhostBabyKeyPair).withArgs(
        id,
        functionCall.raw("event")
      ).evalable()

  }
)

function onKeyRename(object, newKey, oldKey) {
  var valueExpression = object[oldKey]
  if (!valueExpression) {
    debugger
  }
  object[newKey] = object[oldKey]
  delete object[oldKey]
  runIt(program)
}

var ghostBabyKeyPairs = {}

function addGhostBabyKeyPair(id, el) {

  if (ghostBabyKeyPairs[id]) {
    return
  }

  ghostBabyKeyPairs[id] = true

  var object = barCode.scan(id).object

  var expression = stringLiteralJson("")

  var newPair = keyPair(
    "",
    expression,
    function onKeyText(newKey, oldKey) {
      var value = object[oldKey]

      if (!value) {
        object[oldKey] = expression
      }

      onKeyRename(object, newKey, oldKey)

      if (!ghostBabyKeyPairs[id]) { return}

      ghostBabyKeyPairs[id] = false

      var el = document.querySelector(".ghost-baby-key-pair-"+id)

      if (!el) { return }

      el.classList.remove("ghost-baby-key-pair")
      el.classList.remove("ghost-baby-key-pair-"+id)

    }
  )

  newPair.classes.push("ghost-baby-key-pair")
  newPair.classes.push("ghost-baby-key-pair-"+id)

  var container = document.querySelector(".container-"+id)

  container.innerHTML = container.innerHTML + newPair.html()
}

function renameKey(oldKey, newKey) {
  this[newKey] = this[oldKey]
  delete this[oldKey]
}

var keyPair = element.template(
  ".key-pair",
  function(key, valueExpression, onKeyRename) {

    var textElement = element(
      "span",
      element.raw(key)
    )

    var keyButton = element(
      ".button.key.depth-2",
      [
        textElement,
        element("span", ":")
      ]
    )

    makeEditable(
      keyButton,
      function () { return key},
      onKeyRename,
      {updateElement: textElement}
    )

    this.children.push(keyButton)

    this.children.push(
      expressionToElement(valueExpression)
    )
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
  ".array-literal",
  function(expression) {
    this.children = expression.items.map(itemToElement)
  }
)

function itemToElement(item) {
  return element(
    ".array-item",
    expressionToElement(item)
  )
}


// HUMAN WORDS

function makeEditable(button, getValue, setValue, options) {
  button.assignId()

  if (options) {
    var updateElement = options.updateElement
  } else {
    var updateElement = button
  }

  getters[button.id] = getValue
  setters[button.id] = setValue

  updateElement.classes.push("editable-"+button.id+"-target")

  button.classes.push("editable-"+button.id)

  button.attributes.onclick = functionCall(edit).withArgs(button.id).evalable()
}

var getters = {}
var setters = {}

function edit(id) {

  var getText = getters[id]
  var setText = setters[id]

  var el = document.querySelector(
    ".editable-"+id)
  var toUpdate = document.querySelector(
    ".editable-"+id+"-target")

  el.classList.add("being-edited-by-human")

  var oldValue = getText()

  streamHumanInput(
    oldValue,
    function onChange(value) {
      toUpdate.innerHTML = value
      setText(value, oldValue)
      oldValue = value
    },
    function done() {
      el.classList.remove("being-edited-by-human")
    }
  )

}

var humanInputListener
var tapOutCallback

function streamHumanInput(startingText, callback, done) {

  humanInputListener = notifyOnChange
  .bind({
    oldText: startingText,
    callback: callback
  })

  var input = getInputElement()
  var tapCatcher = document.getElementById("tap-catcher")

  tapCatcher.style.display = "block"
  input.value = startingText
  input.focus()

  tapOutCallback = done
}

function onTapOut(event) {
  if (event.target.id != "tap-catcher") {
    return
  }

  event.target.style.display = "none"

  tapOutCallback()
}
function notifyOnChange(newText) {
  if (newText == this.oldText) {return}
  this.oldText = newText
  this.callback(newText)
}

function getInputElement() {
  return document.querySelector(".human-words-and-stuff")
}

// These are the actual element generators that have to be included on the page:

var humanWords = element.template(
  "input.human-words-and-stuff",
  {
    onKeyUp: "humanInputListener(this.value)"
  }
)

function tapCatcher(child, callback) {

  var style = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: none;"

  var catcher = element(
    {
      id: "tap-catcher",
      style: style,
      onclick: functionCall(onTapOut).withArgs(functionCall.raw("event")).evalable()
    },
    child
  )

  return catcher
}




// DRAW THE PROGRAM

var renderers = {
  "function call": renderFunctionCall,
  "function literal": functionLiteral,
  "variable reference": variableReference,
  "variable assignment": variableAssignment,
  "object literal": objectLiteral,
  "array literal": arrayLiteral,
  "string literal": stringLiteral
}

function expressionToElement(expression) {
  return traverseExpression(expression, renderers)
}

function traverseExpression(expression, handlers) {

  var kind = expression.kind
  var handler = handlers[kind]

  if (typeof handler != "function") {
    throw new Error("The object you provided had no "+kind+" handler, which is the kind of your expression: "+JSON.stringify(expression))
  }

  return handler(expression)
}

function drawProgram(expression) {

  var program = element(
    ".program",
    [
      element(".output"),
      expressionToElement(
  expression),
      element(".logo", "EZJS")
    ]
  )

  var input = tapCatcher(
    humanWords(),
    function() {
      console.log("done")
    }
  )

  var page = element([program, input])

  addToDom(page.html())
}





// RUN THE PROGRAM

function pad(str) {
  var lines = str.split("\n")
  return lines.map(function(line) {
    return "  "+line
  }).join("\n")
}

var codeGenerators = {
  "function call": function(expression) {
    var args = expression.arguments.map(
      expressionToJavascript
    ).join(",\n")
    return expression.functionName+"(\n"+pad(args)+"\n)"
  },
  "array literal": function(expression) {
    var items = expression.items.map(
      expressionToJavascript
    )
    return "[\n"+pad(items.join(",\n"))+"\n]"
  },
  "function literal": function(expression) {
    var names = expression.argumentNames.join(", ")
    var lines = expression.body.map(
      expressionToJavascript
    )
    var code = "function("
      +names
      +") {\n"
      +pad(lines.join("\n"))
      +"\n}"

    return code
  },
  "string literal": function(expression) {
    return JSON.stringify(expression.string)
  },
  "variable assignment": function(expression) {
    return "var "
      +expression.variableName
      +" = "
      +expressionToJavascript(expression.expression)
  },
  "variable reference": function(expression) {
    return expression.variableName
  },
  "object literal": function(expression) {
    var keyPairs = []

    for(var key in expression.object) {
      keyPairs.push(
        "  "
        +JSON.stringify(key)
        +": "
        +expressionToJavascript(expression.object[key])
      )
    }
    return "{\n"+keyPairs.join(",\n")+"\n}"
  }
}

function runIt(program) {
  var js = expressionToJavascript(program)

  js = js + "\n//# sourceURL=home-page.js"

  eval(js)
}

function expressionToJavascript(expression) {
  return traverseExpression(
    expression,
    codeGenerators
  )
}

var library = new Library()
var using = library.using.bind(library)
library.define("element", function () {
  return element
})

library.define("bridge-route", function() {
  return function(path, handler) {
    var bridge = {
      sendPage: function(element) {
        var out = document.querySelector(".output")
        out.innerHTML = element.html()
      }
    }

    handler(bridge)
  }
})







// BOTTOM OF THE FILE

drawProgram(program)

runIt(program)



