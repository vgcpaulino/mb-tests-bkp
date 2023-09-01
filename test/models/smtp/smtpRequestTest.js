'use strict';

const assert = require('assert'),
    SmtpRequest = require('../../../src/models/smtp/smtpRequest');

describe('smtpRequest', function () {
    describe('#createFrom', function () {
        it('should parse SMTP data', async function () {
            let session = {
                    remoteAddress: 'RemoteAddress',
                    envelope: {
                        mailFrom: { address: 'EnvelopeFrom' },
                        rcptTo: [{ address: 'EnvelopeTo' }]
                    }
                },
                stream = new require('stream').Readable();
            stream._read = () => {}; // eslint-disable-line no-underscore-dangle
            stream.push('From: From <from@mb.org>\r\n');
            stream.push('To: To1 <to1@mb.org>\r\n');
            stream.push('To: To2 <to2@mb.org>\r\n');
            stream.push('CC: CC1 <cc1@mb.org>\r\n');
            stream.push('CC: CC2 <cc2@mb.org>\r\n');
            stream.push('BCC: BCC1 <bcc1@mb.org>\r\n');
            stream.push('BCC: BCC2 <bcc2@mb.org>\r\n');
            stream.push('Subject: Subject\r\n');
            stream.push('\r\nBody');
            stream.push(null);

            const smtpRequest = await SmtpRequest.createFrom({ source: stream, session: session });

            assert.deepEqual(smtpRequest, {
                requestFrom: 'RemoteAddress',
                envelopeFrom: 'EnvelopeFrom',
                envelopeTo: ['EnvelopeTo'],
                from: { address: 'from@mb.org', name: 'From' },
                to: [{ address: 'to1@mb.org', name: 'To1' }, { address: 'to2@mb.org', name: 'To2' }],
                cc: [{ address: 'cc1@mb.org', name: 'CC1' }, { address: 'cc2@mb.org', name: 'CC2' }],
                bcc: [{ address: 'bcc1@mb.org', name: 'BCC1' }, { address: 'bcc2@mb.org', name: 'BCC2' }],
                subject: 'Subject',
                priority: 'normal',
                references: [],
                inReplyTo: [],
                ip: 'RemoteAddress',
                text: 'Body',
                html: '',
                attachments: []
            });
        });
    });
});
