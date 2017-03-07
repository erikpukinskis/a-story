var library = require("module-library")(require)


module.exports = library.export(
  "render-expression",
  ["make-it-editable", "./expression-to-element", "./renderers", "bridge-module", "web-element"],
  function(makeItEditable, expressionToElement, renderers, bridgeModule, element) {

    function renderExpression(bridge, expression, program) {

      if (!bridge.remember("render-expression")) {

        bridgeModule(library, "renderers", bridge)

        bridge.addToHead(
          element("link", {
            rel: "stylesheet",
            href: "/render-module/styles.css"
          })
        )

        makeItEditable.prepareBridge(bridge)
      }

      var el = expressionToElement(expression, program)

      bridge.send(el)
    }

    renderExpression.prepareSite = function(site) {

      site.addRoute(
        "get",
        "/render-module/styles.css",
        site.sendFile(__dirname, "styles.css")
      )

    }

    return renderExpression
  }
)



