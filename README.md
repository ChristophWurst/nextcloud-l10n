<!--
  - SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: GPL-3.0-or-later
-->
# @nextcloud/l10n

[![REUSE status](https://api.reuse.software/badge/github.com/nextcloud-libraries/nextcloud-l10n)](https://api.reuse.software/info/github.com/nextcloud-libraries/nextcloud-l10n)
[![Build Status](https://img.shields.io/github/actions/workflow/status/nextcloud-libraries/nextcloud-l10n/node.yml?branch=master)](https://github.com/nextcloud-libraries/nextcloud-l10n/actions/workflows/node.yml)
[![npm](https://img.shields.io/npm/v/@nextcloud/l10n.svg)](https://www.npmjs.com/package/@nextcloud/l10n)
[![Documentation](https://img.shields.io/badge/Documentation-online-brightgreen)](https://nextcloud.github.io/nextcloud-l10n/)

Nextcloud L10n helpers for apps and libraries.

## Installation

```
npm i -S @nextcloud/l10n
```

## Usage

### With Nextcloud based translations

Apps normally use the Nextcloud provided translation mechanism which allows to translate backend (PHP) strings together with the frontend.
This can either be done using the Nextcloud Transifex automatization or translations can be done manually.
See the [localization docs](https://docs.nextcloud.com/server/stable/developer_manual/basics/front-end/l10n.html) for how to setup.

When using the Nextcloud translation system (manually or with automated Transifex) Nextcloud will automatically
register the translations on the frontend.
In this case all you have to do is to import the translation functions from this package like shown below:

```js
import { t, n } from '@nextcloud/l10n'
// Or
import { translate as t, translatePlural as n } from '@nextcloud/l10n'
```

> [!NOTE]
> In order to not break the l10n string extraction scripts, make sure to use the aliases `t` and `n`.

#### Translate singular string

```js
t('myapp', 'Hello!')
```

#### Translate singular string with placeholders

```js
t('myapp', 'Hello {name}!', { name: 'Jane' })
```

By default placeholders are sanitized and escaped to prevent XSS.
But you can disable this behavior if you trust the user input:

```js
t(
  'myapp',
  'See also the {linkStart}documentation{linkEnd}.',
  {
    linkStart: '<a href="http://example.com">'
    linkEnd: '</a>',
  },
  undefined, // this would be a number replacement
  { escape: false },
)
```

#### Translate plural string

```js
n('myapp', '%n cloud', '%n clouds', 100)
```

Of course also placeholders are possible:

```js
n('myapp', '{name} owns %n file', '{name} owns %n files', 100, { name: 'Jane' })
```

### Independent translation

It is also possible to use this package for Nextcloud independent translations.
This is mostly useful for libraries that provide translated strings.

Independent means you can use this without Nextcloud registered translations buy just providing your `.po` files.
If you decide to use this way you have to extract the translation strings manually, for example using the [gettext-extractor](https://github.com/lukasgeiter/gettext-extractor).

```js
import { getGettextBuilder } from '@nextcloud/l10n/gettext'

const po = ... // Use https://github.com/smhg/gettext-parser to read and convert your .po(t) file

// When using this for a Nextcloud app you can auto-detect the language
const gt = getGettextBuilder()
    .detectLocale()
    .addTranslation('sv', po)
    .build()

// But it is also possible to force a language
const gt = getGettextBuilder()
    .setLocale('sv')
    .addTranslation('sv', po)
    .build()
```

To make things easier you could also create aliases for this in a module and reuse it in your code:

```ts
// When using JavaScript
export const t = (...args) => gt.gettext(...args)
export const n = (...args) => gt.ngettext(...args)

// When using Typescript
export const t = (...args: Parameters<typeof gt.gettext>) => gt.gettext(...args)
export const n = (...args: Parameters<typeof gt.ngettext>) => gt.ngettext(...args)
```

#### Translate single string

```js
gt.gettext('my source string')

// or if you are using the aliases mentioned above:
t('my source string')
```

#### Placeholders

```js
gt.gettext('this is a {placeholder}. and this is {key2}', {
    placeholder: 'test',
    key2: 'also a test',
})
```

#### Translate plurals

```js
gt.ngettext('%n Mississippi', '%n Mississippi', 3)

// or if you are using the aliases mentioned above:
n('%n Mississippi', '%n Mississippi', 3)
```
