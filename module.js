var library = require("module-library")(require)

module.exports = library.export(
  "module",
  ["an-expression", "function-call"],
  function(anExpression, functionCall) {

    function Module(program, name) {
      this.program = program
      this.name = name
      this.run = run.bind(this)
      this.updateDependencies = updateDependencies.bind(this)
      this.depsAvailable = false
      this.loadDependencies = loadDependencies.bind(this)
    }

    function run() {
      window.__nrtvFocusSelector = ".output"

      var out = document.querySelector(".output")

      if (!out) {
        throw new Error("Looked for a .output element to render program into, but didn't find one.")
      }
      out.innerHTML = ""

      var moduleExpression = packageExpression(this.program.rootExpression())

      anExpression.run(moduleExpression, this.name)
      window.__nrtvFocusSelector = null

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

    function loadDependencies(deps, callback) {
      var program = this.program
      var package = program.rootExpression()

      deps.forEach(function(dep) {
        addScriptTag(dep)
      })

      waitForScripts(callback)

    }

    function updateDependencies(parent, line, callback) {

      if (line.kind != "function call") { return }

      var program = this.program
      var package = program.rootExpression()
      var alreadyIn = package.argumentNames

      getDeps(line).forEach(requireIt)

      function requireIt(dep) {
        var isMissing = !contains(alreadyIn, dep)

        if (isMissing) {
          program.addFunctionArgument(package.id, dep)
          addScriptTag(dep)
        }
      }

      waitForScripts(callback)
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


    var pendingScripts = []

    function addScriptTag(dep) {
      var moduleName = dasherize(dep)

      pendingScripts.push(moduleName)

      var el = document.createElement("script")
      el.setAttribute("src", "/library/"+moduleName+".js")
      el.setAttribute("type","text/javascript")

      var ready = functionCall("library.get").withArgs("module").methodCall("ready").withArgs(moduleName)

      el.setAttribute("onload", ready.evalable())

      document.getElementsByTagName("head")[0].appendChild(el)
    }

    var waitingForScripts = []
    function waitForScripts(callback) {
      if (pendingScripts.length < 1) {
        callback()
      } else {
        waitingForScripts.push(callback)
      }
    }

    Module.ready = function(name) {
      remove(pendingScripts, name)
      if (pendingScripts.length > 0) {
        return
      }

      var callback
      while(
        callback = waitingForScripts.shift()
      ) {
        callback()
      }
    }

    function remove(array, item) {
      var i = array.indexOf(item)
      if (i >= 0) {
        array.splice(i, 1)
      }
    }

    Module.prepareBridge = function(bridge) {
      bridge.asap("var using = library.using.bind(library)")
    }

    return Module
  }
)

