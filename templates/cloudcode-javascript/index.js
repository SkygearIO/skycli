const skygearCloud = require('skygear/cloud');

/* Visit https://<your-endpoint-url>/hello/ to view */
skygearCloud.handler('/hello/', function (req) {
  return 'hello';
}, {
  method: ['GET']
});
