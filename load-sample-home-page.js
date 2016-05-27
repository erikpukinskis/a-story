
var expressions = aProgramAppeared

var loadedProgram = aProgramAppeared({
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
  functionName: "bridgeTo.webPage",
  arguments: [
    {
      kind: "function literal",
      argumentNames: ["page"],
      body: [
{
  kind: "function call",
  functionName: "page.send",
  arguments: [
    {
      kind: "variable reference",
      variableName: "sup"
    }
  ]
}
      ]
    }
  ]
}
  ]
})