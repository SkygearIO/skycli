var gulp = require('gulp');
require('./build');

gulp.task('watch', gulp.series('build', () => {
  return gulp.watch([
    'src/**/*.js',
    'src/**/*.ts'
  ], gulp.series('build'));
}));
