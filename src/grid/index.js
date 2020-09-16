import React, { createElement, useRef, useState } from 'react';

const DefaultHeader = ({ columnIndex, style }) => (
  <div
    style={style}
  >
    H: {columnIndex}
  </div>
);

export function Grid (props) {
  const {
    className,
    height,
    width,
    rowCount,
    columnCount,
    getHeight,
    getWidth,
    itemKey = ({ rowIndex, columnIndex }) => `${rowIndex}:${columnIndex}`,
    overscanForward = 10,
    overscanBackward = 10,
    estimatedRowHeight = 50,
    estimatedColumnWidth = 50,
    children,
    headerHeight = 50,
    headerData = [],
    headerKey = ({ columnIndex }) => headerData[columnIndex],
    headerRender = DefaultHeader
  } = props
  const outerRef = useRef()
  const innerRef = useRef()
  const [isScrolling, setIsScrolling] = useState(false)
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [rowMetadataMap] = useState({})
  const [columnMetadataMap] = useState({})
  const lastMeasuredRowIndex = useRef(-1)
  const lastMeasuredColumnIndex = useRef(-1)
  const [itemStyleCache] = useState({})

  function onScroll (event) {
    const {
      clientHeight,
      clientWidth,
      scrollTop: targetScrollTop,
      scrollLeft: targetScrollLeft,
      scrollHeight,
      scrollWidth,
    } = event.currentTarget;
    if (targetScrollTop === scrollTop && targetScrollLeft === scrollLeft) return

    setIsScrolling(true)
    setScrollTop(Math.max(
      0,
      Math.min(targetScrollTop, scrollHeight - clientHeight)
    ))
    setScrollLeft(Math.max(
      0,
      Math.min(targetScrollLeft, scrollWidth - clientWidth)
    ))
  }

  function getMetedata (type, index) {
    let lastMeasuredIndex, metadataMap, itemSize
    if (type === 'column') {
      lastMeasuredIndex = lastMeasuredColumnIndex.current
      metadataMap = columnMetadataMap
      itemSize = getWidth
    } else {
      lastMeasuredIndex = lastMeasuredRowIndex.current
      metadataMap = rowMetadataMap
      itemSize = getHeight
    }

    if (index > lastMeasuredIndex) {
      let offset = 0
      if (lastMeasuredIndex >= 0) {
        const item = metadataMap[lastMeasuredIndex]
        offset += item.offset + item.size
      }

      for (let i = lastMeasuredIndex + 1; i <= index; i++) {
        let size = itemSize(i)
        metadataMap[i] = {
          offset: offset,
          size
        }
        offset += size
      }
      if (type === 'column') {
        lastMeasuredColumnIndex.current = index
      } else {
        lastMeasuredRowIndex.current = index
      }
    }

    return metadataMap[index]
  }

  function findNearestItemBinarySearch (type, low, high, target) {
    while (low <= high) {
      let mid = low + ~~((high - low) >> 1)
      let offset = getMetedata(type, mid).offset
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

  function findNearestItemExponentialSearch (type, index, target) {
    let itemCount = type === 'column' ? columnCount : rowCount
    let interval = 1
    while (
      index < itemCount &&
      getMetedata(type, index).offset < target
    ) {
      index += interval
      interval *= 2
    }

    return findNearestItemBinarySearch(type, ~~(index/2), Math.min(index, itemCount - 1), target)
  }

  function getStartIndexForOffset (type, offset) {
    let lastMeasuredIndex, metadataMap
    if (type === 'column') {
      lastMeasuredIndex = lastMeasuredColumnIndex.current
      metadataMap = columnMetadataMap
    } else {
      lastMeasuredIndex = lastMeasuredRowIndex.current
      metadataMap = rowMetadataMap
    }
    const lastMeasuredItemOffset =
      lastMeasuredIndex > 0 ? metadataMap[lastMeasuredIndex].offset : 0;

    if (lastMeasuredItemOffset > offset) {
      return findNearestItemBinarySearch(type, 0, lastMeasuredIndex, offset)
    } else {
      return findNearestItemExponentialSearch(type, Math.max(0, lastMeasuredIndex), offset)
    }
  }

  function getRowStopIndexForStartIndex (startIndex) {
    let maxHeight = scrollTop + props.height
    let stopIndex = startIndex
    let data = getMetedata('row', stopIndex)
    let height = data.offset + data.size

    while (stopIndex < rowCount - 1 && height < maxHeight) {
      stopIndex++
      height += getMetedata('row', stopIndex).size
    }
    return stopIndex
  }

  function getColumnStopIndexForStartIndex (startIndex) {
    let maxWidth = scrollLeft + props.width
    let stopIndex = startIndex
    let data = getMetedata('column', stopIndex)
    let width = data.offset + data.size

    while (stopIndex < columnCount - 1 && width < maxWidth) {
      stopIndex++
      width += getMetedata('column', stopIndex).size
    }
    return stopIndex
  }

  function getVerticalRangeToRender () {
    const startIndex = getStartIndexForOffset('row', scrollTop)
    const stopIndex = getRowStopIndexForStartIndex(startIndex)
    return [
      Math.max(0, startIndex - overscanBackward),
      Math.max(0, Math.min(rowCount - 1, stopIndex + overscanForward)),
    ]
  }

  function getHorizontalRangeToRender () {
    const startIndex = getStartIndexForOffset('column', scrollLeft)
    const stopIndex = getColumnStopIndexForStartIndex(startIndex)
    return [
      Math.max(0, startIndex - overscanBackward),
      Math.max(0, Math.min(columnCount - 1, stopIndex + overscanForward)),
    ]
  }

  function getItemStyle (rowIndex, columnIndex) {
    let style
    let key = `${rowIndex}:${columnIndex}`
    if (itemStyleCache[key]) {
      style = itemStyleCache[key]
    } else {
      let rowData = getMetedata('row', rowIndex)
      let columnData = getMetedata('column', columnIndex)
      itemStyleCache[key] = style = {
        position: 'absolute',
        top: rowData.offset,
        height: rowData.size,
        left: columnData.offset,
        width: columnData.size
      }
    }
    return style
  }

  function getHeaderItemStyle (columnIndex) {
    let style
    let key = `h:${columnIndex}`
    if (itemStyleCache[key]) {
      style = itemStyleCache[key]
    } else {
      let columnData = getMetedata('column', columnIndex)
      itemStyleCache[key] = style = {
        position: 'absolute',
        top: 0,
        height: headerHeight,
        left: columnData.offset,
        width: columnData.size
      }
    }
    return style
  }

  const [rowStartIndex, rowStopIndex] = getVerticalRangeToRender()
  const [columnStartIndex, columnStopIndex] = getHorizontalRangeToRender()

  const items = []

  for (let rowIndex = rowStartIndex; rowIndex <= rowStopIndex; rowIndex++) {
    for (let columnIndex = columnStartIndex; columnIndex <= columnStopIndex; columnIndex++) {
      items.push(
        createElement(children, {
          rowIndex,
          columnIndex,
          isScrolling,
          key: itemKey({ rowIndex, columnIndex }),
          style: getItemStyle(rowIndex, columnIndex),
        })
      )
    }
  }

  const headerItems = []

  for (let columnIndex = columnStartIndex; columnIndex <= columnStopIndex; columnIndex++) {
    headerItems.push(
      createElement(headerRender, {
        columnIndex,
        isScrolling,
        data: headerData[columnIndex],
        key: headerKey[columnIndex],
        style: getHeaderItemStyle(columnIndex),
      })
    )
  }

  function getEstimatedTotalSize (type) {
    let lastMeasuredIndex, metadataMap, itemCount, estimatedSize
    if (type === 'column') {
      lastMeasuredIndex = lastMeasuredColumnIndex.current
      metadataMap = columnMetadataMap
      itemCount = columnCount
      estimatedSize = estimatedColumnWidth
    } else {
      lastMeasuredIndex = lastMeasuredRowIndex.current
      metadataMap = rowMetadataMap
      itemCount = rowCount
      estimatedSize = estimatedRowHeight
    }
    let totalSizeOfMeasured = 0

    if (lastMeasuredIndex >=0) {
      const item = metadataMap[lastMeasuredIndex]
      totalSizeOfMeasured = item.offset + item.size
    }

    const numUnmeasuredItems = itemCount - lastMeasuredIndex - 1
    const totalSizeOfUnmeasuredItems = numUnmeasuredItems * estimatedSize

    return totalSizeOfMeasured + totalSizeOfUnmeasuredItems
  }

  const estimatedTotalHeight = getEstimatedTotalSize('row')
  const estimatedTotalWidth = getEstimatedTotalSize('column')

  return createElement('div',
    {
      className,
      ref: outerRef,
      onScroll,
      style: {
        position: 'relative',
        height: height + headerHeight,
        width,
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        willChange: 'transform',
      }
    },
    [
      createElement('div', {
        children: headerItems,
        style: {
          position: 'sticky',
          top: 0,
          height: headerHeight,
          width: estimatedTotalWidth,
          borderBottom: '1px solid #000',
          zIndex: 10
        }
      }),
      createElement('div', {
        children: items,
        ref: innerRef,
        style: {
          position: 'absolute',
          top: headerHeight,
          height: estimatedTotalHeight,
          pointerEvents: isScrolling ? 'none' : undefined,
          width: estimatedTotalWidth,
        }
      })
    ]
  )
}