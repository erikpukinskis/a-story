var library = require("module-library")(require)

library.using(
  ["web-host", "an-expression", "./", "javascript-to-ezjs", "tell-the-universe", "browser-bridge", "web-element"],
  function(host, anExpression, renderExpression, javascriptToEzjs, tellTheUniverse, BrowserBridge, element) {

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


    host.onSite(function(site) {
      renderExpression.prepareSite(site)
    })

    host.onRequest(function(getBridge) {

      var bridge = getBridge()

      var universe = tellTheUniverse.called("demo-module").withNames({anExpression: "an-expression"})

      // javascriptToEzjs.loud = true

      var tree = javascriptToEzjs(buildAHouse.toString(), universe)

      console.log("literal has "+tree.root().body.length+" lines")

      var partial = bridge.partial()

      renderExpression(partial, tree.root(), tree)

      console.log("literal has "+tree.root().body.length+" lines")

      setTimeout(function() {
        anExpression.forgetTrees()

        var id = tree.id
        tree = anExpression.getTree(id)

        console.log("forgot trees. "+id+" = "+JSON.stringify(tree))

        universe.playItBack()

        tree = anExpression.getTree(id)
        var source = anExpression.toJavascript(tree.root())

        console.log("===\nSOURCE:\n", source+"\n===\n")

        _wtf(tree)
      }, 5000)

      bridge.send(element(
        element.style({
          "margin-top": "175px"}),
        partial
      ))

    })

  }
)

