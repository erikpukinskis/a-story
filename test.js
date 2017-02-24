var runTest = require("run-test")(require)


runTest(
  "convert object to expression",
  ["./an-expression"],
  function(expect, done, anExpression) {
    var expression = anExpression.objectLiteral({balance: 10})

    expect(expression.valuesByKey.balance.number).to.equal(10)

    done()
  }
)


runTest(
  "function literals inside function literals",
  ["./an-expression"],
  function(expect, done, anExpression) {
    var expression = anExpression.functionLiteral(funcWithinFunc)

    function funcWithinFunc() {
      return function(sass, me) {
        alert()
        function bar() {
          return foo("bar")
        }
      }
      var f = true
    }

    expect(expression.kind).to.equal("function literal")

    var inner = expression.body[0]

    expect(inner.kind).to.equal("return")

    var alertExpression = inner.expression.body[0]

    expect(alertExpression.kind).to.equal("function call")

    done()
  }
)
