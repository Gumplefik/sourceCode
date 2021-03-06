---
id: beyond-combinereducers
title: Beyond combineReducers
sidebar_label: Beyond combineReducers
hide_title: true
---

# Beyond `combineReducers`

The `combineReducers` utility included with Redux is very useful, but is deliberately limited to handle a single common use case: updating a state tree that is a plain Javascript object, by delegating the work of updating each slice of state to a specific slice reducer. It does _not_ handle other use cases, such as a state tree made up of Immutable.js Maps, trying to pass other portions of the state tree as an additional argument to a slice reducer, or performing "ordering" of slice reducer calls. It also does not care how a given slice reducer does its work.

The common question, then, is "How can I use `combineReducers` to handle these other use cases?". The answer to that is simply: "you don't - you probably need to use something else". **Once you go past the core use case for `combineReducers`, it's time to use more "custom" reducer logic**, whether it be specific logic for a one-off use case, or a reusable function that could be widely shared. Here's some suggestions for dealing with a couple of these typical use cases, but feel free to come up with your own approaches.

## Using slice reducers with Immutable.js objects

Since `combineReducers` currently only works with plain Javascript objects, an application that uses an Immutable.js Map object for the top of its state tree could not use `combineReducers` to manage that Map. Since many developers do use Immutable.js, there are a number of published utilities that provide equivalent functionality, such as [redux-immutable](https://github.com/gajus/redux-immutable). This package provides its own implementation of `combineReducers` that knows how to iterate over an Immutable Map instead of a plain Javascript object.

## Sharing data between slice reducers

Similarly, if `sliceReducerA` happens to need some data from `sliceReducerB`'s slice of state in order to handle a particular action, or `sliceReducerB` happens to need the entire state as an argument, `combineReducers` does not handle that itself. This could be resolved by writing a custom function that knows to pass the needed data as an additional argument in those specific cases, such as:

```js
function combinedReducer(state, action) {
  switch (action.type) {
    case 'A_TYPICAL_ACTION': {
      return {
        a: sliceReducerA(state.a, action),
        b: sliceReducerB(state.b, action),
      }
    }
    case 'SOME_SPECIAL_ACTION': {
      return {
        // specifically pass state.b as an additional argument
        a: sliceReducerA(state.a, action, state.b),
        b: sliceReducerB(state.b, action),
      }
    }
    case 'ANOTHER_SPECIAL_ACTION': {
      return {
        a: sliceReducerA(state.a, action),
        // specifically pass the entire state as an additional argument
        b: sliceReducerB(state.b, action, state),
      }
    }
    default:
      return state
  }
}
```

Another alternative to the "shared-slice updates" issue would be to simply put more data into the action. This is easily accomplished using thunk functions or a similar approach, per this example:

```js
function someSpecialActionCreator() {
  return (dispatch, getState) => {
    const state = getState()
    const dataFromB = selectImportantDataFromB(state)

    dispatch({
      type: 'SOME_SPECIAL_ACTION',
      payload: {
        dataFromB,
      },
    })
  }
}
```

Because the data from B's slice is already in the action, the parent reducer doesn't have to do anything special to make that data available to `sliceReducerA`.

A third approach would be to use the reducer generated by `combineReducers` to handle the "simple" cases where each slice reducer can update itself independently, but also use another reducer to handle the "special" cases where data needs to be shared across slices. Then, a wrapping function could call both of those reducers in turn to generate the final result:

```js
const combinedReducer = combineReducers({
  a: sliceReducerA,
  b: sliceReducerB,
})

function crossSliceReducer(state, action) {
  switch (action.type) {
    case 'SOME_SPECIAL_ACTION': {
      return {
        // specifically pass state.b as an additional argument
        a: handleSpecialCaseForA(state.a, action, state.b),
        b: sliceReducerB(state.b, action),
      }
    }
    default:
      return state
  }
}

function rootReducer(state, action) {
  const intermediateState = combinedReducer(state, action)
  const finalState = crossSliceReducer(intermediateState, action)
  return finalState
}
```

As it turns out, there's a useful utility called [reduce-reducers](https://github.com/acdlite/reduce-reducers) that can make that process easier. It simply takes multiple reducers and runs `reduce()` on them, passing the intermediate state values to the next reducer in line:

```js
// Same as the "manual" rootReducer above
const rootReducer = reduceReducers(combinedReducers, crossSliceReducer)
```

Note that if you use `reduceReducers`, you should make sure that the first reducer in the list is able to define the initial state, since the later reducers will generally assume that the entire state already exists and not try to provide defaults.

## Further Suggestions

Again, it's important to understand that Redux reducers are _just_ functions. While `combineReducers` is useful, it's just one tool in the toolbox. Functions can contain conditional logic other than switch statements, functions can be composed to wrap each other, and functions can call other functions. Maybe you need one of your slice reducers to be able to reset its state, and to only respond to specific actions overall. You could do:

```js
const undoableFilteredSliceA = compose(
  undoReducer,
  filterReducer('ACTION_1', 'ACTION_2'),
  sliceReducerA
)
const rootReducer = combineReducers({
  a: undoableFilteredSliceA,
  b: normalSliceReducerB,
})
```

Note that `combineReducers` doesn't know or care that there's anything special about the reducer function that's responsible for managing `a`. We didn't need to modify `combineReducers` to specifically know how to undo things - we just built up the pieces we needed into a new composed function.

Also, while `combineReducers` is the one reducer utility function that's built into Redux, there's a wide variety of third-party reducer utilities that have published for reuse. The [Redux Addons Catalog](https://github.com/markerikson/redux-ecosystem-links) lists many of the third-party utilities that are available. Or, if none of the published utilities solve your use case, you can always write a function yourself that does just exactly what you need.
