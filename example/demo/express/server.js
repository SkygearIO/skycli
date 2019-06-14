'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const afterSignup = require('./api/after_signup');
const writeBlog = require('./api/write_blog');
const fetchBlogs = require('./api/fetch_blogs');

const PORT = 8080;
const HOST = '0.0.0.0';

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Welcome\n');
});
app.post('/after_signup', afterSignup);
app.post('/write_blog', writeBlog);
app.post('/fetch_blogs', fetchBlogs);

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
