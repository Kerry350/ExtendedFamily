var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var connect = require('gulp-connect');
var imageResize = require('gulp-image-resize');
var imagemin = require('gulp-imagemin');
var jpegtran = require('imagemin-jpegtran');
var rename = require("gulp-rename");
var rsync = require('rsyncwrapper').rsync;
var gutil = require('gulp-util');

gulp.task('sass', function() {
  return gulp.src('assets/*.scss')
        .pipe(sass())
        .pipe(concat('app.min.css'))
        .pipe(gulp.dest('assets/dist'));
});

gulp.task('css', ['sass'], function() {
  return gulp.src([
          'assets/dist/app.min.css',
          'bower_components/magnific-popup/dist/magnific-popup.css',
          'bower_components/bootstrap/dist/css/bootstrap.css'
         ])
        .pipe(concat('app.min.css'))
        .pipe(gulp.dest('assets/dist'))
});

gulp.task('js', function() {
  return gulp.src([
          'bower_components/jquery/dist/jquery.js',
          'bower_components/bootstrap/dist/js/bootstrap.js',
          'bower_components/magnific-popup/dist/jquery.magnific-popup.js',
          'assets/*.js'
        ])
        .pipe(concat('app.min.js'))
        // .pipe(uglify())
        .pipe(gulp.dest('assets/dist'))
});

gulp.task('processImages', function () {
  return gulp.src('images/**/*.{jpg,JPG}')
    .pipe(imageResize({ 
      width : 2000,
      upscale : false,
      imageMagick: true
    }))
    .pipe(imagemin({
      progressive: true,
      use: [jpegtran({ progressive: true })]
    }))
    .pipe(gulp.dest('processed_images'));
});

gulp.task('processThumbnails', function () {
  return gulp.src('images/**/*.{jpg,JPG}')
    .pipe(imageResize({ 
      width : 400,
      upscale : false,
      imageMagick: true
    }))
    .pipe(imagemin({
      progressive: true,
      use: [jpegtran({ progressive: true })]
    }))
    .pipe(rename(function (path) {
      path.basename += "@1x";
    }))
    .pipe(gulp.dest('processed_thumbnails'));
});

gulp.task('images', ['processImages', 'processThumbnails']);

gulp.task('server', function() {
  connect.server({
    root: ['dist'],
    port: 4242
  })
});

gulp.task('watch', function() {
  gulp.watch(['assets/*.js'], ['js']);
  gulp.watch('assets/*.scss', ['css']);
});

gulp.task('default', ['watch', 'js', 'css']);