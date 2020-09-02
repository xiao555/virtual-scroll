import React from 'react';
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
      r{rowIndex}, c{columnIndex}
    </div>
  );

function App() {
  return (
    <div className="App">
      <h1>react-window</h1>
      <Grid
        className='react-window-wrapper'
        columnCount={1000}
        columnWidth={index => columnWidths[index]}
        height={400}
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
        height={400}
        rowCount={10000}
        getHeight={index => rowHeights[index]}
        width={600}
      >
        {Cell}
      </MyGrid>
    </div>
  );
}

export default App;
