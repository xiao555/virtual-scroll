import React, { createElement, useRef, useState } from 'react';

export function Grid (props) {
  console.log(props)
  const {
    className,
    height,
    width,
    rowCount,
    getHeight,
    itemKey = ({ rowIndex }) => rowIndex,
    overscanForward = 10,
    overscanBackward = 10,
    estimatedRowHeight = 50,
    children,
  } = props
  const outerRef = useRef()
  const innerRef = useRef()
  const [isScrolling, setIsScrolling] = useState(false)
  const [scrollTop, setScrollTop] = useState(0)
  const [metadataMap, setMetadataMap] = useState({})
  const [lastMeasuredIndex, setLastMeasuredIndex] = useState(-1)
  const [itemStyleCache, setItemStyleCache] = useState({})

  function onScroll (event) {
    const {
      clientHeight,
      scrollTop: targetScrollTop,
      scrollHeight,
    } = event.currentTarget;
    if (targetScrollTop === scrollTop) return
    setIsScrolling(true)
    setScrollTop(Math.max(
      0,
      Math.min(targetScrollTop, scrollHeight - clientHeight)
    ))
  }

  function getMetedata (index) {
    if (index > lastMeasuredIndex) {
      let offset = 0
      if (lastMeasuredIndex >= 0) {
        const item = metadataMap[lastMeasuredIndex]
        offset += item.offset + item.height
      }

      for (let i = lastMeasuredIndex + 1; i <= index; i++) {
        let height = getHeight(i)
        metadataMap[i] = {
          offset: offset,
          height
        }
        offset += height
      }
      setLastMeasuredIndex(index)
    }

    return metadataMap[index]
  }

  function findNearestItemBinarySearch (low, high, target) {
    while (low <= high) {
      let mid = low + ~~((high - low) >> 1)
      let offset = getMetedata(mid).offset
      if (offset === target) {
        return mid
      } else if (offset > target) {
        high = mid - 1
      } else {
        low = mid + 1
      }
    }

    return low > 0 ? low - 1 : 0
  }

  function findNearestItemExponentialSearch (index, target) {
    let interval = 1
    while (
      index < rowCount &&
      getMetedata(index).offset < target
    ) {
      index += interval
      interval *= 2
    }

    return findNearestItemBinarySearch(~~(index/2), Math.min(index, rowCount - 1), target)
  }

  function getRowStartIndexForOffset () {
    const lastMeasuredItemOffset =
      lastMeasuredIndex > 0 ? metadataMap[lastMeasuredIndex].offset : 0;

    if (lastMeasuredItemOffset > scrollTop) {
      return findNearestItemBinarySearch(0, lastMeasuredIndex, scrollTop)
    } else {
      return findNearestItemExponentialSearch(Math.max(0, lastMeasuredIndex), scrollTop)
    }
  }

  function getRowStopIndexForStartIndex (startIndex) {
    let maxHeight = scrollTop + props.height
    let stopIndex = startIndex
    let data = getMetedata(stopIndex)
    let height = data.offset + data.height

    while (stopIndex < rowCount - 1 && height < maxHeight) {
      stopIndex++
      height += getMetedata(stopIndex).height
    }
    return stopIndex
  }

  function getVerticalRangeToRender () {
    const startIndex = getRowStartIndexForOffset()
    const stopIndex = getRowStopIndexForStartIndex(startIndex)
    return [
      Math.max(0, startIndex - overscanBackward),
      Math.max(0, Math.min(rowCount - 1, stopIndex + overscanForward)),
    ]
  }

  function getItemStyle (rowIndex) {
    let style
    if (itemStyleCache[rowIndex]) {
      style = itemStyleCache[rowIndex]
    } else {
      let data = getMetedata(rowIndex)
      itemStyleCache[rowIndex] = style = {
        position: 'absolute',
        top: data.offset,
        height: data.height
      }
    }
    return style
  }

  const [startIndex, stopIndex] = getVerticalRangeToRender()

  const items = []

  for (let rowIndex = startIndex; rowIndex <= stopIndex; rowIndex++) {
    items.push(
      createElement(children, {
        rowIndex,
        isScrolling,
        key: itemKey({ rowIndex }),
        style: getItemStyle(rowIndex),
      })
    )
  }

  function getEstimatedTotalHeight () {
    let totalSizeOfMeasuredRows = 0

    if (lastMeasuredIndex >=0) {
      const item = metadataMap[lastMeasuredIndex]
      totalSizeOfMeasuredRows = item.offset + item.height
    }

    const numUnmeasuredItems = rowCount - lastMeasuredIndex - 1
    const totalSizeOfUnmeasuredItems = numUnmeasuredItems * estimatedRowHeight

    return totalSizeOfMeasuredRows + totalSizeOfUnmeasuredItems
  }

  const estimatedTotalHeight = getEstimatedTotalHeight()

  return createElement('div',
    {
      className,
      ref: outerRef,
      onScroll,
      style: {
        position: 'relative',
        height,
        width,
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        willChange: 'transform',
      }
    },
    createElement('div', {
      children: items,
      ref: innerRef,
      style: {
        height: estimatedTotalHeight,
        pointerEvents: isScrolling ? 'none' : undefined,
      }
    })
  )
}