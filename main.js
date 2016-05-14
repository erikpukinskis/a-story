// GLOBAL API SHIT //////////



// DOM STUFF


// TIME TRAVEL

var MINIMUM_PAUSE = 750

function afterASecond(func) {
  if (!func.waitingToTry) {
    func.waitingToTry = setTimeout(tryToRun.bind(null, func), MINIMUM_PAUSE)
  }

  func.lastTry = new Date()
}

function tryToRun(func) {
  var sinceLastTry = new Date() - func.lastTry

  if (sinceLastTry < MINIMUM_PAUSE) {
    func.waitingToTry = setTimeout(tryToRun.bind(null, func), MINIMUM_PAUSE - sinceLastTry + 100)
  } else {
    func.waitingToTry = null
    func()
  }
}


// SAMPLE PROGRAM //////////

function stringLiteralJson(string) {
  return {
    kind: "string literal",
    string: string
  }
}

function emptyExpressionJson() {
  return { kind: "empty expression" }
}

var program = {
  kind: "function literal",
  argumentNames: ["element", "bridgeRoute"],
  body: [
{
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
      "background": stringLiteralJson("cornsilk"),
      "color": stringLiteralJson("orchid"),
      "font-size": stringLiteralJson("60pt"),
      "font-family": stringLiteralJson("georgia")
        }
    }
  ]
}
    ]
  }
},
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
}
  ]
}



// THE EDITOR ////////////////


// RENDERERS 

var ghostExpression = element.template(
  ".ghost-expression.ghost.button",
  "&nbsp;",
  function(options) {
    this.assignId()

    if (!options) { options = {} }

    var add = functionCall(addExpression).withArgs(this.id)

    if (options.parentId) {
      add = add.withArgs(options.parentId)
    }

    this.onclick(add)
  }
)

function addExpression(ghostElementId, parentId) {
  menu(
    menu.choice(
      "&nbsp;",
      {kind: "empty"}
    ),
    menu.choice(
      "\" text \"",
      {kind: "string literal"}
    ),
    menu.choice(
      "var _ =",
      {
        kind: "variable assignment",
        expression: emptyExpressionJson(),
        variableName: "fraggleRock"
      }
    ),
    menu.choice(
      "page",
      {kind: "variable reference", variableName: "page"}
    ),
    menu.choice(
      "options :",
      {kind: "object literal"}
    ),
    menu.choice(
      "function",
      {kind: "function literal"}
    ),
    menu.choice(
      "element",
      {kind: "function call", functionName: "element", arguments: []}
    ),
    menu.choice(
      "bridgeRoute",
      {kind: "function call", functionName: "bridgeRoute"}
    ),
    menu.choice(
      "element.style",
      {kind: "function call", functionName: "bridgeRoute"}
    ),
    function(choice) {

      var expression = barCode.scan(parentId)

      expression.arguments.push(choice)

      var newEl = expressionToElement(choice)

      var oldChild = document.getElementById(ghostElementId)

      addHtml.inPlaceOf(oldChild, newEl.html())

      runIt(program)

    }
  )

}




var renderFunctionCall = element.template(
  ".function-call",
  function(expression) {

    var button = element(
      ".button.function-call-name.indenter",
      expression.functionName
    )

    var expressionId = barCode(expression)

    makeItEditable(
      button,
      functionCall(getProperty).withArgs("functionName", expressionId),
      functionCall(setProperty).withArgs("functionName", expressionId)
    )

    this.children.push(button)

    // this.onclick(
    //   functionCall(addGhostBabyArgument)
    //   .withArgs(
    //     expressionId,
    //     functionCall.raw("event")
    //   )
    // )

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
  ".button.literal",
  function(expression) {

    var stringElement = element("span", element.raw(expression.string))

    this.children.push(
      element("span", "\""),
      stringElement,
      element("span", "\"")
    )

    makeItEditable(
      this,
      functionCall(getProperty).withArgs("string", barCode(expression)),
      functionCall(setProperty).withArgs("string", barCode(expression)),
      {updateElement: stringElement}
    )
  }
)




var functionLiteral = element.template(
  ".function-literal",
  function(expression) {
    var children = this.children

    children.push(
      element(
        ".button.function-literal-label.indenter",
        "function"
      )
    )

    var argumentNames = element(
      ".function-argument-names",
      expression.argumentNames.map(function(name, index) {
        return argumentName(expression, name, index)
      })
    )

    children.push(argumentNames)

    children.push(
      functionLiteralBody(
        expression.body
      )
    )

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
      functionCall(getArgumentName).withArgs(barCode(expression), argumentIndex),
      functionCall(renameArgument).withArgs(barCode(expression), argumentIndex)
    )

  }
)

function getArgumentName(expressionId, index) {
  var expression = barCode.scan(expressionId)

  return expression.argumentNames[index]
}

function renameArgument(expressionId, index, newName) {
  var expression = barCode.scan(expressionId)

  expression.argumentNames[index] = newName

  runIt(program)
}

var functionLiteralBody = element.template(
  ".function-literal-body",
  function(lines) {

    var previous

    this.children = lines.map(
      function(line) {
        var el = element(
          expressionToElement(line),
          ".function-literal-line"
        )

        if (previous) {
          previous.classes.push("leads-to-"+line.kind.replace(" ", "-"))

        }

        previous = el

        return el
      }
    )

  }
)




var variableAssignment = element.template(
  ".variable-assignment",
  function(expression) {
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
      functionCall(getProperty).withArgs("variableName", barCode(expression)),
      functionCall(setProperty).withArgs("variableName", barCode(expression)),
      {updateElement: nameSpan}
    )

    var rhs = expressionToElement(
      expression.expression
    )

    rhs.classes.push("rhs")
    this.children.push(lhs)
    this.children.push(rhs)
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



    // this.onclick(
    //   functionCall(addGhostBabyKeyPair)
    //   .withArgs(
    //     barCode(expression),
    //     functionCall.raw("event")
    //   )
    // )

  }
)

function onKeyRename(pairId, newKey) {
  var pairExpression = barCode.scan(pairId)
  var object = pairExpression.expression.object
  var oldKey = pairExpression.key

  pairExpression.key = newKey
  object[newKey] = object[oldKey]

  delete object[oldKey]
  runIt(program)
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
      ".button.key.key-pair-"+pairId+"-key",
      [
        textElement,
        element("span", ":")
      ]
    )

    makeItEditable(
      keyButton,
      functionCall(getKeyName).withArgs(pairId),
      keyRenameHandler,
      {updateElement: textElement}
    )


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

var variableReference = element.template(
  ".button.variable-reference",
  function(expression) {
    this.children.push(element.raw(
      expression.variableName
    ))
  }
)




var arrayLiteral = element.template(
  ".array-literal.indenter",
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




// GHOST BABIES

var expressionHasGhostBaby = {}

function addGhost(containerId, el) {
  if (expressionHasGhostBaby[containerId]) {
    return
  }

  expressionHasGhostBaby[containerId] = true

  var container = document.querySelector(".container-"+containerId)

  container.innerHTML = container.innerHTML + el.html()
}

// GHOST BABY MAKERS

function addGhostBabyArgument(parentId, event) {
  var el = ghostExpression({
    parentId: parentId
  })
  el.classes.push("ghost-baby-arg")
  el.classes.push("ghost")
  el.classes.push("function-argument")
  addGhost(parentId, el)
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

  el.classes.push("ghost")
  el.classes.push("ghost-baby-key-pair-"+pairId)

  addGhost(expressionId, el)

}

function onNewObjectKey(pairId, newKey, oldKey) {

  var pairExpression = barCode.scan(pairId)

  pairExpression.key = newKey

  var object = pairExpression.expression.object

  object[newKey] = pairExpression.valueExpression

  pairExpression.key = newKey

  // remove classes:

  var pairElement = document.querySelector(".ghost-baby-key-pair-"+pairId)
  pairElement.classList.remove("ghost")
  pairElement.classList.remove("ghost-baby-key-pair-"+pairId)

  // mark the ghost baby as gone:

  var expressionId = barCode(pairExpression.expression)
  expressionHasGhostBaby[expressionId] = false

  // swap in the normal callbacks:

  var keyElement = document.querySelector(".key-pair-"+pairId+"-key")
  var getValue = functionCall(getKeyName).withArgs(pairId)

  // this mabe needs to be more beefy, with the targetElement updater etc
  var setValue = functionCall(onKeyRename).withArgs(pairId)

  var startEditingScript = functionCall(startEditing).withArgs(keyElement.id, getValue, setValue).evalable()

  keyElement.setAttribute(
    "onclick",
    startEditingScript
  )

  var setValue = onKeyRename.bind(null, pairId)

  humanInputListener.callback = updateEditable.bind(null, setValue)

  runIt(program)

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
  "empty expression": ghostExpression
}

function traverseExpression(expression, handlers) {

  var kind = expression.kind
  var handler = handlers[kind]

  if (typeof handler != "function") {
    throw new Error("The object you provided had no "+kind+" handler, which is the kind of your expression: "+JSON.stringify(expression))
  }

  return handler(expression)
}

var line = element.template.container()

function drawProgram(expression) {
  var program = expressionToElement(
    expression)
  program.classes.push("program")

  var world = element(
    ".two-columns",
    {
      onclick: "// click away"
    },
    [
      element(".column", [
        line(program)
      ]),
      element(".column", [
        element(".output")
      ])
    ]
  )

  addHtml(world.html())
  addHtml(element(".selector", "EZJS").html())
}






// RENDERING AND SELECTING EXPRESSIONS

var expressionElementIds = []
var expressionsByElementId = {}
var SELECTOR_TOP = 120
var SELECTOR_HEIGHT = 32
var bestElementByLine = []
var bestElementScoreByLine = []

function expressionToElement(expression) {
  var el = traverseExpression(expression, renderers)
  var id = el.assignId()
  expressionElementIds.push(id)
  expressionsByElementId[id] = expression
  return el
}

function elementOverSelector() {

  var line = parseInt(window.scrollY / 10)

  var cached = bestElementByLine[line]
  if (cached || cached === false) {
    return cached
  }

  var indexOfFirstMatch

  function checkIfBetter(el, top, i) {
    var nothingElse = !bestElementByLine[line]
    var distance = Math.abs(top - (SELECTOR_TOP+SELECTOR_HEIGHT/2))
    var thisIsBetter = distance < bestElementScoreByLine[line]

    if (nothingElse || thisIsBetter) {
      bestElementByLine[line] = el || false
      bestElementScoreByLine[line] = distance
    }

    if (!indexOfFirstMatch) {
      indexOfFirstMatch = i
    } 
  }

  for(var i=0; i<expressionElementIds.length; i++) {

    // After we find a match, we'll check the next ~10 elements to see if there's a better one

    if (indexOfFirstMatch && i > (indexOfFirstMatch + 10)) {
      break;
    }

    var el = document.getElementById(expressionElementIds[i])

    var rect = el.getBoundingClientRect()

    var startsAboveLine = rect.top < SELECTOR_TOP+SELECTOR_HEIGHT

    var endsAboveLine = rect.bottom < SELECTOR_TOP

    if (startsAboveLine && !endsAboveLine) {
      checkIfBetter(el, rect.top, i)
    }
  }

  return bestElementByLine[line]
}


window.onscroll = updateSelection

// Throttling doesn't really solve our problem, since we really want fast performance at transitions. So what we should do is only poll for an element when we cross transitions, and cache the answers.

var selectionIsHidden
var controlsAreVisible
var currentSelection

function updateSelection() {
  if (controlsAreVisible) {
    hideSelectionControls()
  }

  var newSelection = elementOverSelector()
  var shouldBeHidden = !newSelection
  var shouldBeVisible = !shouldBeHidden

  if (shouldBeHidden && selectionIsHidden !== true) {
    document.querySelector(".selector").style.display = "none"
    selectionIsHidden = true    
  }

  if (shouldBeVisible && selectionIsHidden) {
    document.querySelector(".selector").style.display = "block"
    selectionIsHidden = false
  }

  if (newSelection == currentSelection) {
    return
  } else if (newSelection) {
    newSelection.classList.add("selected")
  }

  if (currentSelection) {
    currentSelection.classList.remove("selected")
  }

  currentSelection = newSelection

  if (!currentSelection) { return }

  afterASecond(showSelectionControls)
}

var controlsSelector

function showSelectionControls() {
  var id = currentSelection.id

  var expression = expressionsByElementId[id]

  if (expression.kind == "variable assignment") {

    controlsSelector = ".ghost-baby-line.ghost-baby-line-"+id

    var controls = document.querySelectorAll(".ghost-baby-line-"+id)

    if (controls.length > 0) {
      setDisplay(controls, "block")
    } else {
      addHtml.before(
        currentSelection,
        element(controlsSelector, "+").html()
      )

      addHtml.after(
        currentSelection,
        element(controlsSelector, "+").html()
      )
    }

    offsetCameraUp(1)

  }

  controlsAreVisible = true
}

function hideSelectionControls() {
  controlsAreVisible = false

  if (!controlsSelector) { return }

  var controls = document.querySelectorAll(controlsSelector)

  setDisplay(controls, "none")

  offsetCameraUp(0)
}

function setDisplay(elements, value) {
  for(var i=0; i<elements.length; i++) {
    elements[i].style.display = value
  }
}

function offsetCameraUp(lines) {
  var containerElement = document.querySelector(".program")

  var transform = "translateY("+(lines*-32)+"px)"

  containerElement.style.transform = transform
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
  "empty expression": function() {
    return "null"
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

function runIt(functionLiteral) {
  var expression = packageAsModule(functionLiteral)

  var js = expressionToJavascript(expression)

  js = js + "\n//# sourceURL=home-page.js"

  eval(js)
}

function packageAsModule(functionLiteral) {
  
  return {
    kind: "function call",
    functionName: "using",
    arguments: [
      {
        kind: "array literal",
        items: dependenciesFromArgumentNames(functionLiteral)
      },
      functionLiteral
    ]
  }

}

function dependenciesFromArgumentNames(functionLiteral) {

  return functionLiteral
    .argumentNames
    .map(
      function(camelCase) {
        return stringLiteralJson(
          dasherized(camelCase)
        )
      }
    )

}

function dasherized(camelCase) {
  var words = []
  var wordStart = 0

  for(var i=0; i<camelCase.length+1; i++) {

    var letter = camelCase[i]
    var isEnd = i == camelCase.length
    var isUpperCase = letter && letter.toUpperCase() == letter

    if (isUpperCase || isEnd) {
      // new word!
      var word = camelCase.slice(wordStart, i)
      words.push(word.toLowerCase())
      wordStart = i
    }
  }

  return words.join("-")
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

        setTimeout(function() {
          var el = document.querySelector(".program")
          var top = el.offsetTop
          var parentTop = el.parentNode.parentNode.offsetTop

          out.style.top = (top-parentTop)+"px"
          out.style.position = "relative"
        })
      }
    }

    handler(bridge)
  }
})







// BOTTOM OF THE FILE

drawProgram(program)

runIt(program)



