# vue-state-composer

_Very lightweight, non-centralized, typesafe, hydratable state management based on the [Composition Api](https://vue-composition-api-rfc.netlify.com/)._

- Inspired by [pinia](https://github.com/posva/pinia/tree/next) for DevTools support and for using the Composition API in the first place
- Building on [Vue States](https://github.com/sumcumo/vue-states) for non-centralized, hydratable state management

⚠️ This project is experimental ⚠️

## Defining a Store

```typescript
// @/stores/counter.ts
import { computed, toRefs } from '@vue/composition-api'
import { createStore } from 'vue-state-composer'

const counterStore = createStore({
  name: 'Counter',
  setup({ createState }) {
    // createState works the same as `reactive`,
    // but is needed vor DevTools support and hydration
    const state = createState({
      count: 0,
    })

    // use plain functions for "mutations" and "actions"
    const modify = (mod: number) => (state.count += mod)
    const increment = () => modify(1)
    const decrement = () => modify(-1)

    // use computed for "getters"
    const absolute = computed(() => Math.abs(state.count))

    // the setup function returns the stores API
    // it works just like the setup function of a component
    return {
      ...toRefs(state),
      absolute,
      modify,
      increment,
      decrement,
    }
  },
})
```

## Using a Store

There are three ways to use a store:

- `counterStore.use(id?: string)` to get a new (local) instance.
- `counterStore.useProvider(id?: string)` to get a new instance and automatically [provide](https://vue-composition-api-rfc.netlify.com/api.html#provide-inject) to child components
- `counterStore.useConsumer()` to get an instance previously [provided](https://vue-composition-api-rfc.netlify.com/api.html#provide-inject) by a parent component

The id should be used as a unique identifier, if multiple instances of the same store may be used across the app.
This allows to correctly hydrate after SSR and for better DevTools support.

### Local

```vue
// @/components/counter.vue
<template>
  <div>
    {{ count }}
    <button @click="increment">Increment</button>
  </div>
</template>

<script>
import counterStore from '@/stores/counter'

export default {
  setup() {
    const { count, increment } = counterStore.use()
    return {
      count,
      increment,
    }
  },
}
</script>
```

### Provider

```typescript
// @/app.vue
import basketStore from '@/stores/counter'

export default {
  setup() {
    // using the returned API is optional
    basketStore.useProvider()
  },
}
```

### Consumer

```vue
// @/components/checkout.vue
<template>
  <button @click="checkout" />
</template>

<script>
import basketStore from '@/stores/counter'

export default {
  setup() {
    const { checkout } = basketStore.useConsumer()
    return {
      checkout,
    }
  },
}
</script>
```

## DevTools

```typescript
// main.ts
import { installDevtools } from 'vue-state-composer'

new Vue({
  setup() {
    // devTools will be removed from production build
    // using only 0.5kb gzipped for SPA at the time of writing
    if (process.env.NODE_ENV !== 'production') {
      installDevtools()
    }
  },
})
```

## Universal Apps

```typescript
// main.ts
import { provideComposer, createComposer } from 'vue-state-composer'

const composer = createComposer({
  // inject hydration data
  hydration: typeof window === 'undefined' ? {} : window.__COMPOSER_STATE__,
})

new Vue({
  setup() {
    // install composer in app
    provideComposer(composer)
  },
})
```

```typescript
// entry-server.ts
router.onReady(() => {
  context.rendered = () => {
    // pass hydration data to SSR context
    context.composerState = composer.exportHydrationData()
  }
})
```

```ejs
// index.html
<body>
  // inject hydration data to window
  {{{ renderState({ contextKey: 'composerState', windowKey: '__COMPOSER_STATE__' }) }}}
</body>
```


## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2020-present, Johannes Lamberts
