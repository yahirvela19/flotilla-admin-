import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
// Asegúrate de que estos archivos existan en src/pages/
import Choferes from './pages/Choferes';
import Vehiculos from './pages/Vehiculos';
import Asignaciones from './pages/Asignaciones';
import Pagos from './pages/Pagos';

function App() {
  return (
    <Router>
      {/* Navegación Simple */}
      <nav style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
        <Link to="/"><button>Inicio</button></Link>
        <Link to="/choferes"><button>Choferes</button></Link>
        <Link to="/vehiculos"><button>Vehículos</button></Link>
        <Link to="/asignaciones"><button>Asignaciones</button></Link>
        <Link to="/pagos"><button>Pagos</button></Link>
      </nav>

      {/* Área de Contenido */}
      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={
            <div>
              <h1>Bienvenido al Sistema de Flotilla</h1>
            </div>
          } />
          
          <Route path="/choferes" element={<Choferes />} />
          <Route path="/vehiculos" element={<Vehiculos />} />
          <Route path="/asignaciones" element={<Asignaciones />} />
          <Route path="/pagos" element={<Pagos />} />
          
          <Route path="*" element={<h2>Error 404: Página no encontrada</h2>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;