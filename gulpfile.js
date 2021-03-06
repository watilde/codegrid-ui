'use strict';

var es           = require( 'event-stream' );
var del          = require( 'del' );
var browserSync  = require( 'browser-sync' ).create();
var reload       = browserSync.reload;

var postcss      = require( 'gulp-postcss' );
var autoprefixer = require( 'autoprefixer' );
var mqpacker     = require( 'css-mqpacker' );
var csswring     = require( 'csswring' );

var gulp         = require( 'gulp' );
var aigis        = require( 'gulp-aigis' );
var concat       = require( 'gulp-concat' );
var consolidate  = require( 'gulp-consolidate' );
var iconfont     = require( 'gulp-iconfont' );
var plumber      = require( 'gulp-plumber' );
var rename       = require( 'gulp-rename' );
var sass         = require( 'gulp-sass' );
var uglify       = require( 'gulp-uglify' );
var watch        = require( 'gulp-watch' );
var awspublish   = require( 'gulp-awspublish' );

var runSequence  = require( 'run-sequence' ).use( gulp );


var AUTOPREFIXER_BROWSERS = {
  browsers: [
    'ie >= 9',
    'safari >= 7',
    'ios >= 7',
    'android >= 4'
  ]
};


gulp.task( 'browser-sync', function () {

  browserSync.init({
    server: {
      baseDir: './',
      directory: true
    }
  } );

} );

gulp.task( 'clean', function () {

  del( './build/' );

} );

gulp.task( 'copy-font', function () {

  return gulp.src( [
          './src/assets2/font/zero-width.eot',
          './src/assets2/font/zero-width.otf',
          './src/assets2/font/zero-width.svg',
          './src/assets2/font/zero-width.ttf',
          './src/assets2/font/zero-width.woff'
         ] )
         .pipe( gulp.dest( './build/assets2/font/' ) );

} );

gulp.task( 'copy-img', function () {

  return gulp.src( [
          './src/assets2/img/*/**'
         ] )
         .pipe( gulp.dest( './build/assets2/img/' ) );

} );

gulp.task( 'copy-static', function () {

  return gulp.src( [
          './static/*/**',
         ] )
         .pipe( gulp.dest( './build/' ) );

} );

gulp.task( 'js', function () {

  return gulp.src( [
          './src/assets2/js/vendor/EventDispatcher.js',
          './src/assets2/js/vendor/prism.js',
          './src/assets2/js/prism.extend.js',
          './src/assets2/js/CG2.js',
          './src/assets2/js/CG2-pageHeader.js',
          './src/assets2/js/CG2-drawer.js',
          './src/assets2/js/CG2-compactNav.js',
          './src/assets2/js/CG2-tab.js',
          './src/assets2/js/CG2-articleSeriesNav.js',
          './src/assets2/js/CG2-livecode.js',
          './src/assets2/js/old-jade-click-to-play.js',
          './src/assets2/js/old-jade-prism.js'
         ] )
         .pipe( plumber() )
         .pipe( concat( 'codegrid-ui.js' ) )
         .pipe( gulp.dest( './build/assets2/js/' ) )
         .pipe( uglify() )
         .pipe( rename( { extname: '.min.js' } ) )
         .pipe( gulp.dest( './build/assets2/js/' ) );

} );


gulp.task( 'sass', function () {

  var processors = [
    autoprefixer( AUTOPREFIXER_BROWSERS ),
    mqpacker,
    csswring
  ];

  return gulp.src( './src/assets2/scss/codegrid-ui.scss' )
         .pipe( plumber() )
         .pipe( sass() )
         .pipe( gulp.dest( './build/assets2/css/' ) )
         .pipe( rename( { extname: '.min.css' } ) )
         .pipe( postcss( processors ) )
         .pipe( gulp.dest( './build/assets2/css/' ) );

} );


gulp.task( 'iconfont', function () {

  var fontName = 'codegrid-icon';

  return gulp.src( [ './src/assets2/font/codegrid-icon/*.svg' ] )
  .pipe( iconfont( {
    fontName: fontName,
    appendCodepoints: true
  } ) )
  .on( 'glyphs', function( glyphs, options ) {

    gulp.src( './src/assets2/font/codegrid-icon/_icon.scss' )
    .pipe( consolidate( 'underscore', {
      glyphs: glyphs,
      fontName: fontName,
      fontPath: '../font/',
      prefix: 'CG2-icon'
    } ) )
    .pipe( gulp.dest( './src/assets2/scss/' ) );

  } )
  .pipe( gulp.dest( './build/assets2/font/' ) );

} );


gulp.task( 'numfont', function () {

  var fontName = 'codegrid-num';

  return gulp.src( [ './src/assets2/font/codegrid-num/*.svg' ] )
  .pipe( iconfont( {
    fontName: fontName,
    fontHeight: 256,
    descent: 24
  } ) )
  .pipe( gulp.dest( './build/assets2/font/' ) );

} );


gulp.task( 'guide', function () {

  return gulp.src( './aigis_config.yml' )
         .pipe( aigis() )
         .pipe( gulp.dest( '' ) );

} );


gulp.task( 'watch', function () {

  // watch( [ './**/*.html' ], function () {
  //   runSequence( browserSync.reload );
  // } );

  watch( [ './src/assets2/js/*.js' ], function () {
    runSequence( 'js', browserSync.reload );
  } );

  watch( [ './src/assets2/scss/*.scss' ], function () {
    runSequence( 'sass', browserSync.reload );
  } );

  // watch( [ './src/assets2/font/codegrid-icon/*.svg' ], function () {
  //   runSequence( 'iconfont', 'sass', browserSync.reload );
  // } );

} );

gulp.task( 'default', function ( callback ) {

  runSequence( 'browser-sync', 'iconfont', [ 'numfont', 'copy-font', 'copy-img', 'copy-static', 'js', 'sass' ], 'watch', callback );

} );

gulp.task( 'build', function ( callback ) {

  runSequence( 'clean', 'iconfont', [ 'numfont', 'copy-font', 'copy-img', 'copy-static', 'js', 'sass' ], 'guide', callback );

} );

gulp.task( 'deploy', function () {

  var publisher = awspublish.create( {
    "params": {
      "Bucket": "ui.codegrid.net"
    },
    "endpoint": "s3-ap-northeast-1.amazonaws.com"
  } );

  gulp.src( './build/**/*' )
    .pipe( publisher.publish() )
    .pipe( publisher.sync() )
    .pipe( awspublish.reporter() );

} );
