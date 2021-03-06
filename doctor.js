#!/usr/bin/env node
'use strict';
/* eg use:
doctor -i README.md --title "Doctor, MD to HTML documentation generator for nodejs" -@ D_mitar -g https://github.com/DimitarChristoff/doctor --logo images/medical_bag.png -a UA-1199722-4 -d doctor-md
*/

var pathPrefix = __dirname.substr(-3, 3) === 'bin' ? '../' : './',
	builder = require(pathPrefix + 'lib/builder'),
	options = require('primish/options'),
	emitter = require('primish/emitter'),
	request = require('request'),
	prime = require('primish'),
	clint = require('clintish')(),
	json = require(pathPrefix + 'package'),
	fs = require('fs'),
	path = require('path');

var doctor = new (prime({

	implement: [options, emitter],

	constructor: function(options){
		this.builder = new builder(options);
	},

	getPartials: function(markdown, callback){

		var regex = /{{>([\s\S]+?)}}/g,
			partials = markdown.match(regex);

		if (partials && partials.length){
			partials.forEach(function(partial, index){
				var uri = partial.replace(/([{>}])/g,'');
				this.getData(uri, function(data){
					markdown = markdown.replace(partial, data);
					if (index === partials.length -1)
						callback(markdown);
				});
			}, this);
		}
		else {
			callback(markdown);
		}
	},
	process: function(options){
		var self = this,
			cwd = process.cwd();

		this.builder.setOptions(options);

		// bind to events
		this.builder.on('css', function done(){
			// css is the last build, when done, fire done on self.
			self.builder.off('css', done);
			self.trigger('done');
		});

		this.builder.on('error', function e(error){
			self.builder.off('error', e);
			self.trigger('error', error);
		});

		this.builder.pageTemplate = options.pageTemplate
			? path.resolve(cwd, options.pageTemplate)
			: path.resolve(this.builder.basePath, this.builder.options.pageTemplate);

		this.builder.js = options.js
			? path.resolve(cwd, options.js)
			: path.resolve(this.builder.basePath, this.builder.options.js);

		this.builder.images = options.images
			? path.resolve(cwd, options.images)
			: path.resolve(this.builder.basePath, this.builder.options.images);

		this.builder.less = options.less
			? path.resolve(cwd, options.less)
			: path.resolve(this.builder.basePath, this.builder.options.less);

		this.getData(options.source, function(body){
			self.getPartials(body, function(body){
				self.builder.buildDocs(body);
			});
		});
	},
	getData: function(uri, callback){
		if (uri.match('http')){
			request(uri, function(error, response, body){
				if (!error && response.statusCode === 200){
					callback(body);
				}
			});
		}
		else {
			callback(fs.readFileSync(uri, 'utf-8'));
		}
	}
}))();

module.exports = doctor;

/*
var bool = function(value){
	if (value === 'no' || value === 'false') return false;
	if (value === 'yes' || value === 'true') return true;
	return value;
};*/

if(require.main === module){
	clint.command('--help', '-h', 'Help using doctor');
	clint.command('--input', '-i', 'Input file or URI ' + '-i path/to/file.md'.green + ' or ' + '-i http://domain.com/file.md'.green);
	clint.command('--output', '-o', 'Output folder ' + '-o ./build'.green + ', defaults to ./build');
	clint.command('--title', '-t', 'Set page title ' + '-t "My title here"'.green + ', defaults to "Built by doctors"');
	clint.command('--twitter', '-@', 'Add twitter follow button ' + '-@ D_mitar'.green);
	clint.command('--github', '-g', 'Add github repo link, issues and fork ribbon ' + '-g https://github.com/mootools/primish/'.green);
	clint.command('--analytics', '-a', 'Add google analytics tracking id ' + '-a UA-1199722-3'.green);
	clint.command('--disqus', '-d', 'Add disqus comments, pass disqus forum name ' + '-d doctor-md'.green);
	clint.command('--ci', '-c', 'Add TravisCI build status badge ' + '-c http://travis-ci.org/DimitarChristoff/Epitome'.green);
	clint.command('--template', null, 'Use a custom handlebars template file ' + '--template ./tpl/docs.hbs'.green);
	clint.command('--js', null, 'Use a custom js/ folder to deploy to dist/js ' + '--js ./lib/js'.green);
	clint.command('--images', null, 'Use a custom images/ folder to deploy to dist/images ' + '--images ./lib/images'.green);
	clint.command('--less', '-l', 'Use a custom less/bootstrap.less dir to compile css ' + '--l ./less/custom.less'.green);
	clint.command('--logo', null, 'Use a custom logo in header ' + '--logo http://domain.io/img/logo.png'.green);


	var logo = function(){
		console.warn('  .         .'.grey);
		console.warn(',-| ,-. ,-. |- ,-. ,-.'.grey);
		console.warn('| | | | |   |  | | |'.white);
		console.warn("`-^ `-' `-' `' `-' ' ".grey + json.version.white + '\n');
	};

	var help = function(err){
		// header
		logo();

		console.log(clint.help(2, " : ".grey));
		process.exit(err);
	};



	var args = process.argv.splice(2);
	if (!args.length){
		help(0);
		console.log('Usage:\n\n doctor file.md build "my title"');
		console.log(' doctor https://raw.github.com/jshint/jshint/master/README.md build "JSHINT documentation"');
		console.log('\nFor more and how to use under nodejs, see the docs https://github.com/DimitarChristoff/doctor');
	}
	else {
		var opt = {};

		clint.on('command', function(name, value){
			switch (name){
				case "--help": help(0); break;
				case "--version": console.log(json.version); process.exit(0); break;
				case "--input":
					if (value)
						opt.source = value;
					break;
				case "--output":
					if (value)
						opt.output = value;
					break;
				case '--title':
					if (value)
						opt.title = value;
					break;
				case '--twitter':
					if (value)
						opt.twitter = value;
					break;
				case '--github':
					if (value)
						opt.github = value;
					break;
				case "--ci" :
					if (value)
						opt.travis = value;
					break;
				case "--template":
					if (value)
						opt.pageTemplate = value;
					break;
				case "--js":
					if (value)
						opt.js = value;
					break;
				case "--images":
					if (value)
						opt.images = value;
					break;
				case "--less":
					if (value)
						opt.less = value;
					break;
				case "--logo":
					if (value)
						opt.logo = value;
					break;
				case "--analytics":
					if (value)
						opt.analytics = value;
					break;
				case "--disqus":
					if (value)
						opt.disqus = value;
			}
		});


		clint.on('complete', function(){

			if (!opt.source){
				console.log();
				console.warn('ERROR:'.red + ' Missing input file or url, see help below on ' + '-i'.green);
				help(2);
			}
			else {
				logo();
				doctor.process(opt);
			}
		});

		clint.parse(args);
	}
}