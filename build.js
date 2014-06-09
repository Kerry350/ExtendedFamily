var Metalsmith = require('metalsmith');
var Handlebars = require('handlebars');
var assets = require('metalsmith-assets');
var collections = require('metalsmith-collections');
var markdown = require('metalsmith-markdown');
var templates = require('metalsmith-templates');
var paginate = require('metalsmith-paginate'); // Not used yet
var colors = require('colors');
var AWS = require('aws-sdk');

Handlebars.registerHelper('generateGallery', function(name, images, options) {
  var images = images[name.toLowerCase()];
  return options.fn(images);
});

console.log(">>> Generating site".green)

var ENV = process.argv[2];

console.log(">>> The ".green + ENV.green + ' environment has been selected'.green);

var environments = {
  dev: {
    prefix: __dirname + '/dist/' 
  },

  production: {
    prefix: '<SITE_URL>' + '/'
  }
};

// HAS BEEN REPLACED BY THE S3 VERSION
// Given a folder structure of rabbits/images
// images.rabbits should be exposed, i.e.
//    {{#each images.rabbits}}
//      <img src="this" />
//    {{/each}}
 
//  images = {
//    rabbits: ['/rabbits/images/bunny.jpg', '/rabbits/cedric/images/ceddy.jpg']  
//  }
// TODO: Explicitly match image files, miss things like .DS_STORE etc
function imageGalleries(files, metalsmith, done) {
  console.log(">>> Generating image galleries".green);
  
  var metadata = metalsmith.metadata();
  metadata.images = {};
  var keys = Object.keys(files);
  
  keys.forEach(function(key) {
    var index = key.indexOf('images');

    if (index >= 0) {
      var dirs = key.split('/');
      var imageDirIndex = dirs.indexOf('images');
      var lookupKey = imageDirIndex - 1;

      if (!metadata.images[dirs[lookupKey]]) {
        metadata.images[dirs[lookupKey]] = [];
      }

      metadata.images[dirs[lookupKey]].push(environments[ENV].prefix + key);
    }
  });

  done();
}

// Will access the solitary S3 Bucket for the pet galleries / this site
// Items will be keyed so that the first word, before the first colon, is the gallery name
// jake:whatever.jpg
// jake:whatever-2x.jpg
// Those two files would become part of the Jake gallery. Accessible under metadata.images.jake
function fetchS3Galleries(files, metalsmith, done) {
  var metadata = metalsmith.metadata();
  metadata.images = {};
  var s3 = new AWS.S3();

  var params = {
    Bucket: 'thefurrybrotherhood'
  };

  s3.listObjects(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      var BASE_URL = 'https://s3-eu-west-1.amazonaws.com/thefurrybrotherhood/';

      // https://s3-eu-west-1.amazonaws.com/thefurrybrotherhood/jake%3Asomething
      data.Contents.forEach(function(item) {
        var fileParts = item.Key.split(':');
        var gallery = fileParts[0];

        if (!metadata.images[gallery]) {
          metadata.images[gallery] = [];
        }

        metadata.images[gallery].push(BASE_URL + encodeURI(item.Key));
      });

      console.log(">>> Metadata.images", metadata.images);
    }

    done();
  });
}

// Not sure if this is really required, or even 'right', but it works...
function hrefs(files, metalsmith, done) {
  var keys = Object.keys(files);
  keys.forEach(function(key) {
    files[key].href = environments[ENV].prefix + key;
  });
  done();
}

Metalsmith(__dirname)
  .source('./site')
  .destination('./dist')
  .use(markdown())
  .use(fetchS3Galleries)
  .use(assets({
    source: './assets', // relative to the working directory
    destination: './assets' // relative to the build directory
  }))
  .use(collections({
    rabbits: {
      sortBy: 'name'
    },
    rats: {
      sortBy: 'name'
    }
  }))
  .use(hrefs)
  .use(templates({
    engine: 'handlebars'
  }))
  .build(function(err, files) {
    if (err) {
      console.log(err.red);
    } else {
      console.log(">>> Site successfully generated".green);
    }
  });