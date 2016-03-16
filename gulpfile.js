var gulp = require( 'gulp' ),
    browserSync = require( 'browser-sync' ),
    reload = browserSync.reload;

gulp.task( 'default', function () {
    browserSync( {
        server : { baseDir : '.' }
    } );

    gulp.watch( [ '*' ], {}, reload );
} );
