var library = require("nrtv-library")(require)

module.exports = library.export(
  "line-controls",
  function() {
    var selectionIsHidden = true
    var controlsAreVisible

    function LineControls(program) {
      this.program = program
      this.show = showControls.bind(this)
      this.hide = hideControls.bind(this)
    }

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

    function showControls(selectedElementId) {
      throw new Error("port this to program")
      var expression = expressionsById[selectedElementId]

      var valueExpression = getSelectedKeyValue(selectedElementId)

      if (valueExpression) {

        var valueElement = document.getElementById(valueExpression.id)

        var objectExpression = valueExpression.objectExpression

        showPlusses(
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

        showPlusses(
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

    function showPlusses(selectedNode, addClickHandler) {

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
      
            addClickHandler(
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


    function hideControls() {
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


    return function(program) {
      return new LineControls(program)
    }
  }
)