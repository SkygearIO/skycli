var gulp = require('gulp');
var babel = require('gulp-babel');

gulp.task('build', () => {
  return gulp.src(['src/**/*.js', 'src/**/*.ts'])
    .pipe(babel())
    .pipe(gulp.dest('dist'));
});
