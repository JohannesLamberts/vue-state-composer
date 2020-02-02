import { inject, InjectionKey, provide, reactive } from '@vue/composition-api'
import { UnwrapRef } from '@vue/composition-api/dist/reactivity/ref'

export interface StoreDefinition<TApi> {
  name: string
  setup: (args: { id?: string; createState<S>(s: S): UnwrapRef<S> }) => TApi
}

export function createStore<TApi>(storeDefinition: StoreDefinition<TApi>) {
  const symbol = Symbol(`${storeDefinition.name}Store`) as InjectionKey<TApi>
  return {
    useProvider(id?: string): TApi {
      const store = initializeStore(storeDefinition, id)
      provide(symbol, store)
      return store
    },
    useConsumer(): TApi {
      const store = inject(symbol)
      if (!store) {
        throw new Error(`'${symbol.description}' not found`)
      }
      return store
    },
    use(id?: string): TApi {
      return initializeStore(storeDefinition, id)
    },
  }
}

const initializingStack: string[] = []

export interface OnCreateStateHook {
  <T>(identifier: string, state: T): T | void
}
export interface OnInitializedHook {
  <T>(identifier: string, state: any, api: T): Partial<T> | void | undefined
}

let createStateHooks: OnCreateStateHook[] = []
let onInitializedHooks: OnInitializedHook[] = []

export function installOnCreateState(cb: OnCreateStateHook) {
  createStateHooks.push(cb)
  return () => {
    createStateHooks = createStateHooks.filter(el => el !== cb)
  }
}
export function installOnInitialized<T>(cb: OnInitializedHook) {
  onInitializedHooks.push(cb)
  return () => {
    onInitializedHooks = onInitializedHooks.filter(el => el !== cb)
  }
}

function initializeStore<TApi>(
  store: StoreDefinition<TApi>,
  id?: string,
): TApi {
  let reactiveState: any

  const ident = [store.name, id].filter(Boolean).join('/')
  initializingStack.push(ident)
  const identifier = initializingStack.join('/')

  function createState<S>(initialData: S): UnwrapRef<S> {
    let data = initialData
    createStateHooks.forEach(hook => {
      const replace = hook(identifier, data)
      data = replace ? replace : data
    })
    reactiveState = reactive(data)
    return reactiveState
  }

  // TODO: track nested initializeStore inits and set identifier paths
  // TODO: wrap exported methods for simple history
  let api = store.setup({ createState, id })

  onInitializedHooks.forEach(hook => {
    api = Object.assign({}, api, hook(identifier, reactiveState, api))
  })

  initializingStack.pop()

  return api
}
