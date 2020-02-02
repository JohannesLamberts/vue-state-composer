import { createLocalVue, mount } from '@vue/test-utils'
import { computed, createComponent, toRefs } from '@vue/composition-api'
import CompositionApi from '@vue/composition-api'
import { createStore } from '../src'
import { installOnCreateState, installOnInitialized } from '../src/store'

const localVue = createLocalVue()
localVue.use(CompositionApi)

const INITIAL_COUNT = 5

const counterStore = createStore({
  name: 'Test',
  setup({ createState }) {
    const state = createState({ count: INITIAL_COUNT })
    const doubledCount = computed(() => state.count * 2)
    function increment() {
      state.count += 1
    }
    return {
      ...toRefs(state),
      doubledCount,
      increment,
    }
  },
})

it('should be reactive', () => {
  const store = counterStore.use()
  store.increment()
  expect(store.count.value).toBe(6)
  expect(store.doubledCount.value).toBe(12)
})

it('should not share state', () => {
  const store1 = counterStore.use()
  const count1Saved = store1.count.value
  const store2 = counterStore.use()

  store2.increment()
  expect(store1.count.value).toBe(count1Saved)
})

const providingComponent = (childComponent: any) =>
  createComponent({
    setup() {
      const { increment } = counterStore.useProvider()
      return { increment }
    },
    render(h: any) {
      return h(childComponent)
    },
  })

const injectingComponent = createComponent({
  setup() {
    const { count } = counterStore.useConsumer()
    return {
      count,
    }
  },
  render(h: any) {
    return h('div')
  },
})

it('should provide and inject', () => {
  const vueWrapper: any = mount(providingComponent(injectingComponent) as any, {
    localVue,
  })
  expect(vueWrapper.find(injectingComponent).vm.count).toBe(INITIAL_COUNT)
  vueWrapper.vm.increment()
  expect(vueWrapper.find(injectingComponent).vm.count).toBe(6)
})

it('should throw if store is not found for injection', () => {
  expect(() =>
    mount(injectingComponent as any, {
      localVue,
    }),
  ).toThrow("'TestStore' not found")
})

describe('with OnCreateState hooks', () => {
  const onCreate = jest.fn()
  let uninstall: Function

  beforeEach(() => {
    uninstall = installOnCreateState(onCreate)
  })

  afterEach(() => {
    uninstall()
  })

  it('should invoke with state and identifier', () => {
    counterStore.use()
    expect(onCreate).toHaveBeenCalledWith('Test', { count: INITIAL_COUNT })
  })

  it('should keep state if none is to be replaced', () => {
    onCreate.mockImplementation(() => {
      return
    })
    const store = counterStore.use()
    expect(store.count.value).toBe(INITIAL_COUNT)
  })

  it('should replace state if returned', () => {
    const replacedCount = 10
    onCreate.mockReturnValue({
      count: replacedCount,
    })
    const store = counterStore.use()
    expect(store.count.value).toBe(replacedCount)
  })

  it('should uninstall', () => {
    uninstall()
    counterStore.use()
    expect(onCreate).not.toHaveBeenCalled()
  })
})

describe('with OnInitialized hooks', () => {
  const onInitialized = jest.fn()
  let uninstall: Function

  function firstPassedApi() {
    // second argument is the initial API passed to the hook
    return onInitialized.mock.calls[0][2]
  }

  beforeEach(() => {
    uninstall = installOnInitialized(onInitialized)
  })

  afterEach(() => {
    uninstall()
  })

  it('should invoke with state, identifier and API', () => {
    const api = counterStore.use()
    expect(onInitialized).toHaveBeenCalledWith(
      'Test',
      { count: INITIAL_COUNT },
      api,
    )
  })

  describe('when undefined is returned', () => {
    it('should not change API', () => {
      onInitialized.mockImplementation(() => undefined)
      const api = counterStore.use()
      const rawApi = firstPassedApi()
      expect(api.increment).toBe(rawApi.increment)
    })
  })

  describe('when an object is returned', () => {
    it('should override the API', () => {
      const override = {
        increment: () => null,
      }
      onInitialized.mockImplementation(() => override)
      const api = counterStore.use()
      const rawApi = firstPassedApi()
      expect(api).toEqual({ ...rawApi, ...override })
    })
  })

  it('should uninstall', () => {
    uninstall()
    counterStore.use()
    expect(onInitialized).not.toHaveBeenCalled()
  })
})
