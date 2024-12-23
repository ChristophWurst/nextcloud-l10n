/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { loadTranslations, register, translate, unregister } from '../lib/translation'

const setLanguage = (language: string) => document.documentElement.setAttribute('lang', language)

const server = setupServer(
	// Response with valid translations
	http.get('/myapp/l10n/de.json', () => HttpResponse.json({
		translations: {
			'Hello world!': 'Hallo Welt!',
		},
	})),
	// Response with empty body
	http.get('/empty/l10n/de.json', () => HttpResponse.json()),
	// Response contains JSON but no translations
	http.get('/missing-bundle/l10n/de.json', () => HttpResponse.json({})),
	// Response contains JSON but the translations are invalid
	http.get('/invalid/l10n/de.json', () => HttpResponse.json({
		translations: 'invalid',
	})),
	// Response with 404
	http.get('/404/l10n/de.json', () => new HttpResponse(null, { status: 404, statusText: 'Not Found' })),
	// Response with 500
	http.get('/500/l10n/de.json', () => new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' })),
	// Network error
	http.get('/networkissue/l10n/de.json', () => HttpResponse.error()),
)

describe('loadTranslations', () => {
	beforeAll(() => {
		// Mock some server state
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window as any)._oc_webroot = '';
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window as any)._oc_appswebroots = {
			404: '/404',
			500: '/500',
			empty: '/empty',
			invalid: '/invalid',
			'missing-bundle': '/missing-bundle',
			myapp: '/myapp',
			networkissue: '/networkissue',
		}
	})

	beforeEach(() => {
		setLanguage('de')
		server.listen()
	})

	afterEach(() => {
		vi.clearAllMocks()
		server.close()
	})

	afterAll(() => {
	})

	it('calls callback if app already exists', async () => {
		register('myapp', {
			Bye: 'Tschüss',
		})

		vi.stubGlobal('fetch', vi.fn())
		const callback = vi.fn()
		try {
			await loadTranslations('myapp', callback)
			// Callback called
			expect(callback).toBeCalledTimes(1)
			// No requests done
			expect(fetch).not.toHaveBeenCalled()
			// Old translations work
			expect(translate('myapp', 'Bye')).toBe('Tschüss')
			// does not override translations
			expect(translate('myapp', 'Hello world!')).toBe('Hello world!')
		} finally {
			unregister('myapp')
		}
	})

	it('calls callback if locale is English', async () => {
		setLanguage('en')
		const callback = vi.fn()
		vi.stubGlobal('fetch', vi.fn())

		await loadTranslations('myapp', callback)
		// Callback called
		expect(callback).toBeCalledTimes(1)
		// No requests done
		expect(fetch).not.toHaveBeenCalled()
	})

	it('registers new translations', async () => {
		const callback = vi.fn()

		await loadTranslations('myapp', callback)
		// Callback called
		expect(callback).toBeCalledTimes(1)
		// New translations work
		expect(translate('myapp', 'Hello world!')).toBe('Hallo Welt!')
	})

	it('does reject on network error', async () => {
		await expect(loadTranslations('networkissue', vi.fn())).rejects.toThrow('Failed to fetch')
	})

	it('does reject on server error', async () => {
		await expect(loadTranslations('500', vi.fn())).rejects.toThrow('Internal Server Error')
	})

	it('does reject on unavailable bundle', async () => {
		await expect(loadTranslations('404', vi.fn())).rejects.toThrow('Not Found')
	})

	it('does reject on invalid bundle', async () => {
		await expect(loadTranslations('invalid', vi.fn())).rejects.toThrow('Invalid content of translation bundle')
	})

	it('does reject on missing bundle', async () => {
		await expect(loadTranslations('missing-bundle', vi.fn())).rejects.toThrow('Invalid content of translation bundle')
	})

	it('does reject on empty response', async () => {
		await expect(loadTranslations('empty', vi.fn())).rejects.toThrow('Invalid content of translation bundle')
	})
})
