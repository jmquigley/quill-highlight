"use strict";

import * as fs from "fs-extra";
import * as path from "path";
import {cleanup} from "util.fixture";
import {join} from "util.join";

// const debug = require('debug')('markup.test');

// can't use this before the global require and jsdom initialization
import {Quill} from "../lib/helpers";
let quill: any = null;

import {Markup} from "../index";

afterAll((done) => {
	cleanup({done, message: path.basename(__filename)});
});

beforeEach(() => {
	const data = fs
		.readFileSync(join(__dirname, "fixtures", "empty-html", "index.html"))
		.toString("utf8");

	document.body.innerHTML = data;
	Quill.register("modules/markup", Markup);
	quill = new Quill("#editor", {
		theme: "snow",
		modules: {
			markup: true
		}
	});

	expect(quill).toBeDefined();
});

test("Test adding the markup module to quill", () => {
	const markup = quill.getModule("markup");
	expect(markup).toBeDefined();
	expect(markup.editor).toBeDefined();
	expect(markup.editorKey).toBeDefined();
	expect(markup.modes).toEqual([
		"asciidoc",
		"markdown",
		"restructuredtext",
		"text"
	]);
});
