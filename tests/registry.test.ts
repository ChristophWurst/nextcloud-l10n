/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, test } from 'vitest'
import type { NextcloudWindowWithRegistry } from '../lib/registry'

import {
	getAppTranslations,
	hasAppTranslations,
	registerAppTranslations,
	unregisterAppTranslations,
} from '../lib/registry'

declare const globalThis: NextcloudWindowWithRegistry

const clearGlobalThis = () => {
	delete globalThis._oc_l10n_registry_plural_functions
	delete globalThis._oc_l10n_registry_translations
}

const pluralFunction = (number: number) => (number > 1 ? 1 : 0)

const mockGlobalThis = () => {
	globalThis._oc_l10n_registry_plural_functions = {
		core: pluralFunction,
	}
	globalThis._oc_l10n_registry_translations = {
		core: {
			foo: 'foo',
			'_%n bar_::_%n bars_': [
				'%n bar',
				'%n bars',
			],
		},
	}
}

describe('registry', () => {
	beforeAll(clearGlobalThis)
	afterEach(clearGlobalThis)

	test('hasAppTranslations', () => {
		expect(hasAppTranslations('doesnotexist')).toBe(false)

		mockGlobalThis()

		expect(hasAppTranslations('core')).toBe(true)
		expect(hasAppTranslations('doesnotexist')).toBe(false)

		// not fully initialized registry
		delete globalThis._oc_l10n_registry_plural_functions
		expect(hasAppTranslations('core')).toBe(false)
	})

	describe('getAppTranslations', () => {
		beforeEach(() => {
			clearGlobalThis()
		})

		it('without translations', () => {
			const bundle = getAppTranslations('doesnotexist')
			expect(bundle.translations).toMatchObject({})
			expect(typeof bundle.pluralFunction === 'function').toBe(true)
			expect(typeof bundle.pluralFunction(0)).toBe('number')
		})

		it('with translations', () => {
			mockGlobalThis()

			let bundle = getAppTranslations('core')
			expect(Object.keys(bundle.translations).length > 0).toBe(true)
			expect(bundle.pluralFunction).toBe(pluralFunction)

			bundle = getAppTranslations('doesnotexist')
			expect(bundle.translations).toMatchObject({})
			expect(typeof bundle.pluralFunction === 'function').toBe(true)
		})
	})

	describe('unregisterAppTranslations', () => {
		beforeEach(clearGlobalThis)

		it('works without registry', () => {
			expect(() => unregisterAppTranslations('doesnotexist')).not.toThrowError()
		})

		it('works with not registered app', () => {
			mockGlobalThis()

			expect(() => unregisterAppTranslations('doesnotexist')).not.toThrowError()
			expect(globalThis._oc_l10n_registry_plural_functions?.core).toBe(pluralFunction)
			expect(Object.keys(globalThis._oc_l10n_registry_translations?.core || {}).length > 0).toBe(true)
		})

		it('works with registered app', () => {
			mockGlobalThis()

			expect(() => unregisterAppTranslations('core')).not.toThrowError()
			expect(globalThis._oc_l10n_registry_plural_functions?.core).toBe(undefined)
			expect(globalThis._oc_l10n_registry_translations?.core).toBe(undefined)
		})
	})

	describe('registerAppTranslations', () => {
		beforeEach(clearGlobalThis)

		it('works without registry', () => {
			const translations = {
				foo: 'foo',
			}
			expect(() => registerAppTranslations('myapp', translations, pluralFunction)).not.toThrowError()
			expect(globalThis._oc_l10n_registry_translations?.myapp).toMatchObject(translations)
			expect(globalThis._oc_l10n_registry_plural_functions?.myapp).toBe(pluralFunction)
		})

		it('works with new app', () => {
			mockGlobalThis()

			const translations = {
				foo: 'foo',
			}
			expect(() => registerAppTranslations('myapp', translations, pluralFunction)).not.toThrowError()
			expect(globalThis._oc_l10n_registry_translations?.myapp).toMatchObject(translations)
			expect(globalThis._oc_l10n_registry_plural_functions?.myapp).toBe(pluralFunction)
			// Unchanged other apps
			expect(Object.keys(globalThis._oc_l10n_registry_translations?.core || {}).length > 0).toBe(true)
			expect(globalThis._oc_l10n_registry_plural_functions?.core).toBe(pluralFunction)
		})

		it('works with already registered app', () => {
			const newTranslations = {
				newvalue: 'newvalue',
			}
			mockGlobalThis()

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const numBefore = Object.keys(globalThis._oc_l10n_registry_translations!.core).length

			expect(() => registerAppTranslations('core', newTranslations, pluralFunction)).not.toThrowError()
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			expect(Object.keys(globalThis._oc_l10n_registry_translations!.core).length).toBe(numBefore + 1)
			expect(globalThis._oc_l10n_registry_plural_functions?.core).toBe(pluralFunction)
		})
	})
})
