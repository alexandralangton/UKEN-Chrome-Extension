/* eslint-disable no-loop-func */
/* eslint-disable complexity */

import {
	dictionary,
	firstWordDouble,
	fullDoublePhrase,
	popupText,
	months,
} from './dictionary.js';

function inlineRemover(word) {
	word = word.replace(/<\w+>/g, '');
	word = word.replace(/<\/\w+>/g, '');
	return word;
}

// Remove all punctuation, plurals and capitals before looking up the word in the dictionary
function simplifyBefore(word) {
	word = word.toLowerCase();
	word = inlineRemover(word);

	if (':;.,"\'?!°)}]<'.includes(word[word.length - 1])) {
		word = word.slice(0, -1);
	}
	if ('.,"\'{[(#>'.includes(word[0])) {
		word = word.slice(1);
	}
	if (word.endsWith('s') && !word.endsWith('ss') && word !== 'gas') {
		word = word.slice(0, -1);
	}
	if (word.endsWith('zed')) {
		word = word.slice(0, -1);
	}
	if (word.endsWith('lled')) {
		word = word.slice(0, -2);
	} else if (word.endsWith('llment')) {
		word = word.slice(0, -4);
	}
	return word;
}

// match the case of the looked up EN-UK word to the original
function matchCase(usWord, ukWord) {
	let result = '';

	for (let i = 0; i < ukWord.length; i++) {
		let usCode, ukLetter;
		if (i === 0) {
			ukLetter = ukWord.charAt(i);
			usCode = usWord.charCodeAt(i);
		} else {
			ukLetter = ukWord.charAt(i);
			usCode = usWord.charCodeAt(1);
		}
		if (usCode >= 65 && usCode < 65 + 26) {
			result += ukLetter.toUpperCase();
		} else {
			result += ukLetter.toLowerCase();
		}
	}
	return result;
}

function inlineAdder(word, translatedWord) {
	let frontInline = '',
		endInline = '';
	if (/<\w+>/g.test(word)) {
		let endIdx = word.lastIndexOf('>');
		frontInline = word.slice(0, endIdx);
	}
	if (/<\/\w+>/g.test(word)) {
		let startIdx = word.indexOf('<');
		endInline = word.slice(startIdx);
	}
	// console.log(frontInline + translatedWord + endInline);
	return frontInline + translatedWord + endInline;
}

function rebuildTranslatedWord(word, translatedWord, twoToOnePlural) {
	if ('-.,:;"\'?!)}]°<'.includes(word[word.length - 1])) {
		if (word.slice(0, -1).endsWith('s')) {
			translatedWord = translatedWord + 's';
		}
		translatedWord = translatedWord + word[word.length - 1];
	}
	if ('-.,"\'{[(#>'.includes(word[0])) {
		translatedWord = word[0] + translatedWord;
	}
	if (word.endsWith('s') || twoToOnePlural === 's') {
		translatedWord = translatedWord + 's';
	}
	if (word.endsWith('zed') || twoToOnePlural === 'zed') {
		translatedWord = translatedWord + 'd';
	}
	if (word.endsWith('lled')) {
		translatedWord = translatedWord + 'ed';
	} else if (word.endsWith('llment')) {
		translatedWord = translatedWord + 'ment';
	}
	return translatedWord;
}

// Get the word out of the dictionary & adjust the format to match the original word (caps & punctuation)
function translate(word, wordToTest) {
	let translatedWord;
	// extract the UKEN word from the dictionary
	translatedWord = dictionary[wordToTest];

	// make sure the translated word has the same capitalization as the original
	translatedWord = matchCase(inlineRemover(word), translatedWord);

	// add any punctuation before/after & plurals back in
	translatedWord = rebuildTranslatedWord(word, translatedWord);

	// add back in any inline tags before returning the word
	return inlineAdder(word, translatedWord);
}

let skipWord = 0;
let skipTwoWords = false;

function translateTwoWordPhrase(wordOne, editedWordOne, wordTwo) {
	if (!wordTwo) return null;

	let editedWordTwo = simplifyBefore(wordTwo);
	let phrase = editedWordOne + ' ' + editedWordTwo;

	if (fullDoublePhrase[phrase]) {
		let [translatedWordOne, translatedWordTwo] = fullDoublePhrase[phrase].split(
			' '
		);
		let twoToOnePlural = undefined;
		if (!translatedWordTwo) {
			if (wordTwo.endsWith('s')) twoToOnePlural = 's';
		}
		//match the case of the original word
		translatedWordOne = matchCase(inlineRemover(wordOne), translatedWordOne);
		// add any punctuation before/after & plurals back in
		translatedWordOne = rebuildTranslatedWord(
			wordOne,
			translatedWordOne,
			twoToOnePlural
		);
		//add back in any inline tags before returning the word
		translatedWordOne = inlineAdder(wordOne, translatedWordOne);

		if (translatedWordTwo) {
			// match the case of the original word
			translatedWordTwo = matchCase(inlineRemover(wordTwo), translatedWordTwo);
			// add any punctuation before/after & plurals back in
			translatedWordTwo = rebuildTranslatedWord(wordTwo, translatedWordTwo);
			//add back in any inline tags before returning the word
			translatedWordTwo = inlineAdder(wordTwo, translatedWordTwo);
		}

		return translatedWordTwo
			? translatedWordOne + ' ' + translatedWordTwo
			: translatedWordOne;
	} else {
		return null;
	}
}

let popupIdNo = 1;

function conversions(num, nextWord, nextNextWord) {
	if (!nextWord || !nextNextWord) return null;

	let checkNextWord = simplifyBefore(nextWord);
	let checkNextNextWord = simplifyBefore(nextNextWord);
	let popupCopy;
	let returnText = undefined;
	if (
		checkNextWord === 'f' ||
		(checkNextWord === 'degree' && checkNextNextWord === 'fahrenheit') ||
		(checkNextWord === 'degree' && checkNextNextWord === 'f')
	) {
		if (checkNextNextWord === 'f' || checkNextNextWord === 'fahrenheit') {
			returnText = `${num} ${nextWord} ${nextNextWord}`;
			skipTwoWords = true;
		} else {
			returnText = `${num} ${nextWord}`;
		}
		if (Number(num) > 200) {
			popupCopy = popupText.cookingF;
		} else if (Number(num) >= 80) {
			popupCopy = popupText.hotWeatherF;
		} else if (Number(num) >= 40) {
			popupCopy = popupText.midWeatherF;
		} else {
			popupCopy = popupText.coldWeatherF;
		}
	} else if (checkNextWord === 'cup') {
		returnText = `${num} ${nextWord}`;
		popupCopy = popupText.cupText;
	}
	if (returnText) {
		++popupIdNo;
		skipWord = true;
		return `<div class="popup" onclick="let popup = document.getElementById('myPopup${
			popupIdNo - 1
		}');
        popup.classList.toggle('show');"> ${returnText}
        <span class="popuptext" id="myPopup${popupIdNo - 1}">${popupCopy}</span>
      </div>`;
	} else {
		return null;
	}
}

function swap(arr, idxOne, idxTwo) {
	let temp = arr[idxOne];
	arr[idxOne] = arr[idxTwo];
	arr[idxTwo] = temp;
	return arr;
}

// eslint-disable-next-line max-statements
export function replaceDates(input, nlp) {
	let datesArr = nlp(input.replace(/<.+>/, '')).dates().out('array');
	if (datesArr.length) {
		// console.log('raw input: ', input);
		let date = datesArr[0].split(' ');
		let testMonth = simplifyBefore(date[0]);
		// console.log('split date Arr: ', date);
		if (date.length === 1) {
			if (months[testMonth]) return;
			let splitChar;
			if (date[0].match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
				splitChar = '/';
			} else if (date[0].match(/\d{1,2}\.\d{1,2}\.\d{2,4}/)) {
				splitChar = '.';
			} else if (date[0].match(/\d{1,2}-\d{1,2}-\d{2,4}/)) {
				splitChar = '-';
			}
			if (splitChar) {
				// console.log('original text to swap: ', input);
				console.log('date: ', date);
				let toSwitch = swap(date[0].split(splitChar), 0, 1);
				// console.log('this should be updated: ', toSwitch.join(splitChar));
				return toSwitch.join(splitChar);
			}
		} else {
			// console.log('date before: ', date);
			if (!months[testMonth]) {
				// console.log('this one failed the test: ', testMonth);
				return;
			} else if (date.length === 2) {
				if (date[1].match(/\d{4}/)) return;
			}
			let simpleDay = simplifyBefore(date[1]);
			let newMonth = rebuildTranslatedWord(date[1], testMonth);
			newMonth = newMonth[0].toUpperCase() + newMonth.slice(1);
			let newDay = rebuildTranslatedWord(date[0], simpleDay);
			date[0] = inlineAdder(date[0], newDay);
			date[1] = inlineAdder(date[1], newMonth);
			// console.log('date after swap: ', date);
			if (date.length > 2) {
				skipTwoWords = true;
			}
			skipWord = true;
			// console.log('lets see you then: ', date.join(' '));
			return date.join(' ');
		}
	}
}

let elementNo = 0;
let wordCount = 0;

// Check all of a particular tag type's innerText for words to translate and replace them if needed
function findWordsToTranslate(elements) {
	for (let i = 0; i < elements.length; i++) {
		++elementNo;
		elements[i].innerHTML = elements[i].innerHTML
			.split(' ')
			.map((word, idx, arr) => {
				++wordCount;
				// if a two/three word phrase has been found previously, reset 'skipWord' and return an empty string
				if (skipTwoWords) {
					skipTwoWords = false;
					return '';
				}
				if (skipWord) {
					skipWord = false;
					return '';
				}
				// clean up the word before testing
				let wordToTest = simplifyBefore(word);
				// check for dates to convert
				if (!isNaN(parseInt(wordToTest, 10)) || months[wordToTest]) {
					let date = replaceDates(
						`${word} ${arr[idx + 1]} ${arr[idx + 2]}`,
						nlp
					);
					if (date) return date;
				}
				// check for potential conversions / pop ups
				if (!isNaN(parseInt(wordToTest, 10))) {
					let popup = conversions(word, arr[idx + 1], arr[idx + 2]);
					if (popup) return popup;
				}
				// check if this is part of a two word phrase
				if (firstWordDouble[wordToTest]) {
					let twoWordPhrase = translateTwoWordPhrase(
						word,
						wordToTest,
						arr[idx + 1]
					);
					if (twoWordPhrase) {
						skipWord = true;
						return twoWordPhrase;
					}
				}
				// check if this this word alone is a match for translation
				if (dictionary[wordToTest]) {
					return translate(word, wordToTest);
				} else {
					// if there have been no matches, the word does not need translating and can be returned as is
					return word;
				}
			})
			.join(' ');
	}
	return elements;
}

// List of HTML elements to translate the inner text
const tagNames = [
	'p',
	'span',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'li',
	'a',
	'td',
];

// code that activates on Extension button clicks and runs the 'find words to translate' function
window.addEventListener('message', (event) => {
	const startTime = new Date();
	if (event.data === 'lion') {
		nlp.extend(compromiseNumbers);
		nlp.extend(compromiseDates);
		tagNames.forEach((tag) =>
			findWordsToTranslate(document.getElementsByTagName(tag))
		);
		console.log('Number of Words Parsed: ', wordCount);
		console.log('Number of Elements Parsed: ', elementNo);
		console.log('Run Time: ', new Date() - startTime);
	}
});
