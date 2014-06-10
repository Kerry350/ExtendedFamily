var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

gulp.task('css', function() {
  return gulp.src('assets/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('assets/dist'));
});

gulp.task('js', function() {
  return gulp.src([
          'bower_components/jquery/dist/jquery.js',
          'bower_components/bootstrap/dist/js/bootstrap.js',
          'assets/*.js'
        ])
        .pipe(concat('app.min.js'))
        .pipe(uglify());
        .pipe(gulp.dest('assets/dist'))
});

gulp.task('watch', function() {
  gulp.watch(['assets/*.js'], ['js']);
  gulp.watch('assets/*.scss', ['css']);
});

gulp.task('default', ['watch', 'js', 'css']);