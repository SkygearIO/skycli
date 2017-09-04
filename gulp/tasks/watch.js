var gulp = require('gulp');

gulp.task('watch', () => {
  return gulp.watch('src/**/*.js', ['build']);
});
