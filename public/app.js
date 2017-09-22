let keybindings = {
	tab: {
    	key: 9,
    	handler: function(range, context) {
			console.log(`range: ${JSON.stringify(range)}, context: ${JSON.stringify(context)}`);
 			this.quill.insertText(range.index, '    ');
			return false;
    	}
  	},
	'indent code-block': null,
	'outdent code-block': null,
	'code exit': null,
	'embed left': null,
	'embed right': null,
	'embed left shift': null,
	'embed right shift': null
};

hljs.configure({
  tabReplace: '    '
});

Quill.register(SyntaxBlot);
Quill.register('modules/markup', Markup);

let quill = new Quill('#editor', {
	clipboard: true,
	modules: {
		history: {
      		delay: 2000,
      		maxStack: 500,
      		userOnly: true
    	},
		keyboard: {
		    bindings: keybindings
		},
		markup: {
			custom: {
			}
		},
		toolbar: null
	},
	theme: 'snow'
});

let markup = quill.getModule('markup');
markup.set({
	content: 'Hello World',
	custom: {
		background: 'black',
		foreground: 'white'
	},
	mode: MarkupMode.markdown
});

document.getElementById("refresh-button").onclick = (e) => {
	markup.refresh();
}

document.getElementById("font").onchange = (e) => {
	markup.setFont(e.target.value);
}

document.getElementById("fontsize").onchange = (e) => {
	markup.setFontSize(e.target.value);
}

document.getElementById("bold-button").onclick = (e) => {
	markup.setBold();
}

document.getElementById("italic-button").onclick = (e) => {
	markup.setItalic();
}

document.getElementById("underline-button").onclick = (e) => {
	markup.setUnderline();
}

document.getElementById("strike-button").onclick = (e) => {
	markup.setStrikeThrough();
}

document.getElementById("headerlevel").onchange = (e) => {
	markup.setHeader(e.target.value);

	let elements = e.target.selectedOptions;
    for(var i = 0; i < elements.length; i++){
      elements[i].selected = false;
    }
}

document.getElementById("undo-button").onclick = (e) => {
	markup.undo();
}

document.getElementById("redo-button").onclick = (e) => {
	markup.redo();
}
