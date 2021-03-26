const { src, dest, parallel, series, watch } = require('gulp');
const sass         = require('gulp-sass');
const rename       = require('gulp-rename');
const autoprefixer = require('gulp-autoprefixer');
const cleancss 		 = require('gulp-clean-css');
const mediacss     = require('gulp-group-css-media-queries');
const sourcemaps   = require('gulp-sourcemaps');
const htmlmin      = require('gulp-htmlmin');
const browsersync  = require('browser-sync').create();
const imagemin     = require('gulp-imagemin');
const webp         = require('gulp-webp');
const webphtml     = require('gulp-webp-html');
const webpcss      = require('gulp-webp-css');
const svgsprite    = require('gulp-svg-sprite');
const ttf2woff     = require('gulp-ttf2woff');
const ttf2woff2    = require('gulp-ttf2woff2');
const fs 					 = require('fs');
const del 				 = require('del');

const project_folder = 'dist';
const source_folder = 'src';

const path = {
  build: {
    html: project_folder + '/',
    css:  project_folder + '/css/',
    img:  project_folder + '/img/',
    svg:  project_folder + '/img/svg/',
    fonts:  project_folder + '/fonts/'
  },
  src: {
    html: source_folder + '/*.html',
    css:  source_folder + '/scss/**/*.scss',
    img:  source_folder + '/img/**/*',
    svg:  source_folder + '/img/svg/*',
    fonts:  source_folder + '/fonts/**.ttf'
  }
};

const html = () => {
  return src(path.src.html)
	.pipe(webphtml())
  .pipe(dest(path.build.html))
  .pipe(browsersync.stream());
};

const htmlBuild = () => {
  return src(path.src.html)
  .pipe(webphtml())
	.pipe(htmlmin({ collapseWhitespace: true }))
  .pipe(dest(path.build.html));
};

const styles = () => {
  return src(path.src.css)
  .pipe(sourcemaps.init()) 
  .pipe(sass({ outputStyle: 'expanded' }))
  .pipe(rename({ suffix: '.min' }))
  .pipe(mediacss())
  .pipe(autoprefixer({
    overrideBrowserslist: ['last 5 versions'],
    cascade: true
  }))
	.pipe(webpcss())
  .pipe(cleancss())
  .pipe(sourcemaps.write('.'))
  .pipe(dest(path.build.css))
  .pipe(browsersync.stream());
};

const stylesBuild = () => {
  return src(path.src.css)
  .pipe(sass({ outputStyle: 'expanded' }))
  .pipe(rename({ suffix: '.min' }))
  .pipe(autoprefixer({
    overrideBrowserslist: ['last 5 versions'],
    cascade: true
  }))
	.pipe(webpcss())
  .pipe(cleancss())
  .pipe(dest(path.build.css));
};

const images = () => {
  return src(path.src.img, {dot: true, ignore: path.src.svg})
	.pipe(
		webp({
			quality: 70
		})
	)
	.pipe(dest(path.build.img))
	.pipe(src(path.src.img, {dot: true, ignore: path.src.svg}))
  .pipe(
    imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      interlaced: false,
      optimizationLevel: 3
    })
  )
  .pipe(dest(path.build.img));
};

const sprites = () => {
	return src(path.src.svg)
		.pipe(svgsprite({
			mode: {
				stack: {
					sprite: '../sprite.svg'
					// example: true
				}
			}
		}))
		.pipe(dest(path.build.svg));
};

const fonts = () => {
	src(path.src.fonts)
		.pipe(ttf2woff())
		.pipe(dest(path.build.fonts));
	return src(path.src.fonts)
		.pipe(ttf2woff2())
		.pipe(dest(path.build.fonts));
};

const cb = () => {};

let srcFonts = './src/scss/_fonts.scss';

const fontsStyle = (done) => {
	let fileContent = fs.readFileSync(srcFonts);

	fs.writeFile(srcFonts, '', cb);
	fs.readdir(path.build.fonts, function (err, items) {
		if (items) {
			let c_fontname;
			for (var i = 0; i < items.length; i++) {
				let fontname = items[i].split('.');
				fontname = fontname[0];
				if (c_fontname != fontname) {
					fs.appendFile(srcFonts, '@include font-face("' + fontname + '", "' + fontname + '", 400);\r\n', cb);
				}
				c_fontname = fontname;
			}
		}
	});

	done();
};

const clean = () => {
  return del([project_folder]);
};

const watchFiles = () => {
	browsersync.init({
		server: {
			baseDir: project_folder
		},
    port: 3000,
    notify: false
	});

	watch(path.src.html, html);
	watch(path.src.css, styles);
  watch(path.src.img, images);
  watch(path.src.svg, sprites);
  watch(path.src.fonts, fonts);
  watch(path.src.fonts, fontsStyle);
};

exports.html = html;
exports.htmlBuild = htmlBuild;
exports.styles = styles;
exports.stylesBuild = stylesBuild;
exports.images = images;
exports.sprites = sprites;
exports.fonts = fonts;
exports.fontsStyle = fontsStyle;
exports.clean = clean;

// development
exports.default = series(clean, parallel(html, fonts, images, sprites), styles, watchFiles);

// production
exports.build = series(clean, parallel(htmlBuild, fonts, images, sprites), stylesBuild);
