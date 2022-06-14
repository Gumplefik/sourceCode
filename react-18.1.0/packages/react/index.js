/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Keep in sync with https://github.com/facebook/flow/blob/main/lib/react.js
export type StatelessFunctionalComponent<
  P,
> = React$StatelessFunctionalComponent<P>;
export type ComponentType<-P> = React$ComponentType<P>;
export type AbstractComponent<
  -Config,
  +Instance = mixed,
> = React$AbstractComponent<Config, Instance>;
export type ElementType = React$ElementType;
export type Element<+C> = React$Element<C>;
export type Key = React$Key;
export type Ref<C> = React$Ref<C>;
export type Node = React$Node;
export type Context<T> = React$Context<T>;
export type Portal = React$Portal;
export type ElementProps<C> = React$ElementProps<C>;
export type ElementConfig<C> = React$ElementConfig<C>;
export type ElementRef<C> = React$ElementRef<C>;
export type Config<Props, DefaultProps> = React$Config<Props, DefaultProps>;
export type ChildrenArray<+T> = $ReadOnlyArray<ChildrenArray<T>> | T;

// Export all exports so that they're available in tests.
// We can't use export * from in Flow for some reason.
// 日常看代码先看有什么功能，再按功能去理解为什么这么实现就容易了
export {
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  // 用来配置做单元测试的
  act as unstable_act,
  // 做高阶函数处理子元素的
  Children,
  Component,
  // 虚拟元素
  Fragment,
  // 配合onRender做性能分析
  Profiler,
  PureComponent,
  // 严格模式
  StrictMode,
  // 配置做懒加载 延迟加载
  Suspense,
  // 解决suspense加载和显示顺序问题，见 https://17.reactjs.org/docs/concurrent-mode-patterns.html#suspenselist
  SuspenseList,
  cloneElement,
  createContext,
  createElement,
  createFactory,
  // 创建外部的不可变数据源， 见  https://juejin.cn/post/7026210002042011655
  createMutableSource,
  createRef,
  createServerContext,
  forwardRef,
  isValidElement,
  lazy,
  memo,
  // Concurrent模式下的低优先级渲染    https://zhuanlan.zhihu.com/p/431569744
  startTransition,
  unstable_Cache,
  unstable_DebugTracingMode,
  unstable_LegacyHidden,
  unstable_Offscreen,
  unstable_Scope,
  unstable_TracingMarker,
  unstable_getCacheSignal,
  unstable_getCacheForType,
  unstable_useCacheRefresh,
  // https://github.com/facebook/react/issues/4000
  useId,
  useCallback,
  useContext,
  useDebugValue,
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useMutableSource,
  useSyncExternalStore,
  useReducer,
  useRef,
  useState,
  useTransition,
  version,
} from './src/React';
