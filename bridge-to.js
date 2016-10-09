var library = require("nrtv-library")(require)

module.exports = library.export(
  "bridge-to",
  function() {
    return {
      webPage: handlePage,
      browser: handleBrowser
    }

    function handleBrowser(handler) {
      handler()
    }

    function handlePage(handler) {

      var page = {
        send: function(element) {
          var out = document.querySelector(window.__nrtvFocusSelector)

          out.innerHTML = element.html()

        }
      }

      handler(page)
    }

  }
)
