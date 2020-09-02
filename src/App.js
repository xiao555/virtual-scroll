import React, { useState } from 'react';
import { VariableSizeGrid as Grid } from 'react-window';
import { Grid as MyGrid } from './grid'
import './App.css'

// These item sizes are arbitrary.
// Yours should be based on the content of the item.
const columnWidths = new Array(1000)
  .fill(true)
  .map(() => 75 + Math.round(Math.random() * 50));
const rowHeights = new Array(10000)
  .fill(true)
  .map(() => 25 + Math.round(Math.random() * 50));

function App() {

  const [headers, setHeaders] = useState(new Array(1000).fill(true).map((val, index) => index))

  function dragStart (e, index) {
    e.dataTransfer.setData('text', index);
  }

  function drop (e, index) {
    e.preventDefault()
    let startIndex = e.dataTransfer.getData('text');
    [headers[startIndex], headers[index]] = [headers[index], headers[startIndex]]
    setHeaders(headers.slice())
  }

  const Cell = ({ columnIndex, rowIndex, style }) => (
    <div
      className={
        columnIndex % 2
          ? rowIndex % 2 === 0
            ? 'GridItemOdd'
            : 'GridItemEven'
          : rowIndex % 2
            ? 'GridItemOdd'
            : 'GridItemEven'
      }
      style={style}
    >
      r{rowIndex}, c{columnIndex}, h{headers[columnIndex]}
    </div>
  );

  const Header = ({ columnIndex, style, data, }) => {
    return (
      <div
        className='GridHeaderItem'
        style={style}
        draggable={true}
        onDragStart={(e) => dragStart(e, columnIndex)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => drop(e, columnIndex)}
      >
        H: {data}
      </div>
    )
  };

  return (
    <div className="App">
      <h1>react-window</h1>
      <Grid
        className='react-window-wrapper'
        columnCount={1000}
        columnWidth={index => columnWidths[index]}
        height={200}
        rowCount={10000}
        rowHeight={index => rowHeights[index]}
        width={600}
      >
        {Cell}
      </Grid>
      <h1>my-grid</h1>
      <MyGrid
        className='react-window-wrapper'
        columnCount={1000}
        getWidth={index => columnWidths[index]}
        height={200}
        rowCount={10000}
        getHeight={index => rowHeights[index]}
        width={600}
        headerData={headers}
        headerKey={({ columnIndex }) => headers[columnIndex]}
        itemKey={({ rowIndex, columnIndex }) => `${headers[columnIndex]}:${rowIndex}:${columnIndex}`}
        headerRender={Header}
      >
        {Cell}
      </MyGrid>
    </div>
  );
}

export default App;
