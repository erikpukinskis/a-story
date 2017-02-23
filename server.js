var library = require("module-library")(require)

library.using([
  "./bridge-to" // need this until we can unify this with browser-bridge or make it its own module or something.
], function() {})




library.using(
  [
    "web-site",
    "browser-bridge",
    "bridge-module",
    "web-element",
    "./draw-expression",
    "./an-expression",
    "./load-sample-home-page",
    "./module",
    "./boot-program",
  ],
  function(site, BrowserBridge, bridgeModule, element, drawExpression, anExpression, sampleHomePage, Module, bootProgram) {


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

    bootProgram.on(bridge, program, programName)

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

    site.addRoute(
      "get",
      "/",
      bridge.sendPage(
        [head, body, stylesheet]
      )
    )

    site.start(4050)
  }
)
