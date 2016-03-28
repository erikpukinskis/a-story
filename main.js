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

var indexedById = {}
var lastInteger = 1999

function barCode(expression) {
  var id = expression.id

  if (!id) {
    lastInteger += 1
    id = lastInteger.toString(36)
    expression.id = id
    indexedById[id] = expression
  }

  return id
}

barCode.scan = function(id) {
  return indexedById[id]
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

    var expressionId = barCode(expression)

    makeEditable(
      button,
      functionCall(getProperty).withArgs("functionName", expressionId),
      functionCall(setProperty).withArgs("functionName", expressionId)
    )

    this.children.push(button)

    this.attributes.onclick = functionCall(addGhostBabyArgument).withArgs(expressionId, functionCall.raw("event")).evalable()

     var container = element(
      ".function-call-args.container-"+expressionId)

    container.children =
      argumentsToElements(
        expression.arguments
      )

    this.children.push(container)
  }
)

function getProperty(property, expressionId) {
  var expression = barCode.scan(expressionId)
  return expression[property]
}

function setProperty(property, expressionId, newValue, oldValue) {
  var expression = barCode.scan(expressionId)
  expression[property] = newValue
  runIt(program)
}

function argumentsToElements(args) {

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
      functionCall(getProperty).withArgs("string", barCode(expression)),
      functionCall(setProperty).withArgs("string", barCode(expression)),
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







var objectLiteral = element.template(
  ".object-literal",
  function(expression) {

    var object = expression.object

    for(var key in object) {
      var pairExpression = {
        key: key,
        expression: expression
      }

      var el = keyPair(
        pairExpression,
        functionCall(onKeyRename).withArgs(barCode(pairExpression))
      )

      this.children.push(el)
    }

    this.classes.push("container-"+barCode(expression))

    this.attributes.onclick =functionCall(addGhostBabyKeyPair).withArgs(
        barCode(expression),
        functionCall.raw("event")
      ).evalable()

  }
)

function onKeyRename(pairId, newKey, oldKey) {
  var pairExpression = barCode.scan(pairId)
  var object = pairExpression.expression.object

  pairExpression.key = newKey
  object[newKey] = object[oldKey]

  delete object[oldKey]
  runIt(program)
}








// GHOST BABIES

var expressionHasGhostBaby = {}

function addGhost(expressionId, el) {
  if (expressionHasGhostBaby[expressionId]) {
    return
  }

  expressionHasGhostBaby[expressionId] = true

  var container = document.querySelector(".container-"+expressionId)

  container.innerHTML = container.innerHTML + el.html()
}

// GHOST BABY MAKERS

function addGhostBabyArgument(expressionId, event) {
  console.log("arg-"+expressionId, event.target )
  var el = element(".button.depth-2.ghost-baby-arg", " + ")

  addGhost(expressionId, el)
}

function addGhostBabyKeyPair(expressionId, event) {

  var expression = barCode.scan(expressionId)

  var pair = {
    kind: "key pair",
    key: "",
    expression: expression,
    valueExpression: stringLiteralJson("")
  }

  var pairId = barCode(pair)

  var el = keyPair(
    pair,
    functionCall(onNewObjectKey).withArgs(barCode(pair))
  )

  el.classes.push("ghost-baby-key-pair")
  el.classes.push("ghost-baby-key-pair-"+pairId)


  addGhost(expressionId, el)

}

function onNewObjectKey(pairId, newKey, oldKey) {

  var pairExpression = barCode.scan(pairId)

  var hasExistingValue = pairExpression.expression.object[oldKey]

  turnGhostPairIntoRegularPair(pairId, newKey)

  var keyElement = document.querySelector(".key-pair-"+pairId+"-key")

  keyElement.onclick = functionCall(onKeyRename).withArgs(pairId)
}

function turnGhostPairIntoRegularPair(pairId, newKey) {

  var pairExpression = barCode.scan(pairId)

  var object = pairExpression.expression.object

  object[newKey] = pairExpression.valueExpression

  runIt(program)

  var pairElement = document.querySelector(".ghost-baby-key-pair-"+pairId)

  pairElement.classList.remove("ghost-baby-key-pair")
  pairElement.classList.remove("ghost-baby-key-pair-"+pairId)

  var expressionId = barCode(pairExpression.expression)

  expressionHasGhostBaby[expressionId] = false
}












var keyPair = element.template(
  ".key-pair",
  function keyPair(pairExpression, keyRenameHandler) {

    pairExpression.kind = "key pair"

    var expression = pairExpression.expression
    var key = pairExpression.key

    var valueExpression = expression.object[key] || pairExpression.valueExpression

    var textElement = element(
      "span",
      element.raw(key)
    )

    var pairId = barCode(pairExpression)

    var keyButton = element(
      ".button.key.depth-2.key-pair-"+pairId+"-key",
      [
        textElement,
        element("span", ":")
      ]
    )

    makeEditable(
      keyButton,
      functionCall(getKeyName).withArgs(pairId),
      keyRenameHandler,
      {updateElement: textElement}
    )

    if (keyButton.attributes.onclick.match(/undefined/)) {
      throw new Error("undefined in onclick")
    }

    var valueElement =
      expressionToElement(valueExpression)

    this.children.push(keyButton)
    this.children.push(valueElement)
  }
)

function getKeyName(id) {
  var pairExpression = barCode.scan(id)
  return pairExpression.key
}

var ghost


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

  updateElement.classes.push("editable-"+button.id+"-target")

  button.classes.push("editable-"+button.id)

  button.attributes.onclick = functionCall(startEditing).withArgs(button.id, getValue, setValue).evalable()
}

function startEditing(id, getValue, callback) {

  var el = document.querySelector(
    ".editable-"+id)

  el.classList.add("being-edited-by-human")

  var editable = {
    id: id,
    oldValue: getValue()
  }

  streamHumanInput(
    editable.oldValue,
    updateEditable.bind(null, editable, callback),
    stopEditing.bind(null, editable.id)
  )

}

function updateEditable(editable, callback, value) {

  var toUpdate = document.querySelector(
      ".editable-"
      +editable.id
      +"-target")

  toUpdate.innerHTML = value
  callback(value, editable.oldValue)
  editable.oldValue = value
}

function stopEditing(id) {
  var el = document.querySelector(".editable-"+id)
  el.classList.remove("being-edited-by-human")
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



