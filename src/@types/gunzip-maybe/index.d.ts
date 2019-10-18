declare module 'gunzip-maybe' {
  import stream = require('stream');

  function gunzip(): stream.Transform;
  export = gunzip;
}
