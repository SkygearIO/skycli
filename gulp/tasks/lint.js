var gulp = require('gulp');
var eslint = require('gulp-eslint');
var excludeGitignore = require('gulp-exclude-gitignore');

gulp.task('lint', ['build', 'test'], () => {
  return gulp.src(['src/**/*.js', 'test/**/*.js'])
    .pipe(excludeGitignore())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
});
