var library = require("nrtv-library")(require)

library.using([
  "./bridge-to" // need this until we can unify this with browser-bridge or make it its own module or something.
], function() {})


library.define(
  "boot-program",
  ["./module", "./line-controls", "./program"],
  function(Module, lineControls, Program) {


    return function bootProgram(programName, programData) {

      var program = new Program(programData)

      var controls = lineControls(program)

      var mod = new Module(program, name)

      var dependencies = program.rootExpression().argumentNames

      mod.loadDependencies(dependencies, function() {
        mod.run() 
      })

      program.onchanged(mod.run)

      program.onnewexpression(function(parent, line) {
        module.updateDependencies(parent, line, mod.run)
      })
    }

  }
)



library.using(
  [
    "nrtv-server",
    "browser-bridge",
    "bridge-module",
    "web-element",
    "./draw-expression",
    "./an-expression",
    "./load-sample-home-page",
    "./module",
    "boot-program",
  ],
  function(server, BrowserBridge, bridgeModule, element, drawExpression, anExpression, sampleHomePage, Module, bootProgram) {


    var emptyProgram = anExpression({
      kind: "function literal",
      argumentNames: [],
      body: [
        anExpression.emptyExpression()
      ]
    })


    var bridge = new BrowserBridge()

    var loadedExpression = sampleHomePage

    var program = drawExpression(loadedExpression, bridge)

    var programName = loadedExpression.name || "unnamed"

    Module.prepareBridge(bridge)

    bridge.asap(
      bridgeModule(library, "boot-program", bridge).withArgs(programName, program.data())
    )

    var head = element("head")

    var body = element("body",
      element(".two-columns", [
        element(
          ".column",
          element(".output")
        ),
        element(".column", [
          element(".program-header"),
          element(".program", program.element)
        ])
      ])
    )

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
      "/library/:name.js",
      function(request, response) {
        var name = request.params.name

        if (name.match(/[^a-z-]/)) {
          throw new Error("Dependencies can only have lowercase letters and dash. You asked for "+name)
        }

        var bridge = new BrowserBridge()

        var source = bridgeModule.definitionWithDeps(library, name, bridge)

        response.setHeader('content-type', 'text/javascript')

        response.send(source)
      }
    )

    server.start(4050)
  }
)
