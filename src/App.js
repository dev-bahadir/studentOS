import React from 'react';
import Notes from './pages/Notes'; // Wir importieren deine neue Seite

function App() {
  return (
    <div className="App">
      {/* Hier binden wir die Notes-Komponente ein */}
      <Notes />
    </div>
  );
}

export default App;