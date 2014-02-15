module.exports = function(grunt) {
  grunt.initConfig({
    browserify: {
      basic: {
        src: ['js/main.js'],
        dest: 'public/js/bundle.js'
      }
    },
    sass: {
      dist: {
        files: {
          'public/css/style.css' : 'sass/style.scss'
        }
      }
    },
    watch: {
      css: {
        files: '**/*.scss',
        tasks: ['sass']
      },
      scripts: {
        files: ['js/*.js'],
        tasks: ['browserify']
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['browserify', 'sass']);
  grunt.registerTask('dev', ['watch']);
  grunt.registerTask('heroku', ['browserify', 'sass']);
};
