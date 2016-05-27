var expressions = aProgramAppeared

function triangle() {

  var expression = {
    kind: "array literal",
    items: [
      aProgramAppeared.objectLiteral({
        name: "triangle",
        position: [-1.5, 0.0, -7.0]
      }),
      aProgramAppeared.objectLiteral({
        name: "other triangle",
        position: [1.5, 0.0, -7.0]
      })
    ]
  }

  return expression
}


var loadedProgram = aProgramAppeared({
  kind: "function literal",
  argumentNames: [],
  body: [
    {
      kind: "function call",
      functionName: "drawScene",
      arguments: [triangle()]
    },
  ]
})
