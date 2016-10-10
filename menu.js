var library = require("nrtv-library")(require)

module.exports = library.export(
  "menu",
  ["web-element"],
  function(element) {
    var values
    var menuCallback

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

          var onclick = "menu.choose(\""+index+"\", event)"

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

    function chooseFromMenu(containerId, menuCallback, i, event) {
      event.preventDefault()
      document.getElementById(containerId).hide()
      menuCallback(values[i])
    }

    function showMenu()  {
      var menuElement = template.apply(null, arguments)

      container = tapOut.catcher(
        menuElement,
        function() {
          console.log("cancelled menu!")
        }
      )
      container.assignId()

      container.attributes.display = "block"

      addHtml(container.html())
    }

    showMenu.choice = function (label, value) {
      return {label: label, value: value}
    }


    return showMenu

  }
)
