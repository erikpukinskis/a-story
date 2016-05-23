
thisExpressionExists({
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
      stringLiteralJson("sup family"),
      // stringLiteralJson("body"),
{
  kind: "function call",
  functionName: "element.style",
  arguments: [
    {
      kind: "object literal",
      object:
        {
      "background": stringLiteralJson("cornsilk"),
      "color": stringLiteralJson("orchid"),
      "font-size": stringLiteralJson("60pt"),
      "font-family": stringLiteralJson("georgia")
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
    stringLiteralJson("/"),
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