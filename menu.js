
var menu = (function() {
  var values = []
  var menuCallback

  var template = element.template(
    ".menu",
    function() {
      for(var i=0; i<arguments.length; i++) {

        if (typeof arguments[i] == "function") {
          menuCallback = arguments[i]
          continue
        }

        var choice = arguments[i]

        values[i] = choice.value

        var onclick = "menu.choose(\""+i+"\", event)"
   
        this.children.push(element(
          ".menu-item.button",
          {
            onclick: onclick
          },
          choice.label && element.raw(choice.label) || []
        ))                  
      }
    }
  )

  var container

  function showMenu()  {
    var menuElement = template.apply(null, arguments)

    container = tapOut.catcher(
      menuElement,
      function() {
        console.log("cancelled menu!")
      }
    )

    container.attributes.display = "block"

    addHtml(container.html())
  }

  showMenu.choice = function (label, value) {
    return {label: label, value: value}
  }

  showMenu.choose = function(i, event) {
    menuCallback(values[i])
    container.hide()
    event.preventDefault()
  }

  return showMenu

})()