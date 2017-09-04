var gulp = require('gulp');
var mocha = require('gulp-mocha');

gulp.task('test', ['build'], () => {
  return gulp.src('test/**/*.js')
    .pipe(mocha({
      compilers: 'js:babel-core/register'
    }))
});
