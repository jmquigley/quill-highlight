/**
 * A custom Quill highlighting module for markup modes/styles.  It manages
 * multiple mode instances  that are used to apply text formatting to the
 * contents of the control.
 *
 * The module is added to the component per the API instructions:
 * https://quilljs.com/guides/building-a-custom-module/
 *
 * Once the module is initialized the highlighting mode can be changed with
 * the `set` functions.  This just changes what the reference internally to
 * another class that handles the formatting.
 *
 * #### Examples:
 *
 * ```javascript
 * import {MarkupMode, MarkupStyle, Markup} from './lib/markup';
 *
 * Quill.register('modules/markup', Markup);
 * const quill = new Quill('#editor', {
 *     modules: {
 *         history: {
 *             delay: 2000,
 *             maxStack: 500,
 *             userOnly: true
 *         },
 *         markup: {
 *             mode: MarkupMode.text,
 *             styling: MarkupStyle.plain
 *         },
 *         toolbar: false
 *     },
 *     theme: 'snow'
 * });
 * ...
 * const hl = quill.getModule('highlight');
 * hl.set({
 *     content: 'some value',
 *     mode: MarkupMode.markdown,
 *     styling: MarkupStyle.monokai
 * });
 * ```
 *
 * Note that initial content cannot be set in the contructor to the module.
 * it is overwritten with the contents of the `#editor` div as Qill is
 * instatiated.  It can be set after creation of the Quill instance using
 * the `.setContent('')` function.
 *
 * @module Markup
 */

'use strict';

import {Section, section as getSection} from 'util.section';
import {BaseMarkupMode, Markdown, Text} from './modes';

export enum MarkupMode {
	markdown,
	richedit,
	text
}

export enum MarkupStyle {
	custom = 'custom',
	plain = 'plain',
	monokai = 'monokai'
}

export interface MarkupOptions {
	content?: string;
	custom?: any;
	fontName?: string;
	fontSize?: number;
	mode: MarkupMode;
	styling: MarkupStyle;
}

const styles = require('./styles.css');
const fonts = require('./fonts/fonts.css');
const debug = require('debug')('markup');
const pkg = require('../package.json');

debug(`styles: ${JSON.stringify(styles)}`);
debug(`fonts: ${JSON.stringify(fonts)}`);

export class Markup {

	// The number of lines above and below the current position that will be
	// repainted with the processor
	private static readonly SECTION_SIZE: number = 40;
	private static readonly THRESHOLD: number = 600;

	// This is the time before the whole document is rescanned for
	// highlighting
	private _delay: number = 5000;
	private _processing: boolean = false;

	// A reference to the DOM editor node
	private _editor: HTMLElement;

	private _fonts: string[] = [
		'inconsolata',
		'firamono',
		'sourcecodepro'
	];
	private _modes: Map<MarkupMode, any> = new Map<MarkupMode, any>();
	private _opts: MarkupOptions;
	private _processor: BaseMarkupMode;
	private _quill: any;
	private _section: Section = {
		start: 0,
		end: 0,
		text: ''
	};
	private _styles: Map<string, any> = new Map<string, any>();

	constructor(quill: any, opts: MarkupOptions) {
		debug('Initializing markup module');

		this._quill = quill;
		this._opts = Object.assign({
			content: '',
			custom: {},
			fontName: 'inconsolata',
			fontSize: 13,
			mode: MarkupMode.text,
			styling: MarkupStyle.plain
		}, opts);

		this._editor = document.getElementById('editor');

		this.loadStyles();

		this._modes[MarkupMode.markdown] = new Markdown(quill);
		this._modes[MarkupMode.text] = new Text(quill);

		// bind all potential callbacks to the class.
		[
			'handleEditorChange',
			'handleTextChange',
			'redo',
			'set',
			'setBold',
			'setContent',
			'setItalic',
			'setFont',
			'setFontSize',
			'setHeader',
			'setStrikeThrough',
			'setUnderline',
			'undo'
		]
		.forEach((fn: string) => {
			this[fn] = this[fn].bind(this);
		});

		quill.on('editor-change', this.handleEditorChange);
		quill.on('text-change', this.handleTextChange);
	}

	private loadStyles() {
		const baseStyles = require('./styles/base.json');

		this._styles[MarkupStyle.monokai] = Object.assign(
			baseStyles,
			require('./styles/monokai.json')
		);
		this._styles[MarkupStyle.plain] = require('./styles/plain.json');
		this._styles[MarkupStyle.custom] = this._opts.custom;
	}

	/**
	 * Calls the quill history redo function
	 */
	public redo() {
		if (this._quill.history) {
			this._quill.history.redo();
		}
	}

	/**
	 * Changes the current highlighting mode and display style.  It also sets
	 * the content within control.
	 * @param opts {HighlightOptions} configuration options.  `mode` sets the
	 * editing mode.  `styling` sets the current display theme.  `custom` is
	 * an object that contains custom format colors (for highlights).  The
	 * `content` resets the content within the control.  If this is null it
	 * is ignored.
	 */
	public set(opts: MarkupOptions) {

		this._opts = opts = Object.assign(this._opts, opts);
		debug('current markup options: %o', this._opts);

		this._styles[MarkupStyle.custom] = this._opts.custom;
		this._processor = this._modes[opts.mode];
		this._processor.style = this._styles[opts.styling];

		if (opts.content) {

			// Temporary code below.  This is just conveniece code for
			// testing.
			if (pkg['debug']) {
				opts.content = '*Hello World*\n';
				for (let i = 0; i < 25; i++) {
					for (let j = 0; j < 40; j++) {
						opts.content += `${String.fromCharCode(i + 97)} `;
					}
					opts.content += '\n';
				}
			}

			this.setContent(opts.content);
		}

		this.setFont(opts.fontName);
		this.setFontSize(opts.fontSize);

		this._section = getSection(opts.content, 0, Markup.SECTION_SIZE, Markup.THRESHOLD);
		this._processor.markup(0, opts.content.length);
	}

	/**
	 * Will call the current processor's bold function to make the current
	 * highlight or word bold.
	 */
	public setBold() {
		this._processor.handleBold();
	}

	/**
	 * Will update the current content of the control with the given
	 * @param content {string} the new content settting for the editor.
	 */
	public setContent(content: string) {
		this._processor.content = content;
		this._quill.setText(content);
	}

	/**
	 * Calls the processor's current header creation function
	 * @param level {string} the level selected by the user
	 */
	public setHeader(level: string) {
		this._processor.handleHeader(Number(level));
	}

	/**
	 * Calls the current processor's italic function to make the current
	 * highlight or word italic.
	 */
	public setItalic() {
		this._processor.handleItalic();
	}

	/**
	 * Calls the current processor's strikthrogh function to highlight the
	 * current word/selection.
	 */
	public setStrikeThrough() {
		this._processor.handleStrikeThrough();
	}

	/**
	 * Calls the current processor's underline function to highlight the
	 * current word/selection.
	 */
	public setUnderline() {
		this._processor.handleUnderline();
	}

	/**
	 * Changes the current overall font for the editor.  This control works with
	 * mono fonts, so this will set it for all text.  The fonts are all defined
	 * in `./lib/fonts`.
	 * @param fontName {string} the name of the font to set.
	 */
	public setFont(fontName: string) {

		fontName = fontName.toLowerCase();
		if (!this._fonts.includes(fontName)) {
			fontName = this._fonts[0];
		}

		debug('setting font: %s', fontName);

		for (const className of this._fonts) {
			this._editor.classList.remove(fonts[`font-${className}`]);
		}
		this._editor.classList.add(fonts[`font-${fontName}`]);
	}

	/**
	 * Changes the current overall size of the fonts within the editor.
	 * @param fontSize {number} the number of pixels in the font sizing.  This
	 * will resolve to `##px`.
	 */
	public setFontSize(fontSize: number) {
		debug('setting font size: %spx', fontSize);
		this._editor.style['font-size'] = `${fontSize}px`;
	}

	/**
	 * Calls the quill history undo function
	 */
	public undo() {
		if (this._quill.history) {
			this._quill.history.undo();
		}
	}

	/**
	 * This event is invoked whenever a change occurs in the editor (any type).
	 * @param eventName {string} the name of the event that occurred.
	 * @param args {any[]} the dyanamic parameter list passed to this event.
	 */
	private handleEditorChange(eventName: string, ...args: any[]) {
		if (eventName === 'selection-change') {
			const range = args[0];
			if (range) {
				this._processor.range = range;
				this._processor.pos = range.index;
			}

			// Compute the region that will be involved in highlighting.
			this._section = getSection(
				this._processor.text,
				this._processor.pos,
				Markup.SECTION_SIZE
			);
		}
	}

	/**
	 * Invoked with each change of the content text.
	 *
	 * This will also hold a timer to peform a full scan after 5 seconds.
	 * Using "sections" to format has a trade off where a block format on
	 * a boundary of a section can lose formatting where the bottom of the
	 * block is seen by the section, but the top is not, so the regex string
	 * will not match within the section.  This timer will send a full
	 * range of the document to the processor after N seconds (5 seconds by
	 * default).  The timer will only occur when changes occur (so it is
	 * idle if the keyboard is idle)
	 */
	private handleTextChange() {
		this._processor.markup(this._section.start, this._section.end);

		if (!this._processing) {
			this._processing = true;
			setTimeout(() => {
				this._processor.markup(0, this._quill.getText().length);
				this._processing = false;
			}, this._delay);
		}
	}
}
