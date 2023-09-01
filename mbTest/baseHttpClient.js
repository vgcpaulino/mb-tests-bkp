'use strict';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function create (protocol) {
    const driver = require(protocol);

    function optionsFor (spec) {
        if (!spec.hostname) {
            spec.hostname = 'localhost';
        }
        if (!spec.headers) {
            spec.headers = {};
        }
        if (!Object.keys(spec.headers).some(key => key.toLowerCase() === 'accept')) {
            spec.headers.accept = 'application/json';
        }
        spec.rejectUnauthorized = false;
        return spec;
    }

    async function responseFor (spec) {
        const options = optionsFor(spec);

        if (!spec.agent && !spec.createConnection) {
            options.agent = new driver.Agent({ keepAlive: true });
        }

        if (!options.port) {
            throw Error('silly rabbit, you forgot to pass the port again');
        }

        if (spec.body && !options.headers['Content-Type']) {
            options.headers['Content-Type'] = 'application/json';
        }

        return new Promise((resolve, reject) => {
            const request = driver.request(options, response => {
                const packets = [];

                response.on('data', chunk => packets.push(chunk));

                response.on('end', () => {
                    const buffer = Buffer.concat(packets),
                        contentType = response.headers['content-type'] || '';

                    response.body = spec.mode === 'binary' ? buffer : buffer.toString('utf8');

                    if (contentType.indexOf('application/json') === 0) {
                        response.body = JSON.parse(response.body);
                    }
                    resolve(response);
                });
            });

            request.on('error', reject);

            if (spec.body) {
                if (spec.mode === 'binary') {
                    request.write(spec.body);
                }
                else if (typeof spec.body === 'object') {
                    request.write(JSON.stringify(spec.body));
                }
                else {
                    request.write(spec.body);
                }
            }
            request.end();
        });
    }

    function get (path, port, headers) { return responseFor({ method: 'GET', path, port, headers }); }
    function post (path, body, port, headers) { return responseFor({ method: 'POST', path, port, body, headers }); }
    function del (path, port, headers) { return responseFor({ method: 'DELETE', path, port, headers }); }
    function put (path, body, port, headers) { return responseFor({ method: 'PUT', path, port, body, headers }); }

    return { get, post, del, put, responseFor };
}

module.exports = { create };
