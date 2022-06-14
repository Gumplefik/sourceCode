import type { Middleware, AnyAction } from 'redux'
import type { ThunkMiddleware } from 'redux-thunk'
import thunkMiddleware from 'redux-thunk'
import type { ImmutableStateInvariantMiddlewareOptions } from './immutableStateInvariantMiddleware'
/* PROD_START_REMOVE_UMD */
import { createImmutableStateInvariantMiddleware } from './immutableStateInvariantMiddleware'
/* PROD_STOP_REMOVE_UMD */

import type { SerializableStateInvariantMiddlewareOptions } from './serializableStateInvariantMiddleware'
import { createSerializableStateInvariantMiddleware } from './serializableStateInvariantMiddleware'
import { MiddlewareArray } from './utils'

function isBoolean(x: any): x is boolean {
  return typeof x === 'boolean'
}

interface ThunkOptions<E = any> {
  extraArgument: E
}

interface GetDefaultMiddlewareOptions {
  thunk?: boolean | ThunkOptions
  immutableCheck?: boolean | ImmutableStateInvariantMiddlewareOptions
  serializableCheck?: boolean | SerializableStateInvariantMiddlewareOptions
}

export type ThunkMiddlewareFor<
  S,
  O extends GetDefaultMiddlewareOptions = {}
> = O extends {
  thunk: false
}
  ? never
  : O extends { thunk: { extraArgument: infer E } }
  ? ThunkMiddleware<S, AnyAction, E>
  :
      | ThunkMiddleware<S, AnyAction, null> //The ThunkMiddleware with a `null` ExtraArgument is here to provide backwards-compatibility.
      | ThunkMiddleware<S, AnyAction>

export type CurriedGetDefaultMiddleware<S = any> = <
  O extends Partial<GetDefaultMiddlewareOptions> = {
    thunk: true
    immutableCheck: true
    serializableCheck: true
  }
>(
  options?: O
) => MiddlewareArray<Middleware<{}, S> | ThunkMiddlewareFor<S, O>>

export function curryGetDefaultMiddleware<
  S = any
>(): CurriedGetDefaultMiddleware<S> {
  return function curriedGetDefaultMiddleware(options) {
    return getDefaultMiddleware(options)
  }
}

/**
 * Returns any array containing the default middleware installed by
 * `configureStore()`. Useful if you want to configure your store with a custom
 * `middleware` array but still keep the default set.
 *
 * @return The default middleware used by `configureStore()`.
 *
 * @public
 *
 * @deprecated Prefer to use the callback notation for the `middleware` option in `configureStore`
 * to access a pre-typed `getDefaultMiddleware` instead.
 */
export function getDefaultMiddleware<
  S = any,
  O extends Partial<GetDefaultMiddlewareOptions> = {
    thunk: true
    immutableCheck: true
    serializableCheck: true
  }
>(
  options: O = {} as O
): MiddlewareArray<Middleware<{}, S> | ThunkMiddlewareFor<S, O>> {
  const {
    thunk = true,
    immutableCheck = true,
    serializableCheck = true,
  } = options

  let middlewareArray: Middleware<{}, S>[] = new MiddlewareArray()

  // 兼容默认的redux-thunk和配置拓展的redux-thunk
  // 需要做拓展的话需要将参数配置在extraArgument上
  if (thunk) {
    if (isBoolean(thunk)) {
      middlewareArray.push(thunkMiddleware)
    } else {
      middlewareArray.push(
        thunkMiddleware.withExtraArgument(thunk.extraArgument)
      )
    }
  }

  // 注意只有非生产环境的话才会这两个插件
  if (process.env.NODE_ENV !== 'production') {
    if (immutableCheck) {
      /* PROD_START_REMOVE_UMD */
      let immutableOptions: ImmutableStateInvariantMiddlewareOptions = {}

      // 支持自定义的结构体传参
      if (!isBoolean(immutableCheck)) {
        immutableOptions = immutableCheck
      }

      // 添加immer中间件
      middlewareArray.unshift(
        createImmutableStateInvariantMiddleware(immutableOptions)
      )
      /* PROD_STOP_REMOVE_UMD */
    }


    // 序列化的配置
    if (serializableCheck) {
      let serializableOptions: SerializableStateInvariantMiddlewareOptions = {}

      if (!isBoolean(serializableCheck)) {
        serializableOptions = serializableCheck
      }

      middlewareArray.push(
        createSerializableStateInvariantMiddleware(serializableOptions)
      )
    }
  }

  return middlewareArray as any
}