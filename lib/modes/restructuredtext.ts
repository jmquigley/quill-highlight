'use strict';

import {BaseMarkupMode} from './base';

const debug = require('debug')('RestructuredText');

export class RestructuredText extends BaseMarkupMode {
	constructor(quill: any) {
		super(quill);
		debug('creating RestructuredText mode %o', quill);
	}

	public highlightInline() {}
	public highlightBlock() {}

	public handleBold() {}
	public handleHeader(level: number) { level = 0; }
	public handleItalic() {}
	public handleMono() {}
	public handleStrikeThrough() {}
	public handleUnderline() {}
}
