var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var connect = require('gulp-connect');

gulp.task('sass', function() {
  return gulp.src('assets/*.scss')
        .pipe(sass())
        .pipe(concat('app.min.css'))
        .pipe(gulp.dest('assets/dist'));
});

gulp.task('css', function() {
  return gulp.src([
          'assets/dist/app.min.css',
          'bower_components/bootstrap/dist/css/bootstrap.css'
         ])
        .pipe(concat('app.min.css'))
        .pipe(gulp.dest('assets/dist'))
});

gulp.task('js', function() {
  return gulp.src([
          'bower_components/jquery/dist/jquery.js',
          'bower_components/bootstrap/dist/js/bootstrap.js',
          'assets/*.js'
        ])
        .pipe(concat('app.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('assets/dist'))
});

gulp.task('server', function() {
  connect.server({
    root: ['dist'],
    port: 4242
  })
});

gulp.task('watch', function() {
  gulp.watch(['assets/*.js'], ['js']);
  gulp.watch('assets/*.scss', ['sass', 'css']);
});

gulp.task('default', ['watch', 'js', 'css']);