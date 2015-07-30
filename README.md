SEO for Flow Router
==========================

This package aims to simplify setting title and meta tags for Meteor apps that use [Flow Router](https://atmospherejs.com/kadira/flow-router).

Why?
----

On page search engine optimisation (SEO) plays a role in where you appear in search results.

Having a title, description and (to a much lesser extent) keywords tags help you place higher in search rankings.

Its also important to have other meta tags so that Facebook, Twitter, etc can grab nice looking summaries of the pages of your app.


Installation
----------

`meteor add tomwasd:flow-router-seo`

Prerequisites
----------

- [Flow Router](https://atmospherejs.com/kadira/flow-router) - that's what this package is based on!
- [Spiderable](https://atmospherejs.com/meteor/spiderable) - helps web crawlers index your site

Configuration
-----------

You have to create a new instance of `FlowRouterSEO` for anything to work. You should declare the below
in a file that is served to both the client and the server:

`SEO = new FlowRouterSEO();`

By default, the database functionality for static routes is disabled. If you wish to enable it you should
pass in `{database: true}` to the constructor, i.e.

`SEO = new FlowRouterSEO({database: true});`

If you wish to set default title and meta tags for all your pages you can like so:

    SEO.setDefaults({
      title: 'Default title',
      description: 'Default description',
      meta: {
        'property="og:type"': 'website',
        'property="og:site_name"': 'Default site name',
        'name="twitter:card"': 'summary',
        'name="twitter:site"': '@TwitterUsername'
      }
    });

Usage
-----------

First, make sure you've set a `name` for your route within its Flow Router declaration i.e.

    FlowRouter.route('/', {
      name: 'home',
      action: function() {
        BlazeLayout.render('layout', {content: 'home'});
      }
    });

You can set the title and meta tags within the `onCreated` function of a template e.g.

    Template.templateName.onCreated(function() {
      SEO.set({
        title: 'Title for this template',
        description: 'Description for this template',
        meta: {
          'property="og:image"': 'http://locationofimage.com/image.png'
        }
      });
    });

If you have dynamic content that relies on a subscription you may want to follow a pattern
similar to this:

    Template.templateName.onCreated(function() {
      var postId = FlowRouter.getParam('postId');
      this.subscribe('postById', postId, {onReady: function() {
        var post = Posts.findOne(instance.dealId);
        SEO.set({
          title: post.title,
          description: post.description,
          meta: {
            'property="og:image"': post.image,
            'name="twitter:image"': post.image
          }
        });
      }});
    });

Automated tags
--------------

By default, the Open Graph and Twitter tags for title, description and URL are set automatically.

The Open Graph and Twitter title and description tags are set according to either the default values of title
and description or, if specified, the title and description values of the current route.

The Open Graph and Twitter URL tags are set according to the current URL (minus any hash tags or query parameters).

The defaults can be overrided by specifying values of your own.

Database for static routes
--------------------------

As mentioned above, you can enable this functionaltiy by passing `{database: true}` into the constructor.

This creates a Mongo Collection that stores title and meta tag information against a route name.

You can add information for a route name as follows:

    SEO.routes.upsert({routeName: 'home'}, {$set: {
      title: 'Home page',
      description: 'A lovely place to be',
      meta: {
        'property="og:image"': 'http://locationofimage.com/image.png'
      }
    }})

Behind the scenes, when the `home` route is loaded we subscribe to the route by its name. Once we receive
the result we update the title and meta tags accordingly.

`SEO.routes` is a Mongo Collection so you can perform all the usual operations on it. Its recommended
that you use `upsert` to avoid errors in trying to create an entry for the same route name twice.

Preservation of existing tags
-----------------------------

Other than the title, Flow Router SEO will only change meta tags that it has inserted. If you already have meta
tags declared elsewhere in your app they won't get touched!