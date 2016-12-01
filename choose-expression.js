var library = require("module-library")(require)

module.exports = library.export(
  "choose-expression",
  ["./menu", "./an-expression"],
  function(menu, anExpression) {

    var expressionChoices = [
      menu.choice(
        "drawScene(...)",
        anExpression({
          kind: "function call",
          functionName: "drawScene",
          arguments: [
            triangle()
          ]
        })
      ),

      menu.choice(
        "addHtml(\"<...>\")",
        anExpression({
          kind: "function call",
          functionName: "addHtml",
          arguments: [
            anExpression.stringLiteral("")
          ]
        })
      ),

      menu.choice(
        "4 verticies",
        anExpression.arrayLiteral([
           1.0,  1.0,  0.0,
          -1.0,  1.0,  0.0,
           1.0, -1.0,  0.0,
          -1.0, -1.0,  0.0
        ])
      ),

      menu.choice(
        "4 colors",
        anExpression.arrayLiteral([
          1.0, 0.8, 0.2, 1.0,
          0.9, 0.7, 0.4 , 1.0,
          0.8, 0.7, 0.6, 1.0,
          0.7, 0.6, 0.8, 1.0
        ])
      ),

      menu.choice(
        "Number",
        anExpression({
          kind: "number literal",
          number: 0
        })
      ),

      menu.choice(
        "bridgeTo.browser(...)",
        anExpression({
          kind: "function call",
          functionName: "bridgeTo.browser",
          arguments: [
            {
              kind: "function literal",
              argumentNames: [],
              body: [anExpression.emptyExpression()]}
          ]
        })
      ),

      menu.choice(
        "\"some text\"",
        anExpression({
          kind: "string literal",
          string: ""
        })
      ),

      menu.choice(
        "var yourVariable =",
        anExpression({
          kind: "variable assignment",
          expression: anExpression.emptyExpression(),
          variableName: "fraggleRock"
        })
      ),
    ]

    function triangle() {
      return anExpression({
        kind: "array literal",
        items: [
          anExpression.objectLiteral({
            name: "triangle",
            position: [-1.5, 0.0, -7.0],
            verticies: [
               0.0,  1.0,  0.0,
              -1.0, -1.0,  0.0,
               1.0, -1.0,  0.0
            ],
            pointCount: 3,
            colors: [
              1.0, 0.4, 0.6, 1.0,
              0.9, 0.4, 0.7, 1.0,
              0.8, 0.4, 0.9, 1.0
            ]
          }),
        ]
      })
    }

    return function chooseExpression(callback) {
      menu(expressionChoices, callback)
    }
  }
)