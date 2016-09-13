"use strict";

var gulp = require('gulp');
var connect = require('gulp-connect'); //Runs a local dev server
var open = require('gulp-open'); //Open a URL in a web browser
var browserify = require('browserify'); // Bundles JS
var reactify = require('reactify');  // Transforms React JSX to JS
var source = require('vinyl-source-stream'); // Use conventional text streams with Gulp
var buffer = require('vinyl-buffer');
var concat = require('gulp-concat'); //Concatenates files
var lint = require('gulp-eslint'); //Lint JS files, including JSX
var uglify = require('gulp-uglify');

var config = {
    port: 9005,
    devBaseUrl: 'http://localhost',
    paths: {
        html: './src/index.html',
        js: './src/**/*.js',
        fonts: ['node_modules/bootstrap/dist/fonts/*.*', 'node_modules/react-widgets/dist/fonts/*.*'],
        images: ['./src/img/*'],
        css: [
            './src/css/style.css'//,
            //'./src/css/drawattribute.css',
            //'node_modules/bootstrap/dist/css/bootstrap.min.css',
            //'node_modules/react-virtualized/styles.css',
            //'node_modules/react-widgets/dist/css/react-widgets.css',
            //'node_modules/react-datepicker/dist/react-datepicker.css'
        ],
        dist: './dist',
        mainJs: './src/main.js',
        configJs: './app.config.js'
    }//,
    //version: argv.version ? argv.version : '0'
};

//Start a local development server
gulp.task('connect', function () {
    connect.server({
        root: 'dist',
        port: config.port,
        base: config.devBaseUrl,
        fallback: 'dist/index.html',
        livereload: true
    });
});

gulp.task('open', ['connect'], function () {
    gulp.src('dist/index.html').pipe(open({ app: "chrome", uri: config.devBaseUrl + ':' + config.port + '/' }));
});

gulp.task('html', function () {
    gulp.src(config.paths.html)
        .pipe(gulp.dest(config.paths.dist))
        .pipe(connect.reload());
});

gulp.task('fonts', function () {
    gulp.src(config.paths.fonts)
        .pipe(gulp.dest(config.paths.dist + '/fonts'))
        .pipe(connect.reload());
});

gulp.task('config', function () {
    //gulp.src(config.paths.configJs)
    //    .pipe(gulp.dest(config.paths.dist + '/'))
});

gulp.task('js', function () {
    browserify(config.paths.mainJs, { insertGlobals: true, debug: true })
        .transform(reactify)
        .bundle()
        .on('error', console.error.bind(console))
        .pipe(source('bundle.js'))
        .pipe(gulp.dest(config.paths.dist + '/scripts'))
        .pipe(connect.reload());
});

gulp.task('js_mini', function () {
    browserify(config.paths.mainJs, { insertGlobals: true, debug: true })
        .transform(reactify)
        .bundle()
        .on('error', console.error.bind(console))
        .pipe(source('bundle.js'))
        .pipe(buffer()) // <----- convert from streaming to buffered vinyl file object
        .pipe(uglify()) // now gulp-uglify works
        .pipe(gulp.dest(config.paths.dist + '/scripts'))
        .pipe(connect.reload());
});

gulp.task('css', function () {
    gulp.src(config.paths.css)
        .pipe(concat('bundle.css'))
        .pipe(gulp.dest(config.paths.dist + '/css'));
});

// Migrates images to dist folder
// Note that I could even optimize my images here
gulp.task('images', function () {
    gulp.src(config.paths.images)
        .pipe(gulp.dest(config.paths.dist + '/img'))
        .pipe(connect.reload());

    //publish favicon
    //gulp.src('./src/favicon.ico')
    //    .pipe(gulp.dest(config.paths.dist));
});

gulp.task('lint', function () {
    return gulp.src(config.paths.js)
        .pipe(lint({ config: 'eslint.config.json' }))
        .pipe(lint.format());
});

gulp.task('watch', function () {
    gulp.watch(config.paths.html, ['html']);
    gulp.watch(config.paths.css, ['css']);
    gulp.watch(config.paths.js, ['js', 'lint']);
});

gulp.task('apply-prod-environment', function () {
    process.env.NODE_ENV = 'production';
});

gulp.task('default', ['html', 'config', 'js', 'css', 'images', 'fonts', 'lint', 'open', 'watch']);
gulp.task('perf', ['apply-prod-environment', 'html', 'config', 'js', 'css', 'images', 'fonts', 'lint', 'open', 'watch']);
gulp.task('release', ['apply-prod-environment', 'config', 'html', 'js_mini', 'css', 'images', 'fonts', 'lint']);