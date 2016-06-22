var loadedProgram = anExpression({
  kind: "function literal",
  argumentNames: ["element", "bridgeTo"],
  body: [
    {
      kind: "variable assignment",
      variableName: "sup",
      expression: {
        kind: "function call",
        functionName: "element",
        arguments: [
          expressions.stringLiteral(
            "sup family"
          ),
          {
            kind: "function call",
            functionName: "element.style",
            arguments: [styleObject()]
          }
        ]
      }
    },
    {
      kind: "function call",
      functionName: "bridgeTo.webPage",
      arguments: [
        {
          kind: "function literal",
          argumentNames: ["page"],
          body: [sendPage()]
        }
      ]
    }
  ]
})


function styleObject() {
  return {
    kind: "object literal",
    valuesByKey:
      {
    "font-size": expressions.stringLiteral("60pt"),
    "font-family": expressions.stringLiteral("georgia")
      }
  }
}

function sendPage() {
  return {
    kind: "function call",
    functionName: "page.send",
    arguments: [
      {
        kind: "variable reference",
        variableName: "sup"
      }
    ]
  }
}

