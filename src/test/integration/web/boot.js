// overrides some default jasmine boot settings
// - don't run specs by default: only the ones selected run
(function() {
  'use strict';

  var queryString = new jasmine.QueryString({
    getWindowLocation: function() {
      return window.location;
    }
  });

  var specFilter = new jasmine.HtmlSpecFilter({
    filterString: function() {
      return queryString.getParam("spec") || 'none';
    }
  });

  jasmine.getEnv().specFilter = function(spec) {
    return specFilter.matches(spec.getFullName());
  };

}());
