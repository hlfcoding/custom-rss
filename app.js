var app = require('connect')();

app.use('/hacker-news', require('./feeds/hacker-news'));

app.use(function(request, response) {
  response.statusCode = 404;
  response.end('Feed not found!\n');
});

require('http').createServer(app).listen(3000);
