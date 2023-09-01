'use strict';

const isPersistent = process.env.MB_PERSISTENT === 'true',
    docs = require('./docsTester/docs'),
    isWindows = require('os').platform().indexOf('win') === 0,
    timeout = parseInt(process.env.MB_SLOW_TEST_TIMEOUT || 6000),
    fs = require('fs-extra');

function isInProcessImposter (protocol) {
    if (fs.existsSync('protocols.json')) {
        const protocols = require(process.cwd() + '/protocols.json');
        return Object.keys(protocols).indexOf(protocol) < 0;
    }
    else {
        return true;
    }
}

async function validateDocs (page) {
    it(`${page} should be up-to-date`, async function () {
        const testScenarios = await docs.getScenarios(page),
            tests = Object.keys(testScenarios).map(testName => testScenarios[testName].assertValid());
        return Promise.all(tests);
    });
}

describe('docs', function () {
    this.timeout(timeout);

    [
        '/docs/api/mocks',
        '/docs/api/proxies',
        '/docs/api/injection',
        '/docs/api/xpath',
        '/docs/api/json',
        '/docs/protocols/https',
        '/docs/protocols/http',
        '/docs/api/jsonpath'
    ].forEach(page => {
        validateDocs(page);
    });

    // The logs change for out of process imposters
    if (isInProcessImposter('tcp')) {
        validateDocs('/docs/api/overview');
    }

    // For tcp out of process imposters or using the --datadir option, I can't get the netcat tests working,
    // even with a -q1 replacement. The nc client ends the socket connection
    // before the server has a chance to respond.
    if (isInProcessImposter('tcp') && !isWindows && !isPersistent) {
        [
            '/docs/gettingStarted',
            '/docs/api/predicates',
            '/docs/api/behaviors',
            '/docs/api/stubs',
            '/docs/protocols/tcp'
        ].forEach(page => {
            validateDocs(page);
        });
    }
});

