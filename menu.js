
var menu = (function() {
  var values = []
  var menuCallback

  var template = element.template(
    ".menu",
    function() {
      for(var i=1; i<arguments.length; i++) {

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

  var voxelContents = [
    [],[],[],[]
  ]

  var voxelIds = [
    [],[],[],[]
  ]

  function setContent(row, col, content) {
    voxelContents[row][col] = content
    var el = document.getElementById(voxelIds[row][col])
    el.innerHTML = content
    el.classList.add("occupied-voxel")
    deleteMenu(row, col)
    openMenu = null
  }

  function transform(x, y) {
    return "translate("
      +(x)
      +"px,"
      +(y)
      +"px)"
  }

  var openMenu

  var menuCache = [
    [],[],[],[]
  ]

  function closeOpenMenu() {
    if (openMenu) {
      var el = document.getElementById(openMenu.id)
      el.style.display = "none"
      el.classList.remove("menu-voxel")
      openMenu = null
    }
  }

  function deleteMenu(row, col) {
    var id = menuCache[row][col].id
    delete menuCache[row][col]
    var menu = document.getElementById(id)
    body().removeChild(menu)
  }

  function handleAttention(row, col) {
    var cached = menuCache[row][col]
    var wasAlreadyOpen = openMenu && openMenu == cached

    closeOpenMenu()

    addClassToVoxel(row, col, "menu-voxel")

    if (wasAlreadyOpen) {
      // leave it closed
    } else if (cached) {
      openMenu = cached
      var el = document.getElementById(openMenu.id)
      el.style.display = "block"
    } else {
      var content = voxelContents[row][col]
      var choices = ["function", "var", "define"]
      if (content) {
        var i = choices.indexOf(content)
        choices.splice(i, 1, null)
      }
      openMenu = menu(row, col, choices)
      openMenu.assignId()
      addToDom(openMenu.html())
      menuCache[row][col] = openMenu
    }
  }

  function addClassToVoxel(row, col) {
    var id = ".voxel-0-0-"+row+"-"+col
    var el = document.querySelector(id)
    el.classList.add("menu-voxel")  
  }

  function removeClassFromVoxel(row, col) {
    var id = ".voxel-0-0-"+row+"-"+col
    var el = document.querySelector(id)
    el.classList.remove("menu-voxel")  
  }

  var container

  function showMenu()  {
    var menuElement = template.apply(null, arguments)

    var wrapped = tapOut.catcher(
      menuElement,
      function() {
        console.log("cancelled menu!")
      }
    )

    wrapped.attributes.display = "block"
    addHtml(wrapped.html())
  }

  showMenu.choice = function (label, value) {
    return {label: label, value: value}
  }

  showMenu.choose = function(i, event) {
    menuCallback(values[i])
    var el = document.querySelector(".menu")
    el.style.display = "none"
    event.preventDefault()
  }

  return showMenu

})()