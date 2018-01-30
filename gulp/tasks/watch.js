var gulp = require('gulp');

gulp.task('watch', ['build'], () => {
  return gulp.watch([
    'src/**/*.js',
    'src/**/*.ts'
  ], ['build']);
});
