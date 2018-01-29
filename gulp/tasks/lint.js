var gulp = require('gulp');
var eslint = require('gulp-eslint');
var tslint = require('gulp-tslint');
var excludeGitignore = require('gulp-exclude-gitignore');

gulp.task('eslint', () => {
  return gulp.src(['src/**/*.js', 'test/**/*.js'])
    .pipe(excludeGitignore())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
});

gulp.task('tslint', () => {
  return gulp.src(['src/**/*.ts', 'test/**/*.ts'])
    .pipe(excludeGitignore())
    .pipe(tslint())
    .pipe(tslint.report())
});

gulp.task('lint', ['eslint', 'tslint']);
