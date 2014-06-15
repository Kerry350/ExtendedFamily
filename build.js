var Metalsmith = require('metalsmith');
var Handlebars = require('handlebars');
var assets = require('metalsmith-assets');
var collections = require('metalsmith-collections');
var markdown = require('metalsmith-markdown');
var templates = require('metalsmith-templates');
var paginate = require('metalsmith-paginate'); // Not used yet
var colors = require('colors');
var AWS = require('aws-sdk');
var fs = require('fs');

Handlebars.registerHelper('generateGallery', function(name, images, options) {
  var images = images[name.toLowerCase()];
  var string = '';
  if (images) {
    images.forEach(function(image) {
      string += "<div class='image'><a href='" + image.regular + "'><div class='img-holder' style=\"background-image: url('" + image.small + "')\"></div></a></div> "
    });
  }  
  return new Handlebars.SafeString(string);
});

Handlebars.registerPartial('header', fs.readFileSync(__dirname + '/templates/partials/header.hbs').toString());
Handlebars.registerPartial('footer', fs.readFileSync(__dirname + '/templates/partials/footer.hbs').toString());

console.log(">>> Generating site".green)

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

        var fileParts = item.Key.split('~');
        var gallery = fileParts[0];

        if (!metadata.images[gallery]) {
          metadata.images[gallery] = [];
        }

        if (item.Key.indexOf('@') === -1) {
          var srcParts = item.Key.split('.')
          var small = srcParts[0] + '@1x.' + srcParts[1];
          metadata.images[gallery].push({
            regular: BASE_URL + encodeURI(item.Key),
            small: BASE_URL + encodeURI(small) 
          });
        }
      });

      // console.log(">>> Metadata.images", metadata.images);
    }

    done();
  });
}

// Not sure if this is really required, or even 'right', but it works...
function hrefs(files, metalsmith, done) {
  var keys = Object.keys(files);
  keys.forEach(function(key) {
    files[key].href = '/' + key;
  });
  done();
}

Metalsmith(__dirname)
  .source('./site')
  .destination('./dist')
  .use(markdown())
  .use(fetchS3Galleries)
  .use(assets({
    source: './assets/dist', // relative to the working directory
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