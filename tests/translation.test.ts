import type { NextcloudWindowWithRegistry } from '../lib/registry'
import {
	getPlural,
	register,
	translate,
	translatePlural,
	unregister,
} from '../lib/translation'

declare const window: NextcloudWindowWithRegistry

const setLocale = (locale: string) => document.documentElement.setAttribute('data-locale', locale)
const setLanguage = (lang: string) => document.documentElement.setAttribute('lang', lang)

describe('translate', () => {
	const mockWindowDE = () => {
		window._oc_l10n_registry_translations = {
			core: {
				'Hello world!': 'Hallo Welt!',
				'Hello {name}': 'Hallo {name}',
				'_download %n file_::_download %n files_': [
					'Lade %n Datei herunter',
					'Lade %n Dateien herunter',
				],
				'_download %n file from {url}_::_download %n files from {url}_': [
					'Lade %n Datei von {url} herunter',
					'Lade %n Dateien von {url} herunter',
				],
			},
		}
		window._oc_l10n_registry_plural_functions = {
			core: (t) => t === 1 ? 0 : 1,
		}
		setLocale('de')
	}

	beforeAll(mockWindowDE)

	it('without placeholder HTML escaping', () => {
		const text = 'Hello {name}'
		const translation = translate('core', text, { name: '<del>Name</del>' }, undefined, { escape: false })
		expect(translation).toBe('Hallo <del>Name</del>')
	})

	it('with placeholder HTML escaping', () => {
		const text = 'Hello {name}'
		const translation = translate('core', text, { name: '<del>Name</del>' })
		expect(translation).toBe('Hallo &lt;del&gt;Name&lt;/del&gt;')
	})

	it('without placeholder XSS sanitizing', () => {
		const text = 'Hello {name}'
		const translation = translate('core', text, { name: '<img src=x onerror=alert(1)//>' }, undefined, { sanitize: false, escape: false })
		expect(translation).toBe('Hallo <img src=x onerror=alert(1)//>')
	})

	it('with placeholder XSS sanitizing', () => {
		const text = 'Hello {name}'
		const translation = translate('core', text, { name: '<img src=x onerror=alert(1)//>' }, undefined, { escape: false })
		expect(translation).toBe('Hallo <img src="x">')
	})

	it('singular', () => {
		const text = 'Hello world!'
		const translation = translate('core', text)
		expect(translation).toBe('Hallo Welt!')
	})

	it('singular with variable', () => {
		const text = 'Hello {name}'
		const translation = translate('core', text, { name: 'J. Doe' })
		expect(translation).toBe('Hallo J. Doe')
	})

	it('singular with missing variable', () => {
		const text = 'Hello {name}'
		const translation = translate('core', text, {})
		expect(translation).toBe('Hallo {name}')
	})

	it('singular with invalid variable', () => {
		const text = 'Hello {name}'
		// We need to disable ts here as users might use it from JS were no type checking is available
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const translation = translate('core', text, { name: true }) // invalid as only `string` or `number` are allowed
		expect(translation).toBe('Hallo {name}')
	})

	it('singular with missing translation', () => {
		const text = 'Good bye!'
		const translation = translate('core', text)
		expect(translation).toBe('Good bye!')
	})

	it('singular with missing application', () => {
		const text = 'Good bye!'
		const translation = translate('unavailable', text)
		expect(translation).toBe('Good bye!')
	})

	it('singular with plural translation', () => {
		const text = '_download %n file_::_download %n files_'
		const translation = translate('core', text)
		expect(translation).toBe('Lade %n Datei herunter')
	})

	it('plural', () => {
		const text = ['download %n file', 'download %n files'] as const

		expect(translatePlural('core', ...text, 1)).toBe('Lade 1 Datei herunter')

		expect(translatePlural('core', ...text, 2)).toBe('Lade 2 Dateien herunter')
	})

	it('plural with missing translation', () => {
		const text = ['%n translation does not exist', '%n translations do not exist'] as const

		expect(translatePlural('core', ...text, 1)).toBe('1 translation does not exist')
		expect(translatePlural('core', ...text, 2)).toBe('2 translations do not exist')
	})

	it('plural with variable', () => {
		const text = ['download %n file from {url}', 'download %n files from {url}'] as const

		expect(translatePlural('core', ...text, 1, { url: 'nextcloud.com' })).toBe('Lade 1 Datei von nextcloud.com herunter')
		expect(translatePlural('core', ...text, 2, { url: 'nextcloud.com' })).toBe('Lade 2 Dateien von nextcloud.com herunter')
	})

	it('plural with missing variable', () => {
		const text = ['download %n file from {url}', 'download %n files from {url}'] as const

		expect(translatePlural('core', ...text, 1)).toBe('Lade 1 Datei von {url} herunter')
		expect(translatePlural('core', ...text, 2)).toBe('Lade 2 Dateien von {url} herunter')
	})
})

describe('register', () => {
	beforeEach(() => {
		setLocale('de_DE')
		window._oc_l10n_registry_translations = undefined
		window._oc_l10n_registry_plural_functions = undefined
	})

	it('with blank registry', () => {
		register('app', {
			Application: 'Anwendung',
			'_%n guest_::_%n guests_': ['%n Gast', '%n Gäste'],
		})
		expect(translate('app', 'Application')).toBe('Anwendung')
		expect(translatePlural('app', '%n guest', '%n guests', 1)).toBe('1 Gast')
		expect(translatePlural('app', '%n guest', '%n guests', 2)).toBe('2 Gäste')
	})

	it('extend registered translations', () => {
		window._oc_l10n_registry_translations = {
			app: {
				Application: 'Anwendung',
			},
		}
		window._oc_l10n_registry_plural_functions = {
			app: (t) => t === 1 ? 0 : 1,
		}
		register('app', {
			Translation: 'Übersetzung',
		})
		expect(translate('app', 'Application')).toBe('Anwendung')
		expect(translate('app', 'Translation')).toBe('Übersetzung')
	})

	it('extend with another new app', () => {
		window._oc_l10n_registry_translations = {
			core: {
				'Hello world!': 'Hallo Welt!',
			},
		}
		window._oc_l10n_registry_plural_functions = {
			core: (t) => t === 1 ? 0 : 1,
		}
		register('app', {
			Application: 'Anwendung',
		})
		expect(translate('core', 'Hello world!')).toBe('Hallo Welt!')
		expect(translate('app', 'Application')).toBe('Anwendung')
	})

	it('unregister', () => {
		window._oc_l10n_registry_translations = {}
		window._oc_l10n_registry_plural_functions = {}
		register('app', {
			Application: 'Anwendung',
		})
		unregister('app')
		expect(translate('app', 'Application')).toBe('Application')
	})
})

describe('getPlural', () => {
	it('can handle brazillian Portuguese', () => {
		// special because brazillian Portuguese use sigular for 0 and 1 wheras Portuguese use plural for 0
		setLanguage('pt-BR')
		expect(getPlural(0)).toBe(0)
		expect(getPlural(2)).toBe(1) // ensure no fallback to `default`
	})

	it('can handle language designators with regions', () => {
		setLanguage('de-CH')
		// default for unknown is 0 for all input so we can assume it works if we get 1
		expect(getPlural(0)).toBe(1)
	})

	it('has a fallback', () => {
		setLanguage('xxx')
		expect(getPlural(0)).toBe<number>(0)
		expect(getPlural(1)).toBe<number>(0)
	})
})
