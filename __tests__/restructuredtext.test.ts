'use strict';

const mockCssModules = require('mock-css-modules');
mockCssModules.register(['.style', '.css']);

require('browser-env')();
require('./helpers/MutationObserver')(global);
require('./helpers/getSelection')(global);

import * as fs from 'fs-extra';
import * as path from 'path';
// import * as sinon from 'sinon';
import {Fixture} from 'util.fixture';
import {join} from 'util.join';
import {cleanup} from './helpers';

const debug = require('debug')('restructured.test');
const data = fs.readFileSync(join(__dirname, 'fixtures', 'empty-html', 'index.html')).toString('utf8');

(global as any).Quill = require('quill');

// can't use this before the global require and jsdom initialization
import {Quill} from '../lib/helpers';
let quill: any = null;

import {Markup, MarkupMode} from '../index';

afterAll((done) => {
	cleanup(path.basename(__filename), done);
});

beforeEach(() => {
	document.body.innerHTML = data;
	quill = new Quill('#editor', {
		theme: 'snow'
	});

	expect(quill).toBeDefined();
});

test('Create Markup instance with RestructuredText mode', () => {
	const fixture = new Fixture('restructuredtext');
	expect(fixture).toBeDefined();

	const txt = fixture.read('file.rst');
	expect(txt).toBeDefined();

	const markup = new Markup(quill, {
		content: txt,
		mode: MarkupMode.restructuredtext
	});

	expect(markup).toBeDefined();
	expect(markup.quill).toBeDefined();
	expect(markup.editor).toBeDefined();

	markup.refresh();

	const delta = markup.quill.getContents();
	expect(delta).toBeDefined();
	debug('%j', delta);

	expect(delta).toMatchSnapshot();
});