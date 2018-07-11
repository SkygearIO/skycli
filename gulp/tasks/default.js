var gulp = require('gulp');
require('./lint');

gulp.task('default', gulp.series('lint'));
