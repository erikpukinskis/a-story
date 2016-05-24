
var expressions = aProgramAppeared

var loadedProgram = aProgramAppeared({
  kind: "function literal",
  argumentNames: ["element", "bridgeRoute"],
  body: [
{
  kind: "variable assignment",
  variableName: "page",
  expression: {
    kind: "function call",
    functionName: "element",
    arguments: [
      expressions.stringLiteral("sup family"),
      // expressions.stringLiteral("body"),
{
  kind: "function call",
  functionName: "element.style",
  arguments: [
    {
      kind: "object literal",
      object:
        {
      "background": expressions.stringLiteral("cornsilk"),
      "color": expressions.stringLiteral("orchid"),
      "font-size": expressions.stringLiteral("60pt"),
      "font-family": expressions.stringLiteral("georgia")
        }
    }
  ]
}
    ]
  }
},
{
  kind: "function call",
  functionName: "bridgeRoute",
  arguments: [
    expressions.stringLiteral("/"),
    {
      kind: "function literal",
      argumentNames: ["bridge"],
      body: [
{
  kind: "function call",
  functionName: "bridge.sendPage",
  arguments: [
    {
      kind: "variable reference",
      variableName: "page"
    }
  ]
}
      ]
    }
  ]
}
  ]
})