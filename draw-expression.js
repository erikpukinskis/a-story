
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


/* Onclick Handlers */


function addKeyPair(insertByThisId, relationship, objectElementId, relativeToKey) {

  drawExpression.addKeyPair.apply(null, arguments)
}

var expressionChoices = [
  menu.choice(
    "drawScene(...)",
    {
      kind: "function call",
      functionName: "drawScene",
      arguments: [
        triangle()
      ]
    }
  ),

  menu.choice(
    "addHtml(\"<...>\")",
    {
      kind: "function call",
      functionName: "addHtml",
      arguments: [
        aProgramAppeared.stringLiteral("")
      ]
    }
  ),

  menu.choice(
    "bridgeTo.browser(...)",
    {
      kind: "function call",
      functionName: "bridgeTo.browser",
      arguments: [
        {
          kind: "function literal",
          argumentNames: [],
          body: [aProgramAppeared.emptyExpression()]}
      ]
    }
  ),

  menu.choice(
    "\"some text\"",
    {
      kind: "string literal",
      string: ""
    }
  ),

  menu.choice(
    "var yourVariable =",
    {
      kind: "variable assignment",
      expression: aProgramAppeared.emptyExpression(),
      variableName: "fraggleRock"
    }
  ),
]

function showExpressionMenu(ghostElementId, relativeToThisId, relationship) {

  menu(
    expressionChoices,
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

var keyPairsByValueExpressionId = {}

function getSelectedKeyValue(elementId) {
  var expression = expressionsByElementId[elementId]

  var nextId = elementId
  var parent
  var possibleValueExpression = expression

  while(parent = parentExpressionsByChildId[nextId]) {
    if (parent.kind == "object literal") {
      var keyPair = keyPairsByValueExpressionId[possibleValueExpression.elementId]

      return keyPair
    }
    possibleValueExpression = parent
    nextId = parent.elementId
  }
}


var selectionIsHidden = true
var controlsAreVisible
var currentSelection

function updateSelection(options) {
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

  if (options && options.controls == "none") {
    // do nothing
  } else {
    afterASecond(updateControls)
  }
}

var controlsSelector

function updateControls() {
  if (!currentSelection) { return }

  var selectedElementId = currentSelection.id

  var expression = expressionsByElementId[selectedElementId]

  var keyValue = getSelectedKeyValue(selectedElementId)

  if (keyValue) {

    var keyPairElement = document.getElementById(keyValue.elementId)

    showControls(
      keyPairElement,
      function(baby, relativeToThisId, relationship) {

        var add = 
          functionCall(addKeyPair)
          .withArgs(
            baby.assignId(),
            relationship,
            keyValue.expression.elementId,
            keyValue.key
          )

        baby.onclick(add)
      }
    )

  } else if (expression.role == "function literal line") {

    showControls(
      currentSelection,
      function(baby, relativeToThisId, relationship) {

        var showMenu = 
          functionCall(showExpressionMenu)
          .withArgs(
            baby.assignId(),
            relativeToThisId,
            relationship
          )

        baby.onclick(showMenu)
      }
    )

  }

}


function showControls(selectedNode, handleBaby) {

  controlsSelector = ".controls-for-"+selectedNode.id

  var controls = document.querySelectorAll(controlsSelector)

  if (controls.length > 0) {
    setDisplay(controls, "block")
  } else {

    ["before", "after"].forEach(
      function(beforeOrAfter) {

        var baby = element(
          ".ghost-baby-line"+controlsSelector,
          "+"
        )
  
        handleBaby(
          baby,
          selectedNode.id,
          beforeOrAfter
        )

        addHtml[beforeOrAfter](
          selectedNode,
          baby.html()
        )

      }
    )


  }

  offsetCameraUp(1)

  controlsAreVisible = true

}





// EDITOR ///////////////////////


var drawExpression = (function() {

  // RENDERERS 

  var emptyExpression = element.template(
    ".empty-expression.button",
    "empty",
    function(expression) {

      this.assignId()

      if (expression.role == "key value") {

        var add = 
          functionCall(showExpressionMenu)
          .withArgs(
            this.id,
            this.id,
            "inPlaceOf"
          )

      } else if (expression.role == "function literal line") {

        var add = 
          functionCall(showExpressionMenu)
          .withArgs(
            this.id,
            this.id,
            "inPlaceOf"
          )

      }

      if (add) { this.onclick(add) }

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
        child.role = "function literal line"
        
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
      expression.keys = []

      for(var key in object) {

        expression.keys.push(key)

        var pairExpression = {
          key: key,
          expression: expression
        }

        var el = keyPairTemplate(
          pairExpression,
          functionCall(onKeyRename).withArgs(barCode(pairExpression)),
          expression
        )

        this.children.push(el)
      }

      this.classes.push("container-"+barCode(expression))
    }
  )


  var keyPairTemplate = element.template(
    ".key-pair",
    function keyPairTemplate(pairExpression, keyRenameHandler, objectExpression) {

      pairExpression.kind = "key pair"
      pairExpression.elementId = this.assignId()

      var expression = pairExpression.expression
      var key = pairExpression.key
      var value = expression.object[key]

      var valueExpression = value || pairExpression.valueExpression

     if (typeof valueExpression != "object" || !valueExpression.kind) {
        throw new Error("Trying to draw object expression "+stringify(objectExpression)+" but the "+key+" property doesn't seem to be an expression? It's "+stringify(valueExpression))
      }

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

      this.startEditing = function() {
        eval(keyButton.attributes.onclick)
      }

      var valueElement =
        expressionToElement(
          valueExpression,
          {parent: objectExpression}
        )

      valueExpression.role = "key value"

      keyPairsByValueExpressionId[valueElement.assignId()] = pairExpression

      valueElement.classes.push("key-value")
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

    if (typeof expression != "object" || !expression || !expression.kind) {
      throw new Error("Trying to turn "+stringify(expression)+" into an element, but it doesn't look like an expression")
    }

    var kind = expression.kind
    var render = renderers[kind]

    if (typeof render != "function") {
      throw new Error("No renderer for "+kind)
    }

    var el = render(expression)

    var id = expression.elementId = el.assignId()



    // DELETE THIS....

    var parent = options && options.parent

    var i = ++lastInsertedExpressionIndex

    var splicePosition = options &&options.splicePosition
    var deleteThisMany = splicePosition && (options.deleteThisMany || 0)

    if (parent) {
      parentExpressionsByChildId[id] = parent
    }

    if (splicePosition) {
      expressionElementIds.splice(splicePosition, deleteThisMany, id)
    } else {
      expressionElementIds[i] = id
    }

    // ... TO HERE



    expressionsByElementId[id] = expression

    return el
  }

  function stringify(thing) {
    if (typeof thing == "function") {
      return thing.toString()
    } else {
      return JSON.stringify(thing)
    }
  }

  function getDeps(newExpression) {
    var deps = []
    var lines = newExpression.body
    var name = newExpression.functionName

    if (name) {
      var parts = name.split(".")
      deps.push(parts[0])
    }

    if (lines) {
      for(var i=0; i<lines; i++) {
        var moreDeps =
          getDeps(lines[i])
        deps = deps.concat(modeDeps)
      }
    }

    return deps
  }

  function getPackageFunctionLiteral(expression) {
    if (expression.kind == "function literal") {
      return expression
    }
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

    newExpression.role = "function literal line"

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

    updateDependencies(parentExpression, newExpression)

    programChanged()
    hideSelectionControls()
    updateSelection()
    offsetCameraUp(1)
  }

  function updateDependencies(parent, line) {

    if (line.kind == "function call") {

      var deps = getDeps(line)

      var package = getPackageFunctionLiteral(parent)

      if (package && deps.length) {
        deps.forEach(function(dep) {
          var isMissing = package.argumentNames.indexOf(dep) == -1
          if (isMissing) {
            addDependency(package, dep)
          }
        })
      }
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


  function addDependency(package, dep) {

    var index = package.argumentNames.length

    package.argumentNames.push(dep)
    var el = argumentName(package, dep, index)

    var selector = "#"+package.elementId+" .function-argument-names"

    var container = document.querySelector(selector)

    addHtml.inside(
      container, el.html()
    )

    var scriptTag = element(
      "script",
      {
        src: "../build/"+dasherize(dep)+".library.js"
      }
    )

    addHtml(scriptTag.html())

  }

  function dasherize(camelCase) {
    var parts = camelCase.match(/([^A-Z]*)([A-Z][^A-Z]+)/)

    var dashed
    for(var i=1; i<parts.length; i++) {
      var part = parts[i].toLowerCase()
      if (dashed) {
        dashed = dashed+"-"+part
      } else {
        dashed = part
      }
    }
    return dashed
  }

  function addKeyPair(insertByThisId, relationship, objectElementId, relativeToKey) {

    var objectExpression = expressionsByElementId[objectElementId]

    var index = objectExpression.keys.indexOf(relativeToKey)

    if (relationship == "after") {
      index = index + 1
    }

    objectExpression.keys.splice(index, 0, "")

    var valueExpression = aProgramAppeared.emptyExpression()
    valueExpression.role = "key value"

    objectExpression.object[""] = valueExpression

    var neighbor = document.getElementById(insertByThisId)

    var pairExpression = {
      key: "",
      expression: objectExpression
    }

    var el = keyPairTemplate(
      pairExpression,
      functionCall(onKeyRename).withArgs(barCode(pairExpression)),
      objectExpression
    )

    addHtml[relationship](neighbor, el.html())

    updateSelection({controls: "none"})

    el.startEditing()
  }

  var drawExpression = expressionToElement

  drawExpression.new = addExpression

  drawExpression.addKeyPair = addKeyPair

  return drawExpression

})()
