
// HELPERS

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



// WHO RUNS THE WORLD? GLOBALS

var lastInsertedExpressionIndex = -1
var parentExpressionsByChildId = {}
var expressionElementIds = []
var expressionsByElementId = {}


var SELECTOR_TOP = 120
var SELECTOR_HEIGHT = 32
var SELECTOR_BOTTOM = SELECTOR_TOP+SELECTOR_HEIGHT
var selectorDrawn = false

window.onscroll = updateSelection

addHtml(element(".selector", "EZJS").html())

function programChanged() {
  loadedProgram.run()
}

function getProperty(property, expressionId) {
  var expression = barCode.scan(expressionId)
  return expression[property]
}

function setProperty(property, expressionId, newValue, oldValue) {
  var expression = barCode.scan(expressionId)
  expression[property] = newValue
  programChanged()
}

function setFloatProperty(property, expressionId, newValue, oldValue) {
  var expression = barCode.scan(expressionId)
  expression[property] = parseFloat(newValue)
  programChanged()
}

function getKeyName(id) {
  var pairExpression = barCode.scan(id)
  return pairExpression.key
}

function onKeyRename(pairId, newKey) {
  var pairExpression = barCode.scan(pairId)
  var object = pairExpression.expression.object
  var oldKey = pairExpression.key

  pairExpression.key = newKey
  object[newKey] = object[oldKey]

  delete object[oldKey]
  programChanged()
}

function triangle() {

  var expression = {
    kind: "array literal",
    items: [
      aProgramAppeared.objectLiteral({
        name: "triangle",
        position: [-1.5, 0.0, -7.0]
      }),
      aProgramAppeared.objectLiteral({
        name: "other triangle",
        position: [1.5, 0.0, -7.0]
      })
    ]
  }

  return expression
}


function showAddExpressionMenu(ghostElementId, relativeToThisId, relationship) {

  menu(
    menu.choice(
      "drawScene(...)",
      {kind: "function call", functionName: "drawScene", arguments: [triangle()]}),
    menu.choice(
      "\"some text\"",
      {kind: "string literal", string: ""}
    ),
    menu.choice(
      "var yourVariable =",
      {
        kind: "variable assignment",
        expression: aProgramAppeared.emptyExpression(),
        variableName: "fraggleRock"
      }
    ),
    drawExpression.new.bind(null, ghostElementId, relativeToThisId, relationship)
  )

}

function indexBefore(list, value) {

  for(var i = 0; i < list.length; i++) {
    if (list[i] == value) {
      return i
    }
  }

  throw new Error("can't find "+value+" to insert before it")

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


function lastDescendantAfter(elementIds, startIndex) {

  var possibleParentIds = [elementIds[startIndex]]
  var lastDescendant = startIndex

  for(var i = startIndex+1; i<elementIds.length; i++) {

    var testId = elementIds[i]
    var testExpr = expressionsByElementId[testId]

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

function indexAfter(elementIds, relativeId) {

  var splicePosition
  var parentIdStack = []

  for(var i = 0; i < elementIds.length; i++) {
    var testId = elementIds[i]

    if (testId == relativeId) {
      return lastDescendantAfter(elementIds, i)+1
    }
  }

  throw new Error("can't find "+relativeId+" to insert after it")
}


// SELECTION CONTROLS

function hideSelectionControls() {
  controlsAreVisible = false
  
  if (!controlsSelector) { return }

  var controls = document.querySelectorAll(controlsSelector)

  setDisplay(controls, "none")

  offsetCameraUp(-1)
}

function setDisplay(elements, value) {
  for(var i=0; i<elements.length; i++) {
    elements[i].style.display = value
  }
}

var verticalCameraOffset = 0

function offsetCameraUp(lines) {
  var orig = verticalCameraOffset

  verticalCameraOffset += lines

  var containerElement = document.querySelector(".program")

  var transform = "translateY("+(verticalCameraOffset*-32)+"px)"

  containerElement.style.transform = transform
}


function elementOverlapsSelector(el) {
  var rect = el.getBoundingClientRect()

  var startsAboveLine = rect.top < SELECTOR_BOTTOM

  var endsAboveLine = rect.bottom < SELECTOR_TOP

  return startsAboveLine && !endsAboveLine
}

function getSelectedElement() {

  for(var i=expressionElementIds.length-1; i>=0; i--) {

    var id = expressionElementIds[i]
    var el = document.getElementById(id)

    if (!el) {
      continue
    }

    if (elementOverlapsSelector(el)) {
      return el
    }
  }

}

var selectionIsHidden = true
var controlsAreVisible
var currentSelection

function updateSelection() {
  if (controlsAreVisible) {
    hideSelectionControls()
  }

  var newSelection = getSelectedElement()

  var shouldBeHidden = !newSelection
  var shouldBeVisible = !shouldBeHidden

  if (shouldBeHidden &&
    !selectionIsHidden) {
    document.querySelector(".selector").style.display = "none"
    selectionIsHidden = true    
  }

  if (shouldBeVisible && selectionIsHidden) {
    console.log("bing")
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
  if (!currentSelection) { return }

  var selectedElementId = currentSelection.id

  var expression = expressionsByElementId[selectedElementId]

  if (expression.kind == "variable assignment") {

    controlsSelector = ".ghost-baby-line.ghost-baby-line-"+selectedElementId

    var controls = document.querySelectorAll(".ghost-baby-line-"+selectedElementId)

    if (controls.length > 0) {
      setDisplay(controls, "block")
    } else {
      addControls(currentSelection, expression)
    }

    offsetCameraUp(1)

    controlsAreVisible = true
  }

}

var ghostBabyLine = element.template(
  "+",
  function(selectedElementId) {

    this.classes = [
      "ghost-baby-line",
      "ghost-baby-line-"+selectedElementId
    ]
  }
)

function addControls(selectedNode, expression) {

  ["before", "after"].forEach(
    function(beforeOrAfter) {

      var baby = ghostBabyLine(selectedNode.id)

      var add = 
        functionCall(showAddExpressionMenu)
        .withArgs(
          baby.assignId(),
          selectedNode.id,
          beforeOrAfter
        )

      baby.onclick(add)

      addHtml[beforeOrAfter](
        selectedNode,
        baby.html()
      )

    }
  )

}





// EDITOR ///////////////////////


var drawExpression = (function() {

  // RENDERERS 

  var emptyExpression = element.template(
    ".empty-expression.button",
    "empty",
    function() {

      this.assignId()

      var add = 
        functionCall(showAddExpressionMenu)
        .withArgs(
          this.id,
          this.id,
          "inPlaceOf"
        )

      this.onclick(add)
    }
  )

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
      var arg = expressionToElement(expression, {parent: parent})

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


  var numberLiteral = element.template(
    ".button.literal",
    function(expression) {

      this.children.push(element.raw(expression.number.toString()))

      makeItEditable(
        this,
        functionCall(getProperty).withArgs("number", barCode(expression)),
        functionCall(setFloatProperty).withArgs("number", barCode(expression))
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

    programChanged()
  }

  var functionLiteralBody = element.template(
    ".function-literal-body",
    function(parent) {

      var previous

      this.children = parent.body.map(toChild)

      function toChild(child) {
        var el = expressionToElement(child, {parent: parent})

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
        expression.expression, {parent: expression})

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
          functionCall(onKeyRename).withArgs(barCode(pairExpression)),
          expression
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


  var keyPair = element.template(
    ".key-pair",
    function keyPair(pairExpression, keyRenameHandler, objectExpression) {

      pairExpression.kind = "key pair"

      var expression = pairExpression.expression
      var key = pairExpression.key
      var value = expression.object[key]

      if (typeof value != "object" || !value.kind) {
        throw new Error("Trying to draw object expression "+JSON.stringify(objectExpression)+" but the "+key+" property doesn't seem to be an expression?")
      }

      var valueExpression = value || pairExpression.valueExpression

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
        expressionToElement(
          valueExpression,
          {parent: objectExpression}
        )

      this.children.push(keyButton)
      this.children.push(valueElement)
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
      var items = expression.items

      this.children = items.map(itemToElement)

      function itemToElement(item) {
        return element(
          ".array-item",
          expressionToElement(item, {parent: expression})
        )
      }

    }
  )

  function itemToElement(item) {
    return 
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


  // function addGhostBabyKeyPair(expressionId, event) {

  //   var expression = barCode.scan(expressionId)

  //   var pair = {
  //     kind: "key pair",
  //     key: "",
  //     expression: expression,
  //     valueExpression: stringLiteralJson("")
  //   }

  //   var pairId = barCode(pair)

  //   var el = keyPair(
  //     pair,
  //     functionCall(onNewObjectKey).withArgs(barCode(pair))
  //   )

  //   el.classes.push("ghost")
  //   el.classes.push("ghost-baby-key-pair-"+pairId)

  //   addGhost(expressionId, el)

  // }

  // function onNewObjectKey(pairId, newKey, oldKey) {

  //   var pairExpression = barCode.scan(pairId)

  //   pairExpression.key = newKey

  //   var object = pairExpression.expression.object

  //   object[newKey] = pairExpression.valueExpression

  //   pairExpression.key = newKey

  //   // remove classes:

  //   var pairElement = document.querySelector(".ghost-baby-key-pair-"+pairId)
  //   pairElement.classList.remove("ghost")
  //   pairElement.classList.remove("ghost-baby-key-pair-"+pairId)

  //   // mark the ghost baby as gone:

  //   var expressionId = barCode(pairExpression.expression)
  //   expressionHasGhostBaby[expressionId] = false

  //   // swap in the normal callbacks:

  //   var keyElement = document.querySelector(".key-pair-"+pairId+"-key")
  //   var getValue = functionCall(getKeyName).withArgs(pairId)

  //   // this mabe needs to be more beefy, with the targetElement updater etc
  //   var setValue = functionCall(onKeyRename).withArgs(pairId)

  //   var startEditingScript = functionCall(startEditing).withArgs(keyElement.id, getValue, setValue).evalable()

  //   keyElement.setAttribute(
  //     "onclick",
  //     startEditingScript
  //   )

  //   var setValue = onKeyRename.bind(null, pairId)

  //   humanInputListener.callback = updateEditable.bind(null, setValue)

  //   programChanged()

  // }





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

  function expressionToElement(expression, options) {

    var i = ++lastInsertedExpressionIndex

    var splicePosition = options &&options.splicePosition
    var deleteThisMany = splicePosition && (options.deleteThisMany || 0)

    var parent = options && options.parent

    var kind = expression.kind
    var render = renderers[kind]

    if (typeof render != "function") {
      throw new Error("No renderer for "+kind)
    }

    var el = render(expression)

    var id = expression.elementId = el.assignId()

    if (parent) {
      parentExpressionsByChildId[id] = parent
    }

    if (splicePosition) {
      expressionElementIds.splice(splicePosition, deleteThisMany, id)
    } else {
      expressionElementIds[i] = id
    }

    expressionsByElementId[id] = expression

    return el
  }


  function addExpression(ghostElementId, relativeToThisId, relationship, newExpression) {

    var parentExpression = parentExpressionsByChildId[relativeToThisId]


    var relativeExpression = expressionsByElementId[relativeToThisId]

    addExpressionToNeighbors(
      newExpression,
      parentExpression.body,
      relationship,
      relativeExpression
    )

    if (relationship == "before") {

      var splicePosition = indexBefore(expressionElementIds, relativeToThisId)
      var deleteThisMany = 0

    } else if (relationship == "after") {

      var splicePosition = indexAfter(expressionElementIds, relativeToThisId)
      var deleteThisMany = 0

    } else if (relationship == "inPlaceOf") {

      var splicePosition = 0
      var deleteThisMany = 1

    } else { throw new Error() }

    var newElement = drawExpression(
        newExpression,
        {
          parent: parentExpression,
          splicePosition: splicePosition,
          deleteThisMany: deleteThisMany
        }
      )

    var ghostElement = document.getElementById(ghostElementId)

    addHtml[relationship](ghostElement, newElement.html())

    programChanged()
    hideSelectionControls()
    updateSelection()
    offsetCameraUp(1)
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

  expressionToElement.new = addExpression


  return expressionToElement

})()
