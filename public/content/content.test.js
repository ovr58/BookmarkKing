import { JSDOM } from 'jsdom';
import { expect } from 'chai';
import sinon from 'sinon';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { addBookmarkButton, fetchBookmarks, newVideoLoaded } from './content.js';

const global = globalThis;

describe('content.js', () => {
    let window, document, youtubePlayer, chrome;

    beforeEach(() => {
        const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, { url: "https://www.youtube.com/watch?v=test" });
        window = dom.window;
        document = window.document;
        global.window = window;
        global.document = document;
        global.chrome = {
            runtime: {
                getURL: sinon.stub().returns('bookmark64x64.png'),
                onMessage: {
                    addListener: sinon.stub(),
                    removeListener: sinon.stub()
                },
                lastError: null
            },
            storage: {
                sync: {
                    get: sinon.stub(),
                    set: sinon.stub()
                },
                local: {
                    get: sinon.stub(),
                    set: sinon.stub()
                }
            },
            i18n: {
                getMessage: sinon.stub().returns('Bookmark')
            }
        };
        youtubePlayer = document.createElement('video');
        youtubePlayer.className = 'video-stream';
        document.body.appendChild(youtubePlayer);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should add a bookmark button', () => {
        addBookmarkButton();
        const bookmarkButton = document.getElementById('bookmark-btn');
        expect(bookmarkButton).to.not.be.null;
        expect(bookmarkButton.title).to.equal('Bookmark');
    });

    it('should fetch bookmarks', async () => {
        chrome.storage.sync.get.yields({ 'test': JSON.stringify([{ time: 10, title: 'Test' }]) });
        const bookmarks = await fetchBookmarks('test');
        expect(bookmarks).to.deep.equal([{ time: 10, title: 'Test' }]);
    });

    it('should handle new video loaded', async () => {
        chrome.storage.sync.get.yields({ 'test': JSON.stringify([{ time: 10, title: 'Test' }]) });
        await newVideoLoaded('test');
        const bookmarkButton = document.getElementById('bookmark-btn');
        expect(bookmarkButton).to.not.be.null;
    });

    // Add more tests as needed...
});