import {
  inject,
  InjectionKey,
  onDeactivated,
  provide,
  ref,
} from '@vue/composition-api'
import { installOnCreateState, installOnInitialized } from './store'

export type HydrationData = Record<string, any>

export interface ComposerOptions {
  hydration?: HydrationData
}

export interface ComposerStore {
  identifier: string
  state: any
}

let installed = false

function installStateComposer() {
  installOnCreateState((identifier, data) => {
    const composer = injectComposer()
    return {
      ...data,
      ...composer.findHydrationData(identifier),
    }
  })

  installOnInitialized((identifier, reactiveState) => {
    const composer = injectComposer()
    const unregister = composer.registerStore({
      identifier,
      state: reactiveState,
    })
    onDeactivated(unregister)
  })
}

export function createComposer({ hydration = {} }: ComposerOptions = {}) {
  if (!installed) {
    installStateComposer()
    installed = true
  }

  const activeStores = ref<ComposerStore[]>([])

  function findHydrationData(identifier: string) {
    return hydration[identifier]
  }

  function unregisterStore(store: ComposerStore) {
    activeStores.value = activeStores.value.filter(val => val !== store)
  }

  function registerStore(store: ComposerStore) {
    activeStores.value.push(store)
    return () => unregisterStore(store)
  }

  function exportHydrationData() {
    const data: Record<string, any> = {}
    activeStores.value.forEach(store => {
      data[store.identifier] = store.state
    })
    return data
  }

  return {
    exportHydrationData,
    registerStore,
    findHydrationData,
  }
}

const ComposerSymbol = Symbol('StateComposer') as InjectionKey<Composer>

export function provideComposer(composer: Composer = createComposer()) {
  provide(ComposerSymbol, composer)
}

function injectComposer() {
  const composer = inject(ComposerSymbol)
  if (!composer) {
    throw new Error('Composer not provided')
  }
  return composer
}

export type Composer = ReturnType<typeof createComposer>
