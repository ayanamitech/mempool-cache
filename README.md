# mempool-cache

Fetch & cache static assets for mempool instance

### Features

+ Faster page loading for mempool instances (Serving assets from locally saved cache)
+ Convert every images (jpg, png) to WebP format
+ Basic fault tolerant feature for crawler
+ Tor support
+ Enhanced privacy
+ Fetching assets with the compatible speed of rate limit using p-queue

### TO-DO

+ Native HTTP/2 support
+ Manage assets with SQL
+ Better logging module

### Endpoints

`/donations`

Should return the same result as https://mempool.space/api/v1/donations

`/donations/images/:handle`

Should return the same result as https://mempool.space/api/v1/donations/images/:handle

`/contributors`

Should return the same result as https://mempool.space/api/v1/contributors

`/contributors/images/:id`

Should return the same result as https://mempool.space/api/v1/contributors/images/:id

`/translators`

Should return the same result as https://mempool.space/api/v1/translators

`/translators/images/:translator`

Should return the same result as https://mempool.space/api/v1/translators/images/:translator

`/assets/featured`

Should return the same result as https://liquid.network/api/v1/assets/featured

`/assets/group/:id`

Should return the same result as https://liquid.network/api/v1/assets/group/:id
