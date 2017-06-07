var library = require("module-library")(require)

module.exports = library.export(
  "line-controls",
  ["web-element", "function-call", "add-html", "add-line", "add-key-pair", "scroll-to-select", "./choose-expression", "theme"],
  function(element, functionCall, addHtml, addLine, addKeyPair, scrollToSelect, chooseExpression, theme) {

    var selectionIsHidden = true
    var controlsAreVisible
    var controlsSelector

    function LineControls(tree, bridge) {

      this.tree = tree
      this.bridge = bridge
       
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

      var selectedId = selectedElement.id

      var isLine = this.tree.getRole(selectedId) == "function literal line"

      var isItem = this.tree.getRole(selectedId) == "array item"

      var pairId = getSelectedKeyPairId(this.tree, selectedId)

      controlsSelector = ".controls-for-"+selectedId

      if (pairId) {
        showKeyValueControls(this.bridge, pairId, this.tree)
      } else if (isLine) {
        showLineControls(this.bridge, selectedElement, this.tree)
      } else if (isItem) {
        showArrayItemControls(this.bridge, selectedElement, this.tree)
      }

    }


    function hideControls() {
      controlsAreVisible = false
      
      if (!controlsSelector) { return }

      var controls = document.querySelectorAll(controlsSelector)

      setDisplay(controls, "none")

      offsetCameraUp(-1)
    }

    function showArrayItemControls(bridge, lineElement, tree) {

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
            bridge.asBinding(),
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



    function showLineControls(bridge, lineElement, tree) {

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
            bridge.asBinding(),
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

    function showKeyValueControls(bridge, pairId, tree) {
      throw new Error("refactor to use pairId instead of keyPair")

      var pairElement = document.getElementById(pairId)

      // we have expr-lf06, but we're looking for expr-ts

      var objectId = tree.getAttribute("objectId", pairId)
      var key = tree.getAttribute("key", pairId)

      showPlusses(
        pairElement,
        "",
        function addClickHandler(plusButton, relativeToThisId, relationship) {

          var add = functionCall("library.get(\"add-key-pair\")")

          add = add.withArgs(
            bridge.asBinding(),
            tree.id,
            plusButton.assignId(),
            relationship,
            objectId,
            key
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

    function getSelectedKeyPairId(tree, expressionId) {

      var nextId = expressionId
      var parentId
      var possibleValueId = expressionId

      while(parentId = tree.getParentOf(nextId)) {

        var parentIsObject = tree.getAttribute("kind", parentId) == "object literal"

        if (parentIsObject) {
          return tree.getAttribute("pairId", possibleValueId)
        }

        possibleValueId = parentId
        nextId = parentId
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
        "color": theme.canary,
        "display": "inline-block",
        "width": "2em",
        "font-weight": "bold",
        "margin-left": "-0.2em",
        "cursor": "pointer",

        ".array-item": {
          "color": theme.electric,
        }
      }),

      element.style(".menu-item.button", {
        "background-color": theme.canary,
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