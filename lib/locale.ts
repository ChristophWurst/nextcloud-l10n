/*!
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const environmentLocale = Intl.DateTimeFormat().resolvedOptions().locale

/**
 * Returns the user's locale
 */
export function getLocale(): string {
	return document.documentElement.dataset.locale || environmentLocale.replace(/-/g, '_')
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
 */
export function getLanguage(): string {
	return document.documentElement.lang || environmentLocale
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
		'ur',    // 'اردو', Urdu
		'ur-PK', // 'اردو', Urdu (nextcloud BCP47 variant)
		'uz-AF', // 'اوزبیکی', Uzbek Afghan
		'yi',    // 'ייִדיש', Yiddish
		/* eslint-enable no-multi-spaces */
	]

	return rtlLanguages.includes(languageCode)
}
