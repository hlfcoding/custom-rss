# Custom RSS

[![Build Status](https://travis-ci.org/hlfcoding/custom-rss.svg?branch=master)](https://travis-ci.org/hlfcoding/custom-rss)
[![Code Climate](https://codeclimate.com/github/hlfcoding/custom-rss/badges/gpa.svg)](https://codeclimate.com/github/hlfcoding/custom-rss)
[![Package](https://img.shields.io/npm/v/custom-rss.svg?style=flat)](https://www.npmjs.com/package/custom-rss)
[![License](https://img.shields.io/npm/l/custom-rss.svg?style=flat)](https://github.com/hlfcoding/custom-rss/blob/master/LICENSE)

:zap: Filtering RSS because Zapier is too expensive (and Pipes is gone).

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

The sample app is what's in the root directory. It's a barebones Connect app, with personal configuration in `config.json`. This is foremost for personal use, but what's in `/src` should be reusable with any Connect-like web framework.

### Feeds

- [x] Hacker News (via [hnapp](http://hnapp.com))
- [ ] Quartz
- [ ] NYTimes Business
- [ ] Yahoo Tech
- [ ] Ray Wenderlich
- [ ] Gama Sutra
