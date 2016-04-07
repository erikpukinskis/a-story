var makeMenu = (function() {

  var menu = element.template(
    ".menu",
    function(row, col, items) {

      for(var i=0; i<items.length; i++) {
        var item = items[i]
        console.log("adding", item)
        var v = 9-i
        var style = "transform: "
          +transform(row+i/1.86+.4, col+i/3.4+.22)
          +"; background: #"+v+v+"f"

        var onclick = "setContent("
          +row+", "
          +col+", "
          +JSON.stringify(item)
          +")"
   
        this.children.push(element(
          ".voxel.menu-item-voxel",
          {
            style: style,
            onclick: onclick
          },
          item && element.raw(item)
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

  function transform(row, col) {
    return "translate("
      +(col*110)
      +"px,"
      +(row*60)
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

  return menu

})()