This is A) A bit of fun and B) A way to show appreciation to the furry members of our family. This is a static site that uses Metalsmith as it's generator.

# To use 

Run `gulp` to run all of the Gulp tasks.
Run `gulp watch` to watch files whilst actively developing.
Assets in their minified and concatenated forms will end up in `assets/dist`, these assets will then be copied to `/dist/assets` when the site is built. The `/dist` directory is the site itself and the folder that needs to be hosted.
Run `node build.js dev` or `node build.js production` to build the site. 