var library = require("module-library")(require)

module.exports = library.export(
  "menu",
  ["web-element", "tap-away", "add-html"],
  function(element, tapAway, addHtml) {
    var values
    var menuCallback
    var containerId

    var template = element.template(
      ".menu",
      function() {

        values = []
        var childElements = this.children

        for(var i=0; i<arguments.length; i++) {

          if (typeof arguments[i] == "function") {

            menuCallback = arguments[i]

          } else if(Array.isArray(arguments[i])) {

            arguments[i].forEach(addChoice)

          } else {

            addChoice(arguments[i])

          }
        }

        function addChoice(choice) {

          var index = values.length

          var onclick = "__chooseFromMenu(\""+index+"\", event)"

          values[index]= choice.value

          childElements.push(element(
            ".menu-item.button",
            {
              onclick: onclick
            },
            choice.label && element.raw(choice.label) || []
          ))                  
        }

      }
    )

    function chooseFromMenu(i, event) {
      event.preventDefault()
      document.getElementById(containerId).style.display = "none"
      menuCallback(values[i])
    }

    function showMenu()  {
      var menuElement = template.apply(null, arguments)

      container = tapAway.catcher(
        menuElement,
        function() {
          console.log("cancelled menu!")
        }
      )
      containerId = container.assignId()

      container.attributes.display = "block"

      addHtml(container.html())

      if (!window.__chooseFromMenu) {
        window.__chooseFromMenu = chooseFromMenu
      }
    }

    showMenu.choice = function (label, value) {
      return {label: label, value: value}
    }


    return showMenu

  }
)
