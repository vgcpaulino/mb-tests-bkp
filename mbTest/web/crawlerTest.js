'use strict';

const assert = require('assert'),
    api = require('../api').create(),
    crawler = require('./crawler'),
    expectedContentType = contentType => {
        if (!contentType) {
            return true;
        }
        return ['text/html', 'application/atom+xml', 'text/plain', 'application/octet-stream'].some(type => contentType.indexOf(type) >= 0);
    },
    isLocalLink = link => link.indexOf(api.url) === 0,
    isBookLink = link => link.indexOf('manning.com') > 0,
    expectedStatusCode = (link, statusCode) =>
        // The 999 Request Denied code started coming from Slideshare
        // It works locally but fails on TravisCI. I tried spoofing with a chrome user agent,
        // but it still failed on Travis, so there's some clever spider detection they're doing.
        // Added 50x codes to make test less brittle - those have been ephemeral errors, as
        // long as they're not part of the mb site itself
        [200, 301, 302, 999].indexOf(statusCode) >= 0
            || ([500, 502, 503].indexOf(statusCode) >= 0 && isLocalLink(link))
            || (statusCode === 403 && isBookLink(link));

describe('The mountebank website', function () {
    this.timeout(180000);

    it('should have no dead links and a valid sitemap', async function () {
        const crawlResults = await crawler.create().crawl(`${api.url}/`, ''),
            errors = { misses: {} }; // Validate no broken links

        errors.errors = crawlResults.errors;
        Object.keys(crawlResults.hits).forEach(link => {
            if (!expectedStatusCode(link, crawlResults.hits[link].statusCode) ||
                !expectedContentType(crawlResults.hits[link].contentType)) {
                errors.misses[link] = crawlResults.hits[link];
            }
        });

        assert.deepEqual(errors, { errors: [], misses: {} }, JSON.stringify(errors, null, 4));

        const response = await api.get('/sitemap'),
            siteLinks = Object.keys(crawlResults.hits)
                .filter(link => isLocalLink(link) && link.indexOf('#') < 0 && link.indexOf('?') < 0)
                .map(link => link.replace(api.url, 'http://www.mbtest.org')),
            linksNotInSitemap = siteLinks.filter(link => response.body.indexOf(link) < 0);

        assert.strictEqual(200, response.statusCode);
        assert.deepEqual(linksNotInSitemap, [], JSON.stringify(linksNotInSitemap));
    });
});
