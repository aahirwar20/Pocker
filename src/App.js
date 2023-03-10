
// import './App.css';
import Pocker  from './view/pocker';
import ThemeProvider from 'react-bootstrap/ThemeProvider'

function App() {
  return (
    <ThemeProvider
  breakpoints={['xxxl', 'xxl', 'xl', 'lg', 'md', 'sm', 'xs', 'xxs']}
  minBreakpoint="xxs"
>
    <div className="App">
    
      <Pocker/>
    </div></ThemeProvider>
  );
}

export default App;
