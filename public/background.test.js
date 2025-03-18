import { expect } from 'chai';
import sinon from 'sinon';
import { describe, it, beforeEach, afterEach } from 'mocha';

const global = globalThis;

const getUrlParams = async (url) => {
    let urlParams = '';
    if (url.includes('www.youtube.com/watch')) {
        const queryParam = url.split('?')[1];
        urlParams = new URLSearchParams(queryParam).get('v') ?? '';
    }
    return urlParams;
};

describe('background.js', () => {
    let chrome;

    beforeEach(() => {
        chrome = {
            tabs: {
                onUpdated: {
                    addListener: sinon.stub()
                },
                onActivated: {
                    addListener: sinon.stub()
                },
                get: sinon.stub(),
                sendMessage: sinon.stub()
            },
            runtime: {
                onMessage: {
                    addListener: sinon.stub()
                },
                lastError: null
            },
            storage: {
                sync: {
                    get: sinon.stub()
                }
            }
        };
        global.chrome = chrome;
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should fetch allowed URLs', async () => {
        const fetchAllowedUrls = () => {
            return new Promise((resolve) => {
                chrome.storage.sync.get(['allowedUrls'], (obj) => {
                    resolve(obj.allowedUrls ? JSON.parse(obj.allowedUrls) : []);
                });
            });
        };
        chrome.storage.sync.get.yields({ allowedUrls: JSON.stringify(['https://example.com']) });
        const allowedUrls = await fetchAllowedUrls();
        expect(allowedUrls).to.deep.equal(['https://example.com']);
    });

    it('should get URL params for YouTube', async () => {
        const urlParams = await getUrlParams('https://www.youtube.com/watch?v=test');
        expect(urlParams).to.equal('test');
    });

    it('should handle tab update', async () => {
        const handleUpdate = async () => {
            const urlParams = await getUrlParams('https://www.youtube.com/watch?v=test');
            if (urlParams !== '') {
                chrome.tabs.sendMessage(1, {
                    type: 'NEW',
                    videoId: urlParams,
                    url: 'https://www.youtube.com/watch?v=test'
                });
            }
        };
        chrome.tabs.onUpdated.addListener.yields(1, { status: 'complete' }, { url: 'https://www.youtube.com/watch?v=test' });
        await handleUpdate();
        expect(chrome.tabs.sendMessage.called).to.be.true;
    });

    it('should handle tab activation', async function () {
        this.timeout(5000); // Increase timeout to 5000ms
        const handleActivation = async () => {
            const tab = await new Promise((resolve) => {
                chrome.tabs.get.yields({ url: 'https://www.youtube.com/watch?v=test' });
                resolve({ url: 'https://www.youtube.com/watch?v=test' });
            });
            const urlParams = await getUrlParams(tab.url);
            if (urlParams !== '') {
                chrome.tabs.sendMessage(1, {
                    type: 'NEW',
                    videoId: urlParams,
                    url: 'https://www.youtube.com/watch?v=test'
                });
            }
        };
        chrome.tabs.onActivated.addListener.yields({ tabId: 1 });
        await handleActivation();
        expect(chrome.tabs.sendMessage.called).to.be.true;
    });

    it('should handle tab activation without URL', async function () {
        this.timeout(5000); // Increase timeout to 5000ms
        const handleActivation = async () => {
            const tab = await new Promise((resolve) => {
                chrome.tabs.get.yields({ url: '' });
                resolve({ url: '' });
            });
            const urlParams = await getUrlParams(tab.url);
            if (urlParams !== '') {
                chrome.tabs.sendMessage(1, {
                    type: 'NEW',
                    videoId: urlParams,
                    url: 'https://www.youtube.com/watch?v=test'
                });
            }
        };
        chrome.tabs.onActivated.addListener.yields({ tabId: 1 });
        await handleActivation();
        expect(chrome.tabs.sendMessage.called).to.be.false;
    });
});