var library = require("module-library")(require)

module.exports = library.export(
  "render-module",
  ["./draw-expression", "./an-expression", "browser-bridge", "bridge-module", "./boot-program", "web-element"],
  function(drawExpression, anExpression, BrowserBridge, bridgeModule, bootProgram, element) {

    function renderModule(bridge, singleton) {

      var module = singleton.__nrtvModule

      var functionLiteral = anExpression.functionLiteral(module.func)

      var program = drawExpression(functionLiteral, bridge)

      var programName = module.name || "unnamed"

      bootProgram.prepareBridge(bridge)

      bridge.asap(
        bridgeModule(library, "boot-program", bridge).withArgs(programName, program.data())
      )

      bridge.addToHead(
        element("link", {
          rel: "stylesheet",
          href: "/render-module/styles.css"
        })
      )

      bridge.send(program.element)
    }

    renderModule.prepareSite = function(site) {
      
      site.addRoute(
        "get",
        "/render-module/styles.css",
        site.sendFile(__dirname, "styles.css")
      )

      site.addRoute(
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

    }

    return renderModule
  }
)