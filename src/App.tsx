import React from 'react';
import { db } from './firebase';

function App() {
  console.log(db);

  return (
     <div className="App">
      <h1>App</h1>
      <a href="/register">Register</a>
      <a href="/items">ItemList</a>
    </div>
  );
}

export default App;