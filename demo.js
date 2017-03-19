var library = require("module-library")(require)

library.using(
  ["web-host", "an-expression", "./", "javascript-to-ezjs"],
  function(host, anExpression, renderExpression, javascriptToEzjs) {

    function juice(bar) {
      return function(bridge) {
        bridge.send("hello, world")
      }
    }


    function buildAHouse(issueBond, showSource, library, renderBond) {
      var buildPanel = issueBond([
        "cut studs to length",
        "cut track to length",
        "crimp",
        "add sheathing",
        "flipsulate",
        "add sheathing"]
      )

      issueBond.expense(
        buildPanel,
        "labor",
        "$100"
      )

      checkBook(
        "someString",
        {"one of": 1001, "two-w3":2222}
      )

      showSource.hostModule(
        library,
        "render-bond",
        buildPanel
      )

      return buildPanel
    }


    console.log("HAM!", buildAHouse.toString())
    host.onSite(function(site) {
      renderExpression.prepareSite(site)
    })

    host.onRequest(function(getBridge) {

      var bridge = getBridge()

      var functionLiteral = javascriptToEzjs(buildAHouse.toString())

      var tree = anExpression()

      renderExpression(bridge, functionLiteral, tree)
    })

  }
)

