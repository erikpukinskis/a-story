var library = require("nrtv-library")(require)

module.exports = library.export(
  "code-tool",
  function() {

    // HELPERS

    var MINIMUM_PAUSE = 750

    function afterASecond(func) {
      if (!func.waitingToTry) {
        func.waitingToTry = setTimeout(tryToCall.bind(null, func), MINIMUM_PAUSE)
      }

      func.lastTry = new Date()
    }

    function tryToCall(func) {
      var sinceLastTry = new Date() - func.lastTry

      if (sinceLastTry < MINIMUM_PAUSE) {
        func.waitingToTry = setTimeout(tryToCall.bind(null, func), MINIMUM_PAUSE - sinceLastTry + 100)
      } else {
        func.waitingToTry = null
        func()
      }
    }




    var SELECTOR_TOP = 120
    var SELECTOR_HEIGHT = 32
    var SELECTOR_BOTTOM = SELECTOR_TOP+SELECTOR_HEIGHT
    var selectorDrawn = false

    window.onscroll = updateSelection

    addHtml(element(".selector", "EZJS").html())




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

      var containerElement = document.querySelector(".two-columns")

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

      for(var i=expressionIds.length-1; i>=0; i--) {

        var id = expressionIds[i]
        var el = document.getElementById(id)

        if (!el) {
          continue
        }

        if (elementOverlapsSelector(el)) {
          return el
        }
      }

    }

    var keyPairsByValueId = {}

    function getSelectedKeyValue(expressionId) {
      var expression = expressionsById[expressionId]

      var nextId = expressionId
      var parent
      var possibleValueExpression = expression

      while(parent = parentExpressionsByChildId[nextId]) {
        if (parent.kind == "object literal") {
          var keyPair = keyPairsByValueId[possibleValueExpression.id]

          return keyPair
        }
        possibleValueExpression = parent
        nextId = parent.id
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

      var expression = expressionsById[selectedElementId]

      var valueExpression = getSelectedKeyValue(selectedElementId)

      if (valueExpression) {

        var valueElement = document.getElementById(valueExpression.id)

        var objectExpression = valueExpression.objectExpression

        showControls(
          valueElement,
          function(baby, relativeToThisId, relationship) {

            var add = 
              functionCall("drawExpression.addKeyPair")
              .withArgs(
                baby.assignId(),
                relationship,
                objectExpression.id,
                valueExpression.key
              )

            baby.onclick(add)
          }
        )

      } else if (expression.role == "function literal line") {

        showControls(
          currentSelection,
          function(baby, relativeToThisId, relationship) {

            var addLine =
              functionCall(
                "drawExpression.addLine")
              .withArgs(
                baby.assignId(),
                relativeToThisId,
                relationship
              )

            var showMenu = functionCall(chooseExpression).withArgs(addLine)

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

    return updateSelection
  }
)





