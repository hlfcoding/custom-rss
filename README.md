# Custom RSS

[![Build Status](https://travis-ci.org/hlfcoding/custom-rss.svg?branch=master)](https://travis-ci.org/hlfcoding/custom-rss)
[![Code Climate](https://codeclimate.com/github/hlfcoding/custom-rss/badges/gpa.svg)](https://codeclimate.com/github/hlfcoding/custom-rss)
[![Package](https://img.shields.io/npm/v/custom-rss.svg?style=flat)](https://www.npmjs.com/package/custom-rss)
[![License](https://img.shields.io/npm/l/custom-rss.svg?style=flat)](https://github.com/hlfcoding/custom-rss/blob/master/LICENSE)

:satellite: Filtering RSS because Zapier is too expensive (and Pipes is gone).

### Features

- [x] Blacklist filtering
- [x] Repost guarding
- [x] Skipped entry logging
- [x] No database required
- [x] Uses JSON for configuration
- [x] Feeds as middleware functions
- [x] As few dependencies as possible
- [x] ES5, so compatible with older Node versions

### Usage

The sample app is what's in the root directory. It's a barebones Connect app, with personal configuration in `config.json`. This is foremost for personal use, but what's in `/src` should be reusable with any Connect-like web framework. Or to use as-is:

```shell
$ npm run develop
$ subl config.json # continued below
$ subl src/feeds/feedd.js # continued below
$ npm run deploy
$ git push origin master

$ ssh <production>
$ cd <site> # or `mkdir <site>; cd <site>`
$ git pull origin master # or `git clone <repo>`
$ npm start # or touch tmp/restart.txt
$ exit

$ curl <site-url>/feedd
```

```js
// config.json
{
  "feeds": [
    // ...
    {
      "name": "feedd",
      "filters": [
        { "name": "tired-topics", "type": "blacklist", "tokens": [ "Foo", "Bar", "Baz" ] }
      ]
    }
  ]
}

// src/feeds/feedd.js
var fetchFeed = require('../fetch-feed');
var filterFeed = require('../filter-feed');
var url = require('url');

module.exports = function(config, request, response) {
  config.originalURL = 'http://feedd.com/rss.xml';
  config.url = url.format({
    protocol: 'http', host: request.headers.host, pathname: config.name
  });
  fetchFeed({
    url: config.originalURL,
    onResponse: function(resFetch, data) {
      response.setHeader('Content-Type', resFetch.headers['content-type']);
      filterFeed({
        config: config,
        data: data,
        onDone: function(data) { response.end(data); }
      });
    },
    onError: function(e) { response.end(e.message); }
  });
};
```

### Feeds

- [x] Hacker News (via [hnapp](http://hnapp.com))
- [x] Quartz
- [x] NYTimes Business
- [x] Yahoo Tech
- [x] Ray Wenderlich
- [x] Gama Sutra

---

### Implementation

Some shared hosting providers, including mine, refuse to have NPM installed on their system. So dependencies need to be few to none, unless they're small enough to version. No XML parser or writer is used; a much lighter hand-rolled transformer does basic regex parsing. No MySQL client is used; data is stored with limits in plain files and manipulated in buffers (memory). No logger or mailer is used for feedback; custom loggers are handrolled as needed, with utilities on top of `fs`. The test-runner is handrolled (only because not a lot is required). Connect is the only dependency (but not really, see usage). This core constraint also yields the opportunity to learn Node fundamentals.

![custom-rss](https://cloud.githubusercontent.com/assets/100884/13690283/08d7c958-e6e4-11e5-9a83-dacfb7dc7d2f.png)
