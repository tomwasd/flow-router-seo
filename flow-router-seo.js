FlowRouterSEO = function(config) {

  var self = this;

  if (config) {
    if (config.database) {

      // Allow for custom collection name;
      if (config.databaseName) self.routes = new Mongo.Collection(config.databaseName);
      else self.routes = new Mongo.Collection('flow-router-seo-routes');

      if (Meteor.isServer) {
        // Create an index to make lookups faster
        // Only available server side
        self.routes._ensureIndex('routeName');
      }
      self._subscription = null;
    }
    if (config.defaults) {
      self.setDefaults(config.defaults);
    }
  }
  self._updateDOM = function(settings) {
    
    // Fill in any gaps with the defaults
    // We use jQuery's extend as it is recursive
    // (i.e. it performs a deep copy), unlike UnderscoreJS
    settings = $.extend(true, {}, self._defaults, settings);

    // Remove all existing meta tags that this package has added
    $('head meta[data-flow-router-seo="true"]').remove();

    // Set title if specified otherwise use the default empty string title
    document.title = settings.title;

    // Set the description before the other meta tags as
    // other tags are generated from the meta description
    if (settings.description) $('head').append('<meta name="description" content="' + self._escapeHTML(settings.description) + '" data-flow-router-seo="true" />');

    // Set meta tags
    _.each(settings.meta, function(value, key) {
      if (typeof value === 'function') value = value(settings);
      if (value) $('head').append('<meta ' + key + 'content="' + self._escapeHTML(value) + '" data-flow-router-seo="true" />');
    });

  };

  self._currentUrl = function() {
    var currentRoute = FlowRouter.current();
    var routeName = currentRoute.route.name;
    // FlowRouter.path() returns a path starting with a '/' but Meteor.absoluteUrl()
    // doesn't want it - that's why we've got the substr(1)
    return Meteor.absoluteUrl(FlowRouter.path(routeName, currentRoute.params).substr(1));
  };

  self._currentTitle = function() {
    return document.title;
  };

  self._currentDescription = function(settings) {
    return settings.description || self._defaults.description;
  };

  // We need to escape any HTML within the title/meta tags
  self._escapeHTML = function(HTML) {
    return HTML.replace(/'/g, '&apos;').replace(/"/g, '&quot;');
  };

  // Internal function only called by flow router's enter trigger
  self._set = function() {

    // Either we want the defaults because the database isn't enabled 
    // or we want to start with the defaults until the subscription
    // is ready and we have the route specific settings
    self._updateDOM(self._defaults);

    // If the database is enabled, see if there is an entry for this route
    if (self.routes) {

      var currentRoute = FlowRouter.current();
      var routeName = currentRoute.route.name;

      // Stop any existing subscription so that we don't end up
      // with loads of subscriptions running at once
      if (self._subscription) self._subscription.stop();

      // If no route name specified then rely on defaults
      if (routeName) {
        // Subscribe by route name to see if we have SEO data stored
        // for this route
        self._subscription = Meteor.subscribe('flowRouterSEO', routeName, {onReady: function() {

          // When the subscription is ready, see if we have a result
          // If so, update the DOM with the settings otherwise rely on 
          // the defaults set above
          var routeSettings = self.routes.findOne({routeName: routeName}, {fields: {_id: 0}});

          // Only update the DOM if we're still on the right route
          // (during the time it took to callback this function we might
          // have changed routes)
          currentRoute = FlowRouter.current();
          if (routeSettings && routeName === currentRoute.route.name)
            self._updateDOM(routeSettings);

        }});
      }
    }
  };

  // The user can call this from the template's onCreated function
  self.set = function(settings) {
    // If the user has specified settings, update the DOM
    if (settings) self._updateDOM(settings);
  };

  // The user can call this to initialise the router with defaults
  // The defaults are merged rather than overridden
  // For convenience, it can be called from a file both on the server & client
  // but it only does stuff if called from the client (plus jQuery isn't on the
  // server!)
  self.setDefaults = function(settings) {
    // We use jQuery's extend as it is recursive
    // (i.e. it performs a deep copy), unlike UnderscoreJS
    if (Meteor.isClient) self._defaults = $.extend(true, {}, self._defaults, settings);
  };

  // Default settings if nothing specified by the user
  self._defaults = {
    title: '',
    description: '',
    meta: {
      'name="twitter:title"': self._currentTitle,
      'name="twitter:url"': self._currentUrl,
      'name="twitter:description"': self._currentDescription,
      'property="og:title"': self._currentTitle,
      'property="og:url"': self._currentUrl,
      'property="og:description"': self._currentDescription,
    }
  };

  // Whenever we enter a route, set the correct title and meta tags
  FlowRouter.triggers.enter([self._set]);

  if (Meteor.isServer) {
    if (self.routes) {
      Meteor.publish('flowRouterSEO', function(routeName) {
        check(routeName, String);
        return self.routes.find({routeName: routeName});
      });
    }
  }

};