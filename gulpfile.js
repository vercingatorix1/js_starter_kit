const { src, dest, series, parallel, watch } = require('gulp');
const del = require('del');
const If = require('gulp-if');
const minifyHtml = require('gulp-htmlmin');
const sourceMaps = require('gulp-sourcemaps');
const compileJs = require('gulp-babel');
const minifyJs = require('gulp-uglify');
const concat = require('gulp-concat');
const minifyCss = require('gulp-clean-css');
const compileSass = require('gulp-sass');
compileSass.compiler = require('node-sass');
const server = require('browser-sync').create();

const cleanHtml = () => {
  return del(['./dist/**/*.html', '!./dist/css/**', '!./dist/js/**']);
};

const processHtml = () => {
  return src([
    './src/**/*.html',
    '!./src/css/**',
    '!./src/js/**',
    '!./src/sass/**',
  ])
    .pipe(
      If(
        process.env.NODE_ENV === 'production',
        minifyHtml({
          collapseWhitespace: true,
          removeComments: true,
        }),
      ),
    )
    .pipe(dest('./dist/'));
};

const cleanJs = () => {
  return del(['./dist/js/**/*.js']);
};

const processJS = () => {
  return src(['./src/js/**/*.js'])
    .pipe(If(process.env.NODE_ENV !== 'production', sourceMaps.init()))
    .pipe(compileJs())
    .pipe(If(process.env.NODE_ENV === 'production', minifyJs()))
    .pipe(concat('bundle.js'))
    .pipe(If(process.env.NODE_ENV !== 'production', sourceMaps.write()))
    .pipe(dest('./dist/js/'));
};

const cleanCss = () => {
  return del(['./dist/css/**/*.css']);
};

const processCss = () => {
  return src(['./src/css/**/*.css', './src/sass/**/*.scss'])
    .pipe(If(process.env.NODE_ENV !== 'production', sourceMaps.init()))
    .pipe(If((file) => file.extname === '.scss', compileSass()))
    .pipe(If(process.env.NODE_ENV === 'production', minifyCss()))
    .pipe(concat('bundle.css'))
    .pipe(If(process.env.NODE_ENV !== 'production', sourceMaps.write()))
    .pipe(dest('./dist/css/'));
};

const reloadBrowser = (done) => {
  server.reload();
  done();
};

const initServer = (done) => {
  server.init({
    server: {
      baseDir: './dist/',
    },
  });
  done();
};

const watchFiles = () => {
  watch(
    ['./src/**/*.html', '!./src/css/**', '!./src/js/**', '!./src/sass/**'],
    series(cleanHtml, processHtml, reloadBrowser),
  );
  watch(['./src/js/**/*.js'], series(cleanJs, processJS, reloadBrowser));
  watch(
    ['./src/css/**/*.css', './src/sass/**/*.scss'],
    series(cleanCss, processCss, reloadBrowser),
  );
};

module.exports = {
  devServe: series(
    parallel(cleanHtml, cleanJs, cleanCss),
    parallel(processHtml, processJS, processCss),
    initServer,
    watchFiles,
  ),
  build: series(
    parallel(cleanHtml, cleanJs, cleanCss),
    parallel(processHtml, processJS, processCss),
  ),
};
