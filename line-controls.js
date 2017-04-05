var library = require("module-library")(require)

module.exports = library.export(
  "line-controls",
  ["web-element", "function-call", "add-html", "add-line", "add-key-pair", "scroll-to-select", "./choose-expression", "colors"],
  function(element, functionCall, addHtml, addLine, addKeyPair, scrollToSelect, chooseExpression, colors) {

    var selectionIsHidden = true
    var controlsAreVisible
    var controlsSelector

    function LineControls(tree) {

      this.tree = tree
       
      scrollToSelect({
        ids: tree.getIds(),
        onSelect: onSelect.bind(this),
        onUnselect: hideControls,
        text: "EZJS",
      })

    }


    function onSelect(selectedElement) {

      if (!selectedElement) {
        return
      }      

      var selectedExpressionId = selectedElement.id

      var pairExpression = getSelectedKeyPair(this.tree, selectedExpressionId)

      var expression = this.tree.get(selectedElement.id)

      var isLine = expression.role == "function literal line"

      var isItem = expression.role == "array item"

      controlsSelector = ".controls-for-"+selectedElement.id

      if (pairExpression) {
        showKeyValueControls(pairExpression, this.tree)
      } else if (isLine) {
        showLineControls(selectedElement, this.tree)
      } else if (isItem) {
        showArrayItemControls(selectedElement, this.tree)
      }

    }


    function hideControls() {
      controlsAreVisible = false
      
      if (!controlsSelector) { return }

      var controls = document.querySelectorAll(controlsSelector)

      setDisplay(controls, "none")

      offsetCameraUp(-1)
    }

    function showArrayItemControls(lineElement, tree) {

      showPlusses(
        lineElement,
        ".array-item",
        function addClickHandler(plusButton, relativeToThisId, relationship) {

          // hacky:

          var add = functionCall("library.get(\"add-line\")")

          // could be something like:
          //
          // var add = library.buildSingletonCall("add-line")

          add = add.withArgs(
            tree.id,
            plusButton.assignId(),
            relativeToThisId,
            relationship
          )

          var showMenu = functionCall("library.get(\"choose-expression\")")

          plusButton.onclick(showMenu.withArgs(add))
        }
      )

    }



    function showLineControls(lineElement, tree) {

      showPlusses(
        lineElement,
        ".function-literal-line",
        function addClickHandler(plusButton, relativeToThisId, relationship) {

          // hacky:

          var add = functionCall("library.get(\"add-line\")")

          // could be something like:
          //
          // var add = library.buildSingletonCall("add-line")

          add = add.withArgs(
            tree.id,
            plusButton.assignId(),
            relativeToThisId,
            relationship
          )

          var showMenu = functionCall("library.get(\"choose-expression\")")

          plusButton.onclick(showMenu.withArgs(add))
        }
      )

    }

    function showKeyValueControls(pair, tree) {

      var pairElement = document.getElementById(pair.id)

      // we have expr-lf06, but we're looking for expr-ts

      var objectExpression = pair.objectExpression

      showPlusses(
        pairElement,
        "",
        function addClickHandler(plusButton, relativeToThisId, relationship) {

          var add = functionCall("library.get(\"add-key-pair\")")

          add = add.withArgs(
            tree.id,
            plusButton.assignId(),
            relationship,
            objectExpression.id,
            pair.key
          )

          plusButton.onclick(add)
        }
      )

    }

    function showPlusses(selectedNode, styleSelector, addClickHandler) {

      var controls = document.querySelectorAll(controlsSelector)

      if (controls.length > 0) {
        setDisplay(controls, "block")
      } else {

        ["before", "after"].forEach(
          function(beforeOrAfter) {

            var plusButton = element(
              ".plus"+controlsSelector+styleSelector,
              "+"
            )
      
            addClickHandler(
              plusButton,
              selectedNode.id,
              beforeOrAfter
            )

            addHtml[beforeOrAfter](
              selectedNode,
              plusButton.html()
            )

          }
        )


      }

      offsetCameraUp(1)

      controlsAreVisible = true

    }

    function getSelectedKeyPair(tree, expressionId) {

      var expression = tree.get(expressionId)

      var nextId = expressionId
      var parent
      var possibleValueExpression = expression

      while(parent = tree.getParentOf(nextId)) {
        if (parent.kind == "object literal") {
          var keyPair = tree.getPairForValueId(possibleValueExpression.id)

          return keyPair
        }
        possibleValueExpression = parent
        nextId = parent.id
      }
    }

    function setDisplay(elements, value) {
      for(var i=0; i<elements.length; i++) {
        elements[i].style.display = value
      }
    }

    var verticalCameraOffset = 0

    function offsetCameraUp(lines) {
      return
      var containerElement = document.querySelector(".two-columns")

      var transform = "translateY("+(verticalCameraOffset*-32)+"px)"

      containerElement.style.transform = transform
    }

    function lineControls() {
      var args = Array.prototype.slice.call(arguments)

      return new (Function.prototype.bind.apply(LineControls, [null].concat(args)))
    }

    lineControls.offsetCameraUp = offsetCameraUp

    var stylesheet = element.stylesheet([
      element.style(".plus", {
        "color": colors.canary,
        "display": "inline-block",
        "width": "2em",
        "font-weight": "bold",
        "margin-left": "-0.2em",
        "cursor": "pointer",

        ".array-item": {
          "color": colors.electric,
        }
      }),

      element.style(".menu-item.button", {
        "background-color": colors.canary,
        "color": "black",

        ":hover": {
          "background-color": "#ff9"
        },
      }),
    ])

    lineControls.defineOn = function(bridge) {
      scrollToSelect.defineOn(bridge)
      bridge.addToHead(stylesheet)
    }
    return lineControls
  }
)