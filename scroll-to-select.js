var library = require("module-library")(require)

module.exports = library.export(
  "scroll-to-select",
  ["add-html", "web-element"],
  function(addHtml, element) {

    var MINIMUM_PAUSE = 750
    var SELECTOR_TOP = 120
    var SELECTOR_HEIGHT = 32
    var SELECTOR_BOTTOM = SELECTOR_TOP+SELECTOR_HEIGHT

    var possibleIds
    var showCallback
    var hideCallback
    var currentSelection
    var selectorIsVisible
    var controlsAreVisible

    function scrollToSelect(options) {
      showCallback = options.show
      hideCallback = options.hide
      possibleIds = options.possibleIds

      window.onscroll = updateSelection
      addHtml(element(".selector", "EZJS").html())
    }

    function updateSelection() {

      if (controlsAreVisible) {
        hideCallback()
        controlsAreVisible = false
      }

      var newSelection = getSelectedElement()

      var shouldBeHidden = !newSelection
      var shouldBeVisible = !shouldBeHidden

      if (shouldBeHidden &&
        selectorIsVisible) {
        document.querySelector(".selector").style.display = "none"
        selectorIsVisible = false
      }

      if (shouldBeVisible && !selectorIsVisible) {
        document.querySelector(".selector").style.display = "block"
        selectorIsVisible = true
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

      afterASecond(function() {
        if (!currentSelection) { return }
        showCallback(currentSelection)
        controlsAreVisible = true
      })
    }

    function getSelectedElement() {

      for(var i=possibleIds.length-1; i>=0; i--) {

        var id = possibleIds[i]
        var el = document.getElementById(id)

        if (!el) {
          continue
        }

        if (elementOverlapsSelector(el)) {
          return el
        }
      }

    }
    
    function elementOverlapsSelector(el) {
      var rect = el.getBoundingClientRect()

      var startsAboveLine = rect.top < SELECTOR_BOTTOM

      var endsAboveLine = rect.bottom < SELECTOR_TOP

      return startsAboveLine && !endsAboveLine
    }

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

    return scrollToSelect
  }
)