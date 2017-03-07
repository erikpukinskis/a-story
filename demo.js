var library = require("module-library")(require)

library.using(
  ["web-host", "an-expression", "./"],
  function(host, anExpression, renderExpression) {

    var func = function(checkBook) {
      sanscrit("boo", "ba", "loo")
      sanscritic("boobaloo")

      return function(bridge) {
        var erik = checkBook("January paid")

        paid("Feburary rent", "-$2085.00", "2/6/2017")
        paid("Mom", "$100.00", "2/6/2017")
        paid("Teensy house gutter", "-7.63", "2/7/2017")
        paid("Sandwiches & Coffee", "-17.18", "2/6/2017")
        paid.soon("Lyft to Marie", "-9.29", "2/6/2016")

        erik.sendTo(bridge)
      }
    }

    host.onSite(function(site) {
      renderExpression.prepareSite(site)
    })

    host.onRequest(function(getBridge) {

      var bridge = getBridge()

      var expression = anExpression.functionLiteral(func)

      var program = anExpression.program()

      renderExpression(bridge, expression, program)
    })

  }
)