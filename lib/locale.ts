/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

declare global {
	// eslint-disable-next-line camelcase, no-var
	var _nc_l10n_locale: string | undefined
	// eslint-disable-next-line camelcase, no-var
	var _nc_l10n_language: string | undefined
}

/**
 * Returns the user's locale
 * @example 'de_DE'
 */
export function getLocale(): string {
	// Web-browser runtime
	if (typeof document !== 'undefined' && document.documentElement.dataset.locale) {
		return document.documentElement.dataset.locale
	}

	// Node.js runtime
	if ('_nc_l10n_locale' in globalThis && globalThis._nc_l10n_locale) {
		return globalThis._nc_l10n_locale
	}

	// Fallback to English
	return 'en'
}

/**
 * Set the user's locale
 * @param locale - The locale to set
 */
export function setLocale(locale: string): void {
	if (typeof document !== 'undefined') {
		document.documentElement.lang = locale
	}
	globalThis._nc_l10n_locale = locale
}

/**
 * Returns user's locale in canonical form
 * E.g. `en-US` instead of `en_US`
 */
export function getCanonicalLocale(): string {
	return getLocale().replace(/_/g, '-')
}

/**
 * Returns the user's language
 * @example 'de-DE'
 */
export function getLanguage(): string {
	// Web-browser runtime
	if (typeof document !== 'undefined' && document.documentElement.lang) {
		return document.documentElement.lang
	}

	// Node.js runtime
	if ('_nc_l10n_language' in globalThis && globalThis._nc_l10n_language) {
		return globalThis._nc_l10n_language
	}

	// Fallback to English
	return 'en'
}

/**
 * Set the user's language
 * @param language - The language to set
 */
export function setLanguage(language: string): void {
	if (typeof document !== 'undefined') {
		document.documentElement.lang = language
	}
	globalThis._nc_l10n_language = language
}

/**
 * Check whether the current, or a given, language is read right-to-left
 *
 * @param language Language code to check, defaults to current language
 */
export function isRTL(language?: string): boolean {
	const languageCode = language || getLanguage()

	// Source: https://meta.wikimedia.org/wiki/Template:List_of_language_names_ordered_by_code
	const rtlLanguages = [
		/* eslint-disable no-multi-spaces */
		'ae',  // Avestan
		'ar',  // 'العربية', Arabic
		'arc', // Aramaic
		'arz', // 'مصرى', Egyptian
		'bcc', // 'بلوچی مکرانی', Southern Balochi
		'bqi', // 'بختياري', Bakthiari
		'ckb', // 'Soranî / کوردی', Sorani
		'dv',  // Dhivehi
		'fa',  // 'فارسی', Persian
		'glk', // 'گیلکی', Gilaki
		'ha',  // 'هَوُسَ', Hausa
		'he',  // 'עברית', Hebrew
		'khw', // 'کھوار', Khowar
		'ks',  // 'कॉशुर / کٲشُر', Kashmiri
		'ku',  // 'Kurdî / كوردی', Kurdish
		'mzn', // 'مازِرونی', Mazanderani
		'nqo', // 'ߒߞߏ', N’Ko
		'pnb', // 'پنجابی', Western Punjabi
		'ps',  // 'پښتو', Pashto,
		'sd',  // 'سنڌي', Sindhi
		'ug',  // 'Uyghurche / ئۇيغۇرچە', Uyghur
		'ur',  // 'اردو', Urdu
		'uzs', // 'اوزبیکی', Uzbek Afghan
		'yi',  // 'ייִדיש', Yiddish
		/* eslint-enable no-multi-spaces */
	]

	// special case for Uzbek Afghan
	if ((language || getCanonicalLocale()).startsWith('uz-AF')) {
		return true
	}

	return rtlLanguages.includes(languageCode)
}
