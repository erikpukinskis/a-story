var library = require("nrtv-library")(require)

library.using(
  [
    "nrtv-server",
    "nrtv-browser-bridge",
    "bridge-module",
    "nrtv-element",
    "./draw-expression",
    "./an-expression",
    "./choose-expression"
  ],
  function(server, BrowserBridge, bridgeModule, element, drawExpression, anExpression, chooseExpression) {


    var emptyProgram = anExpression({
      kind: "function literal",
      argumentNames: [],
      body: [
        anExpression.emptyExpression()
      ]
    })


    var bridge = new BrowserBridge()
    drawExpression.prepareBridge(bridge)

    var chooseExpression = bridgeModule(library, "choose-expression", bridge)

    debugger
    
    var program = drawExpression(emptyProgram,
      {
        chooseExpression: chooseExpression
      }
    )

    var head = element([
      element("script", {src: "/dependencies/tap-out.js"}),
      element("script", {src: "/dependencies/element.js"}),
      element("script", {src: "/dependencies/function-call.js"}),
      element("script", {src: "/dependencies/add-html.js"})
    ])


    var body = element(".two-columns", [
      element(
        ".column",
        element(".output")
      ),
      element(".column", [
        element(".program-header"),
        element(".program", program)
      ])
    ])

    var stylesheet = element("link", {
      rel: "stylesheet",
      href: "styles.css"
    })

    server.addRoute(
      "get",
      "/",
      bridge.sendPage(
        [head, body, stylesheet]
      )
    )

    server.addRoute(
      "get",
      "/styles.css",
      function(xxxx, response) {
        response.sendFile(__dirname+"/styles.css")
      }
    )

    server.addRoute(
      "get",
      "/dependencies/:name.js",
      function(request, response) {
        var name = request.params.name
        if (name.match(/[^a-z-]/)) {
          throw new Error("Dependencies can only have lowercase letters and dash. You asked for "+name)
        }
        response.sendFile(__dirname+"/build/"+name+".js")
      }
    )

    server.start(4050)
  }
)
