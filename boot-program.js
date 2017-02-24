var library = require("module-library")(require)

module.exports = library.export(
  "boot-program",
  ["./module", "./line-controls", "./program"],
  function(Module, lineControls, Program) {


    function bootProgram(programName, programData) {

      var program = new Program(programData)

      var controls = lineControls(program)

      var mod = new Module(program, programName)

      var dependencies = program.rootExpression().argumentNames

      mod.loadDependencies(dependencies, function() {
        mod.run() 
      })

      program.onchanged(function(changes) {
        if (changes.linesAdded) {
          lineControls.offsetCameraUp(linesAdded)
        }

        mod.run()
      })

      program.onnewexpression(function(parent, line) {
        mod.updateDependencies(parent, line, mod.run)
      })
    }

    bootProgram.prepareBridge = function(bridge) {
      Module.prepareBridge(bridge)
    }

    return bootProgram

  }
)
