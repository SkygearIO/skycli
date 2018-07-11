var gulp = require('gulp');
var mocha = require('gulp-mocha');
require('./build');

gulp.task('test', gulp.series('build', () => {
  return gulp.src('test/**/*.js')
    .pipe(mocha({
      compilers: 'js:@babel/register'
    }));
}));
