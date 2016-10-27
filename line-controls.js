var library = require("nrtv-library")(require)

module.exports = library.export(
  "line-controls",
  ["web-element", "function-call", "add-html", "add-line", "add-key-pair", "./scroll-to-select"],
  function(element, functionCall, addHtml, addLine, addKeyPair, scrollToSelect) {
    var selectionIsHidden = true
    var controlsAreVisible
    var controlsSelector

    function LineControls(program) {

      this.program = program

      scrollToSelect({
        possibleIds: program.getIds(),
        show: showControls.bind(this),
        hide: hideControls.bind(this)
      })

    }

    function showControls(selectedElement) {

      var selectedExpressionId = selectedElement.id

      var pairExpression = getSelectedKeyPair(this.program, selectedExpressionId)

      var isLine = this.program.get(selectedElement.id).role == "function literal line"

      controlsSelector = ".controls-for-"+selectedElement.id

      if (pairExpression) {
        showKeyValueControls(pairExpression, this.bindings.addKeyPair)
      } else if (isLine) {
        showLineControls(selectedElement, this.bindings)
      }

    }

    function showLineControls(lineElement, bindings) {

      showPlusses(
        lineElement,
        function addClickHandler(plusButton, relativeToThisId, relationship) {

          // hacky:

          var add = functionCall("library.get(\"add-line\"")

          // could be something like:
          //
          // var add = library.buildSingletonCall("add-line")

          add = addLine.withArgs(
            bindings.program,
            plusButton.assignId(),
            relativeToThisId,
            relationship
          )

          var showMenu = bindings.chooseExpression.withArgs(add)

          plusButton.onclick(showMenu)
        }
      )

    }

    function showKeyValueControls(pair, addKeyPair) {

      var pairElement = document.getElementById(pair.id)

      var objectExpression = pair.objectExpression

      showPlusses(
        pairElement,
        function addClickHandler(plusButton, relativeToThisId, relationship) {

          var add = functionCall("library.get(\"add-key-pair\"")

          add = addKeyPair.withArgs(
            plusButton.assignId(),
            relationship,
            objectExpression.id,
            pair.key
          )

          plusButton.onclick(add)
        }
      )

    }

    function showPlusses(selectedNode, addClickHandler) {

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

    function getSelectedKeyPair(program, expressionId) {

      var expression = program.get(expressionId)

      var nextId = expressionId
      var parent
      var possibleValueExpression = expression

      while(parent = program.getParentOf(nextId)) {
        if (parent.kind == "object literal") {
          var keyPair = program.getPairForValueId(possibleValueExpression.id)

          return keyPair
        }
        possibleValueExpression = parent
        nextId = parent.id
      }
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
      return
      var orig = verticalCameraOffset

      verticalCameraOffset += lines

      var containerElement = document.querySelector(".two-columns")

      var transform = "translateY("+(verticalCameraOffset*-32)+"px)"

      containerElement.style.transform = transform
    }


    return function() {
      var args = Array.prototype.slice.call(arguments)

      return new (Function.prototype.bind.apply(LineControls, [null].concat(args)))
    }
  }
)