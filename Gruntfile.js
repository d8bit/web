module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        watch: {
            js: {
                files: ['resources/assets/js/functions.js'],
                tasks: ['uglify'],
            },
            sass: {
                files: ['resources/assets/sass/style.sass'],
                tasks: ['sass'],
                options: {
                    livereload: true
                }
            }
        },
        uglify: {
            options: {
                mangle: false,
                preserveComments: false
            },
            dist: {
                files: {
                    'public/js/functions.min.js': [
                        'resources/assets/js/functions.js'
                    ]
                }
            }
        },
        cssmin: {
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1
            },
            target: {
                files: [{
                    'public/css/style.min.css': [
                        'public/css/style.css'
                    ]
                }]
            }
        },
        sass: {
            options: {
                sourceMap: false
            },
            dist: {
                files: {
                    'public/css/style.css': 'resources/assets/sass/style.sass'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-sass');

    grunt.registerTask('default', ['cssmin', 'uglify', 'sass']);

};
