/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import type { Translations } from './registry'
import { getLanguage } from './locale'
import {
	getAppTranslations,
	hasAppTranslations,
	registerAppTranslations,
	unregisterAppTranslations,
} from './registry'

import DOMPurify from 'dompurify'
import escapeHTML from 'escape-html'

/** @notExported */
interface TranslationOptions {
	/** enable/disable auto escape of placeholders (by default enabled) */
	escape?: boolean
	/** enable/disable sanitization (by default enabled) */
	sanitize?: boolean
}

/** @notExported */
interface TranslationVariableReplacementObject<T> {
	/** The value to use for the replacement */
	value: T
	/** Overwrite the `escape` option just for this replacement */
	escape: boolean
}

/** @notExported */
type TranslationVariables = Record<string, string | number | TranslationVariableReplacementObject<string | number>>

/**
 * Translate a string
 *
 * @param {string} app the id of the app for which to translate the string
 * @param {string} text the string to translate
 * @param {object} vars map of placeholder key to value
 * @param {number} number to replace %n with
 * @param {object} [options] options object
 * @param {boolean} options.escape enable/disable auto escape of placeholders (by default enabled)
 * @param {boolean} options.sanitize enable/disable sanitization (by default enabled)
 *
 * @return {string}
 */
export function translate(
	app: string,
	text: string,
	vars?: TranslationVariables,
	number?: number,
	options?: TranslationOptions,
): string {
	const allOptions = {
		// defaults
		escape: true,
		sanitize: true,
		// overwrite with user config
		...(options || {}),
	}

	const identity = <T, >(value: T): T => value
	const optSanitize = allOptions.sanitize ? DOMPurify.sanitize : identity
	const optEscape = allOptions.escape ? escapeHTML : identity

	const isValidReplacement = (value: unknown) => typeof value === 'string' || typeof value === 'number'

	// TODO: cache this function to avoid inline recreation
	// of the same function over and over again in case
	// translate() is used in a loop
	const _build = (text: string, vars?: TranslationVariables, number?: number) => {
		return text.replace(/%n/g, '' + number).replace(/{([^{}]*)}/g, (match, key) => {
			if (vars === undefined || !(key in vars)) {
				return optEscape(match)
			}

			const replacement = vars[key]
			if (isValidReplacement(replacement)) {
				return optEscape(`${replacement}`)
			} else if (typeof replacement === 'object' && isValidReplacement(replacement.value)) {
				// Replacement is an object so indiviual escape handling
				const escape = replacement.escape !== false ? escapeHTML : identity
				return escape(`${replacement.value}`)
			} else {
				/* This should not happen,
				 * but the variables are used defined so not allowed types could still be given,
				 * in this case ignore the replacement and use the placeholder
				 */
				return optEscape(match)
			}
		})
	}

	const bundle = getAppTranslations(app)
	let translation = bundle.translations[text] || text
	translation = Array.isArray(translation) ? translation[0] : translation

	if (typeof vars === 'object' || number !== undefined) {
		return optSanitize(_build(
			translation,
			vars,
			number,
		))
	} else {
		return optSanitize(translation)
	}
}

/**
 * Translate a string containing an object which possibly requires a plural form
 *
 * @param {string} app the id of the app for which to translate the string
 * @param {string} textSingular the string to translate for exactly one object
 * @param {string} textPlural the string to translate for n objects
 * @param {number} number number to determine whether to use singular or plural
 * @param {object} vars of placeholder key to value
 * @param {object} options options object
 */
export function translatePlural(
	app: string,
	textSingular: string,
	textPlural: string,
	number: number,
	vars?: Record<string, string | number>,
	options?: TranslationOptions,
): string {
	const identifier = '_' + textSingular + '_::_' + textPlural + '_'
	const bundle = getAppTranslations(app)
	const value = bundle.translations[identifier]

	if (typeof value !== 'undefined') {
		const translation = value
		if (Array.isArray(translation)) {
			const plural = bundle.pluralFunction(number)
			return translate(app, translation[plural], vars, number, options)
		}
	}

	if (number === 1) {
		return translate(app, textSingular, vars, number, options)
	} else {
		return translate(app, textPlural, vars, number, options)
	}
}

/**
 * Load an app's translation bundle if not loaded already.
 *
 * @param {string} appName name of the app
 * @param {Function} callback callback to be called when
 * the translations are loaded
 * @return {Promise} promise
 */
export async function loadTranslations(appName: string, callback: (...args: []) => unknown) {
	if (hasAppTranslations(appName) || getLanguage() === 'en') {
		return Promise.resolve().then(callback)
	}

	const { generateFilePath } = await import('@nextcloud/router')
	const url = generateFilePath(appName, 'l10n', getLanguage() + '.json')

	const response = await fetch(url)
	if (!response.ok) {
		throw new Error(response.statusText || 'Network error')
	}
	try {
		const bundle = await response.json()
		if (typeof bundle.translations === 'object') {
			register(appName, bundle.translations)
			return Promise.resolve(bundle).then(callback)
		}
		throw new Error('Invalid content of translation bundle')
	} catch {
		// Error is probably a SyntaxError due to invalid response, this is handled by the next line
	}
	throw new Error('Invalid content of translation bundle')
}

/**
 * Register an app's translation bundle.
 *
 * @param {string} appName name of the app
 * @param {Record<string, string>} bundle translation bundle
 */
export function register(appName: string, bundle: Translations) {
	registerAppTranslations(appName, bundle, getPlural)
}

/**
 * Unregister all translations of an app
 *
 * @param appName name of the app
 * @since 2.1.0
 */
export function unregister(appName: string) {
	return unregisterAppTranslations(appName)
}

/**
 * Get array index of translations for a plural form
 *
 *
 * @param {number} number the number of elements
 * @return {number} 0 for the singular form(, 1 for the first plural form, ...)
 */
export function getPlural(number: number) {
	let language = getLanguage()
	if (language === 'pt-BR') {
		// temporary set a locale for brazilian
		language = 'xbr'
	}

	if (language.length > 3) {
		language = language.substring(0, language.lastIndexOf('-'))
	}

	/*
	 * The plural rules are derived from code of the Zend Framework (2010-09-25),
	 * which is subject to the new BSD license (http://framework.zend.com/license/new-bsd).
	 * Copyright (c) 2005-2010 Zend Technologies USA Inc. (http://www.zend.com)
	 */
	switch (language) {
	case 'az':
	case 'bo':
	case 'dz':
	case 'id':
	case 'ja':
	case 'jv':
	case 'ka':
	case 'km':
	case 'kn':
	case 'ko':
	case 'ms':
	case 'th':
	case 'tr':
	case 'vi':
	case 'zh':
		return 0

	case 'af':
	case 'bn':
	case 'bg':
	case 'ca':
	case 'da':
	case 'de':
	case 'el':
	case 'en':
	case 'eo':
	case 'es':
	case 'et':
	case 'eu':
	case 'fa':
	case 'fi':
	case 'fo':
	case 'fur':
	case 'fy':
	case 'gl':
	case 'gu':
	case 'ha':
	case 'he':
	case 'hu':
	case 'is':
	case 'it':
	case 'ku':
	case 'lb':
	case 'ml':
	case 'mn':
	case 'mr':
	case 'nah':
	case 'nb':
	case 'ne':
	case 'nl':
	case 'nn':
	case 'no':
	case 'oc':
	case 'om':
	case 'or':
	case 'pa':
	case 'pap':
	case 'ps':
	case 'pt':
	case 'so':
	case 'sq':
	case 'sv':
	case 'sw':
	case 'ta':
	case 'te':
	case 'tk':
	case 'ur':
	case 'zu':
		return number === 1 ? 0 : 1

	case 'am':
	case 'bh':
	case 'fil':
	case 'fr':
	case 'gun':
	case 'hi':
	case 'hy':
	case 'ln':
	case 'mg':
	case 'nso':
	case 'xbr':
	case 'ti':
	case 'wa':
		return number === 0 || number === 1 ? 0 : 1

	case 'be':
	case 'bs':
	case 'hr':
	case 'ru':
	case 'sh':
	case 'sr':
	case 'uk':
		return number % 10 === 1 && number % 100 !== 11
			? 0
			: number % 10 >= 2
				  && number % 10 <= 4
				  && (number % 100 < 10 || number % 100 >= 20)
				? 1
				: 2

	case 'cs':
	case 'sk':
		return number === 1 ? 0 : number >= 2 && number <= 4 ? 1 : 2

	case 'ga':
		return number === 1 ? 0 : number === 2 ? 1 : 2

	case 'lt':
		return number % 10 === 1 && number % 100 !== 11
			? 0
			: number % 10 >= 2 && (number % 100 < 10 || number % 100 >= 20)
				? 1
				: 2

	case 'sl':
		return number % 100 === 1
			? 0
			: number % 100 === 2
				? 1
				: number % 100 === 3 || number % 100 === 4
					? 2
					: 3

	case 'mk':
		return number % 10 === 1 ? 0 : 1

	case 'mt':
		return number === 1
			? 0
			: number === 0 || (number % 100 > 1 && number % 100 < 11)
				? 1
				: number % 100 > 10 && number % 100 < 20
					? 2
					: 3

	case 'lv':
		return number === 0
			? 0
			: number % 10 === 1 && number % 100 !== 11
				? 1
				: 2

	case 'pl':
		return number === 1
			? 0
			: number % 10 >= 2
				  && number % 10 <= 4
				  && (number % 100 < 12 || number % 100 > 14)
				? 1
				: 2

	case 'cy':
		return number === 1
			? 0
			: number === 2
				? 1
				: number === 8 || number === 11
					? 2
					: 3

	case 'ro':
		return number === 1
			? 0
			: number === 0 || (number % 100 > 0 && number % 100 < 20)
				? 1
				: 2

	case 'ar':
		return number === 0
			? 0
			: number === 1
				? 1
				: number === 2
					? 2
					: number % 100 >= 3 && number % 100 <= 10
						? 3
						: number % 100 >= 11 && number % 100 <= 99
							? 4
							: 5

	default:
		return 0
	}
}

// Export short-hand

export {
	translate as t,
	translatePlural as n,
}
