// GLOBAL API SHIT

var cachedBody
function body() {
  if (!cachedBody) {
    cachedBody = document.querySelector("body")
  }
  return cachedBody
}

function addToDom(html) {
  body().innerHTML = body().innerHTML + html
}


// SOME MIDDLEWARE PERHAPS?


// OUR PROGRAM



var program = {
  kind: "function call",
  functionName: "using",
  arguments: [
    // // "eriks-homepage",
    // {
    //   kind: "array literal",
    //   items: [
    //     "element",
    //     "bridge-route"
    //   ]
    // },
    // {
    //   kind: "function literal",
    //   argumentNames: ["element", "bridgeRoute"],
    //   body: [
    //     {//////////
    //       kind: "variable assignment",
    //       variableName: "page",
    //       expression: {
    //         kind: "function call",
    //         functionName: "element",
    //         arguments: [
    //           "body",
    //           {
    //             kind: "function call",
    //             functionName: "element.styles",
    //             arguments: [
    //               {
    //                 kind: "object literal",
    //                 object: 
    //                   {
    //                 "background": "smoke",
    //                 "color": "wood",
    //                 "font-family": "Georgia"
    //                   }
    //               }
    //             ]
    //           },
    //           "sup family"
    //         ]
    //       }
    //     }, /////////////////
    //     {
    //       kind: "function call",
    //       functionName: "bridgeRoute",
    //       arguments: [
    //         "/",
    //         {
    //           kind: "function literal",
    //           argumentNames: ["bridge"],
    //           body: [
    //         {
    //           kind: "function call",
    //           functionName: "bridge.sendPage",
    //           arguments: [
    //             {
    //               kind: "variable reference",
    //               variableName: "page"
    //             }
    //           ]
    //         }                
    //           ]
    //         }
    //       ]
    //     }//////////////////
    //   ]
    // }
  ]
}

function argumentsToElements(args) {
  var container = element(
    ".function-call-args"
  )
  
  for(var i=0; i<args.length; i++) {
    var expression = args[i]
    var isFunctionCall =      
      expression.kind
      == "function call"
    var arg = expressionToElement(
      expression)
    
    arg.classes.push(
      "function-argument")
    
    if (isFunctionCall) {
      arg.classes.push("call-in-call")
    }

    container.children.push(arg)
  }
  
  return container
}

var expressionsByElementId = {}

var functionCall = element.template(
  ".function-call",
  function(expression) {

    this.assignId()
    expressionsByElementId[this.id] = expression

    var button = element(
      "button.depth-1.function-call-name",
      expression.functionName,
      {onclick: "edit("+this.id+")"}
    )

    this.children.push(button)
    
    this.children.push(
      argumentsToElements(
        expression.arguments
      )
    )
  }
)

// interactive
function edit(id) {
  var el = document.getElementById(id)
  console.log("id is", id, "el is", el)
  el.style.border = "5px solid white"
}





var stringElement = element.template(
  "button.literal.depth-2",
  function(string) {
    this.children.push(
      element("span", "\"")
    )
    this.children.push(
      element.raw(string)
    )
    this.children.push(
      element("span", "\"")
    )
  }
)

var functionLiteral =
  element.template(
    ".function-literal.depth-2",
    function(expression) {
      var children = this.children

      children.push(
        element(
          "button.depth-2",
          "function"
        )
      )

      children.push(argumentNames(
        expression.argumentNames
      ))

      children.push(
        functionLiteralBody(
          expression.body
        )
      )

    }
   )

var functionLiteralBody = element.template(
  ".function-literal-body",
  function(lines) {

    this.children = lines.map(
      function(line) {
        return element(
          expressionToElement(line),
          ".function-literal-line"
        )
      }
    )

  }
)

              
function argumentNames(names) {
  return element(
    ".function-argument-names",
    names.map(argumentName)
  )
}

function argumentName(name) {
  return element(
    "button.argument-name",
    element.raw(name)
  )
}

var variableAssignment = element.template(
  ".variable-assignment",
  function(expression) {
    var lhs = element(
      "button.variable-name",
      [
        element("span", "var&nbsp;"),
        element("span",
          expression.variableName
        ),
        element("span", "&nbsp;=")
      ]
    )
    
    this.children.push(lhs)
    this.children.push(
      expressionToElement(
        expression.expression
      )
    )
  }
)

var objectLiteral = element.template(
  ".object-literal",
  function(expression) {
    var object = expression.object
    for(var key in object) {
      this.children.push(
        keyPair(key, object[key])
      )
    }
  }
)

var keyPair = element.template(
  ".key-pair",
  function(key, value) {

    this.children.push(element(
      "button.key.depth-2",
      [
        element("span", element.raw(key)),
        element("span", ":")
      ]
    ))
    
    this.children.push(
      expressionToElement(value)
    )
  }
)

var variableReference = element.template(
  "button.variable-reference",
  function(expression) {
    this.children.push(element.raw(
      expression.variableName
    ))
  }
)

var arrayLiteral = element.template(
  ".array-literal",
  function(expression) {
    this.children = expression.items.map(function(item) {
      var el = expressionToElement(item)
      el.classes.push("array-item")
      return el
    })
  }
)






var expressionHandlers = {
  "function call": functionCall,
  "function literal": functionLiteral,
  "variable reference": variableReference,
  "variable assignment": variableAssignment,
  "object literal": objectLiteral,
  "array literal": arrayLiteral
}

var elements = []
var expressions = []

function expressionToElement(expression, parent) {

  if (typeof expression == "string") {
    var el = stringElement(expression)
  } else {
    var el = expressionHandlers[
      expression.kind
    ](expression)
  }
    
  return el
}

function drawProgram(expression) {
  var program = expressionToElement(
    expression
  )
    
  var page = element(
    ".program", 
    [
      program,
      element(".logo", "EZJS")
    ]
  )

  addToDom(page.html())
}

drawProgram(program)














var menu = element.template(
  ".menu",
  function(row, col, items) {

    for(var i=0; i<items.length; i++) {
      var item = items[i]
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

drawVoxel()


function drawVoxel() {
  for(var row=0; row<4; row++) {
    for(var col=0; col<1; col++) {
      var id = "voxel-0-0-"+row+"-"+col

      var voxel = element(".voxel."+id, {
        style: "transform: "+transform(row, col),
        onclick: "handleAttention("+row+","+col+")"
      })
    
      voxelIds[row][col] = voxel.assignId()

      addToDom(voxel.html())
    }
  }
}

function transform(row, col) {
  return "translate("
    +(col*110)
    +"px,"
    +(row*60+1000)
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

// handleAttention(0, 0)



