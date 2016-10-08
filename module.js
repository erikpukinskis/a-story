var library = require("nrtv-library")(require)

module.exports = library.export(
  "module",
  ["an-expression", "add-html"],
  function(anExpression) {

    function Module(program, name) {
      this.program = program
      this.name = name
      this.run = run.bind(this)
      this.updateDependencies = updateDependencies.bind(this)
      this.depsAvailable = false
    }

    function run() {
      if (!this.depsAvailable) {
        this.program.rootExpression().argumentNames.map(addScriptTag)
      }

      window.__nrtvFocusSelector = ".output"

      document.querySelector(".output").innerHTML = ""

      var moduleExpression = packageExpression(this.program.rootExpression())

      anExpression.run(moduleExpression, name)
    }

    function packageExpression(functionLiteral) {

      var using = {
        kind: "function call",
        functionName: "using",
        arguments: [
          {
            kind: "array literal",
            items: argumentNamesToStringLiterals(functionLiteral)
          },
          functionLiteral
        ]
      }

      return using
    }

    function argumentNamesToStringLiterals(functionLiteral) {

      var names = functionLiteral
        .argumentNames
        .map(
          function(camelCase) {
            return anExpression.stringLiteral(
              dasherize(camelCase)
            )
          }
        )

      return names
    }

    function dasherize(camelCase) {
      var word = null
      var words = []

      for(var i=0; i<camelCase.length; i++) {
        var char = camelCase[i]
        var isUpper = char == char.toUpperCase()

        if (isUpper && !word) {
          word = char.toLowerCase()
        } else if (isUpper) {
          words.push(word)
          word = char.toLowerCase()
        } else if (!isUpper && !word) {
          word = char
        } else {
          word = word + char
        }
      }

      words.push(word)

      var dashed = words.join("-")

      return dashed
    }

    function updateDependencies(parent, line) {

      if (line.kind != "function call") { return }

      var deps = getDeps(line)
      var package = getPackageFunctionLiteral(parent)
      var program = this.program

      deps.forEach(requireIt)

      function requireIt(dep) {
        var isMissing = package.argumentNames.indexOf(dep) == -1
        if (isMissing) {
          addDependency(program, package, dep)
        }
      }
    }

    function getDeps(newExpression) {
      var deps = []
      var lines = newExpression.body
      var name = newExpression.functionName

      if (name) {
        var parts = name.split(".")
        deps.push(parts[0])
      }

      if (lines) {
        for(var i=0; i<lines; i++) {
          var moreDeps =
            getDeps(lines[i])
          deps = deps.concat(modeDeps)
        }
      }

      return deps
    }


    function getPackageFunctionLiteral(expression) {
      if (expression.kind == "function literal") {
        return expression
      }
    }

    function addDependency(program, package, dep) {
      program.addFunctionArgument(package.id, dep)

      addScriptTag(dep)
    }

    function addScriptTag(dep) {

      var el = document.createElement("script")
      el.setAttribute("src", "/dependencies/"+dasherize(dep)+".library.js")
      el.setAttribute("type","text/javascript")

      document.getElementsByTagName("head")[0].appendChild(el)
    }

    Module.prepareBridge = function(bridge) {
      bridge.asap("var using = library.using.bind(library)")
    }

    return Module
  }
)

