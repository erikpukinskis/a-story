var library = require("nrtv-library")(require)

module.exports = library.export(
  "program",
  function() {

    function Program() {
      this.expressionIds = []
      this.expressionsById = {}
      this.keyPairsByValueId = {}
      this.parentExpressionsByChildId = {}
      this.onchangedCallbacks = []
      this.onnewexpressionCallbacks = []
    }

    Program.prototype.rootExpression = function() {
      var rootId = this.expressionIds[0]
      return this.expressionsById[rootId]
    }

    Program.prototype.onchanged = function(callback) {
      this.onchangedCallbacks.push(callback)
    }

    Program.prototype.onnewexpression = function(callback) {
      this.onnewexpressionCallbacks.push(callback)
    }

    Program.prototype.changed = function() {

      window.__nrtvFocusSelector = ".output"

      document.querySelector(".output").innerHTML = ""

      var expression = this.rootExpression()

      this.onchangedCallbacks.forEach(function(callback) {
        callback(expression)
      })
    }

    Program.prototype.newexpression =
      function(parent, newExpression) {
        this.onnewexpressionCallbacks.forEach(function(callback) {

          callback(parent, newExpression)
        })
      }

    function call(func) { func() }

    Program.prototype.data = function() {
      var parents = {}
      var dehydratedById = {}
      var program = this

      this.expressionIds.forEach(function(id) {

        var expression = program.expressionsById[id]
        var parentId = program.parentExpressionsByChildId[id]

        if (parentId) {
          parents[id] = parentId
        }

        var dehydrated = {}
        for(var key in expression) {
          dryCopy(key, expression, dehydrated)
        }

        dehydratedById[id] = dehydrated
      })

      return {
        expressionIds: this.expressionIds,
        expressionsById: dehydratedById,
        keyPairsByValueId: null,
        parents: parents
      }
    }

    function dryCopy(attribute, expression, dehydrated) {

      switch(attribute) {
        case "body":
        case "arguments":
        case "items":
          dehydrated[attribute] = expression[attribute].map(toId)
          break
        case "expression":
          dehydrated[attribute] = toId(expression[attribute])
          break
        case "valuesByKey":
          dehydrated[attribute] = {}
          for(var key in expression.valuesByKey) {
            dehydrated[attribute][key] = toId(expression[attribute][key])
          }
          break
        default:
          dehydrated[attribute] = expression[attribute]
      }
    }

    function toId(x) { return x.id }

    function wetCopy(attribute, dehydrated, expressionsById) {

      function toExpression(id) {
        return expressionsById[id]
      }
      switch(attribute) {
        case "body":
        case "arguments":
        case "items":
          dehydrated[attribute] = dehydrated[attribute].map(toExpression)
          break
        case "expression":
          dehydrated[attribute] = toExpression(dehydrated[attribute])
          break
        case "valuesByKey":
          var ids = dehydrated.valuesByKey
          dehydrated.valuesByKey = {}
          for(var key in ids) {
            dehydrated.valuesByKey[key] = toExpression(ids[key])
          }
          break
      }
    }

    Program.prototype.load = function(data) {

      this.expressionIds = data.expressionIds

      this.expressionsById = data.expressionsById

      this.keyPairsByValueId

      this.parentExpressionsByChildId = {}

      var program = this

      function rehydrate(id) {

        var dehydrated = program.expressionsById[id]

        for(var attribute in dehydrated) {
          wetCopy(attribute, dehydrated, program.expressionsById)
        }

        var parentId = data.parents[id]

        if (parentId) {
          program.parentExpressionsByChildId[id] = program.expressionsById[parentId]
        }
      }

      this.expressionIds.forEach(rehydrate) 
    }



    Program.prototype.getProperty = function(property, expressionId) {
      var expression = this.expressionsById[expressionId]
      return expression[property]
    }

    Program.prototype.setProperty = function(property, expressionId, newValue, oldValue) {
      var expression = this.expressionsById[expressionId]
      expression[property] = newValue
      this.changed()
    }

    Program.prototype.setFloatProperty = function(property, expressionId, newValue, oldValue) {
      var expression = expressionsById[expressionId]
      expression[property] = parseFloat(newValue)
      this.changed()
    }

    Program.prototype.getKeyName = function(id) {
      var pairExpression = this.expressionsById[id]
      return pairExpression.key
    }

    Program.prototype.onKeyRename = function(pairId, newKey) {
      var pairExpression = this.expressionsById[pairId]
      var object = pairExpression.objectExpression.valuesByKey
      var oldKey = pairExpression.key

      pairExpression.key = newKey
      object[newKey] = object[oldKey]

      delete object[oldKey]
      this.changed()
    }

    Program.prototype.getArgumentName = function(expressionId, index) {
      var expression = this.expressionsById[expressionId]

      return expression.argumentNames[index]
    }

    Program.prototype.getPairForValue = function(valueElementId) {
      return this.keyPairsByValueId[valueElementId]
    }

    Program.prototype.renameArgument = function(expressionId, index, newName) {
      var expression = this.expressionsById[expressionId]

      expression.argumentNames[index] = newName

      this.changed()
    }

    Program.prototype.addFunctionArgument = function(expressionId, name) {

      var functionExpression = this.expressionsById[expressionId]

      var index = functionExpression.argumentNames.length

      functionExpression.argumentNames.push(name)

      return index
    }

    Program.prototype.addVirtualExpression = function(newExpression) {

      this.expressionsById[newExpression.id] = newExpression
    }

    Program.prototype.addExpressionAt = function(newExpression, i) {

      this.expressionsById[newExpression.id] = newExpression

      this.expressionIds[i] = newExpression.id
    }


    Program.prototype.insertExpression = function(newExpression, relationship, relativeToThisId) {

      if (!relationship) {
        this.expressionsById[newExpression.id] = newExpression

        this.expressionIds.push(newExpression.id)

        return
      }

      if (relationship == "before") {

        var splicePosition = indexBefore(this, expressionIds, relativeToThisId)
        var deleteThisMany = 0

      } else if (relationship == "after") {

        var splicePosition = indexAfter(this, expressionIds, relativeToThisId)
        var deleteThisMany = 0

      } else if (relationship == "inPlaceOf") {

        var splicePosition = 0
        var deleteThisMany = 1

      } else { throw new Error() }

      this.parentExpressionsByChildId[newExpression.id] = parentExpression

      this.expressionIds.splice(splicePosition, deleteThisMany, newElement.id)
    }

    function lastDescendantAfter(program, ids, startIndex) {

      var possibleParentIds = [elementIds[startIndex]]
      var lastDescendant = startIndex

      for(var i = startIndex+1; i<elementIds.length; i++) {

        var testId = ids[i]
        var testExpr = program.expressionsById[testId]

        var testParent = program.parentExpressionsByChildId[testId]

        if (!testParent) {
          var isDescendant = false
        } else {
          var testParentId = testParent.elementId
          var isDescendant = contains(possibleParentIds, testParent.elementId)
        }

        if (isDescendant) {
          possibleParentIds.push(testId)
          lastDescendant = i
        } else {
          return lastDescendant
        }      
      }

      return lastDescendant
    }

    function indexBefore(program, ids, relativeId) {

      for(var i = 0; i < ids.length; i++) {
        if (list[i] == relativeId) {
          return i
        }
      }

      throw new Error("Wanted to insert before "+relativeId+" but I can't find it!")

    }

    function indexAfter(program, ids, relativeId) {

      var parentIdStack = []

      for(var i = 0; i < ids.length; i++) {
        var testId = ids[i]

        if (testId == relativeId) {
          return lastDescendantAfter(program, ids, i)+1
        }
      }

      throw new Error("Wanted to insert after "+relativeId+" but I can't find it!")
    }

    Program.prototype.setParent = function(childId, parent) {
      this.parentExpressionsByChildId[childId] = parent
    }

    Program.prototype.setKeyValue = function(pairExpression, newExpression, newElement) {

      var key = pairExpression.key

      var objectExpression = pairExpression.objectExpression

      var oldExpression = objectExpression.valuesByKey[key]

      objectExpression.valuesByKey[key] = newExpression

      if (oldExpression.id != newExpression.id) {

        delete program.parentExpressionsByChildId[oldExpression.id]

        delete program.keyPairsByValueId[oldExpression.id]
      }

      program.parentExpressionsByChildId[newExpression.id] = pairExpression.objectExpression

      program.keyPairsByValueId[newExpression.id] = pairExpression

    }

    function contains(array, value) {
      if (!Array.isArray(array)) {
        throw new Error("looking for "+JSON.stringify(value)+" in "+JSON.stringify(array)+", which is supposed to be an array. But it's not.")
      }
      var index = -1;
      var length = array.length;
      while (++index < length) {
        if (array[index] == value) {
          return true;
        }
      }
      return false;
    }

    return Program
  }
)