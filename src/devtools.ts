import { installOnInitialized, OnInitializedHook } from './store'

interface DevtoolHook {
  on(event: string, callback: (targetState: Record<string, any>) => void): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit(event: string, ...payload: any[]): void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const target: any =
  typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined'
    ? global
    : { __VUE_DEVTOOLS_GLOBAL_HOOK__: undefined }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const devtoolHook: DevtoolHook | undefined = target.__VUE_DEVTOOLS_GLOBAL_HOOK__

interface RootStore {
  _devtoolHook: DevtoolHook
  _vm: { $options: { computed: {} } }
  _mutations: {}
  // we neeed to store modules names
  _modulesNamespaceMap: Record<string, boolean>
  _modules: {
    // we only need this specific method to let devtools retrieve the module name
    get(name: string): boolean
  }
  state: Record<string, any>

  replaceState: Function
  registerModule: Function
  unregisterModule: Function
}

let rootStore: RootStore

function createRootStore(): RootStore {
  if (!devtoolHook) {
    throw new Error('No devtoolHook supplied')
  }

  return {
    _devtoolHook: devtoolHook,
    _vm: { $options: { computed: {} } },
    _mutations: {},
    // we neeed to store modules names
    _modulesNamespaceMap: {},
    _modules: {
      // we only need this specific method to let devtools retrieve the module name
      get(name: string) {
        return name in rootStore._modulesNamespaceMap
      },
    },
    state: {},
    // these are used by the devtools
    replaceState: () => {
      return
    },
    registerModule: () => {
      return
    },
    unregisterModule: () => {
      return
    },
  }
}

interface Store {
  identifier: string
  state: any
  subscribe: (
    cb: (mutation: { name: string; payload: any[] }) => void,
  ) => () => void
}

const onInitialized: OnInitializedHook = (identifier, state, api) => {
  if (!devtoolHook) return

  const wrappedApi: any = { ...api }

  Object.entries(api).forEach(([key, value]) => {
    if (typeof value === 'function') {
      wrappedApi[key] = function interceptedApiCall(...args: any[]) {
        rootStore.state[identifier] = state
        devtoolHook.emit(
          'vuex:mutation',
          {
            payload: args,
            type: `[${identifier}]: ${key}`,
          },
          rootStore.state,
        )
        value.apply(this, args)
      }
    }
  })

  rootStore.state[identifier] = state

  // tell the devtools we added a module
  rootStore.registerModule(identifier, { state })

  Object.defineProperty(rootStore.state, identifier, {
    get: () => state,
    set: newState => {
      Object.assign(state, newState)
    },
  })

  // Vue.set(rootStore.state, store.name, store.state)
  // the trailing slash is removed by the devtools
  rootStore._modulesNamespaceMap[identifier + '/'] = true

  return wrappedApi
}

export function installDevtools() {
  if (!devtoolHook) return

  if (!rootStore) {
    rootStore = createRootStore()
    devtoolHook.emit('vuex:init', rootStore)
  }

  installOnInitialized(onInitialized)
}
