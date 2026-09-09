// Variables de estado simulado
let totalBolsasVendidas = 128;

function actualizarContadorYProgreso() {
  document.getElementById('contador-ventas').innerText = totalBolsasVendidas;

  const residuo = totalBolsasVendidas % 100;
  const proximaMeta = (Math.floor(totalBolsasVendidas / 100) + 1) * 100;

  document.getElementById('contador-progreso-texto').innerText = `${residuo} / 100 bolsas`;
  document.getElementById('progress-bar-fill').style.width = `${residuo}%`;
  document.getElementById('meta-actual').innerText = proximaMeta;
}

// Cambiar entre Vistas / Roles
function cambiarRol(rol) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('nav .nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById(`vista-${rol}`).classList.add('active');
  document.getElementById(`btn-${rol}`).classList.add('active');
}

// Lógica de Vendedor / Empleado
function mostrarSubtipo() {
  const tipo = document.getElementById('tipo-producto').value;
  const grupoMaletin = document.getElementById('grupo-maletin');
  grupoMaletin.style.display = tipo === 'maletin' ? 'block' : 'none';
}

function registrarVenta() {
  const tipo = document.getElementById('tipo-producto').value;
  let detalle = tipo;
  
  if (tipo === 'maletin') {
    const subtipo = document.getElementById('tipo-maletin').value;
    detalle += ` (${subtipo})`;
  }

  if (tipo === 'bolsa') {
    totalBolsasVendidas++;
    actualizarContadorYProgreso();

    if (totalBolsasVendidas % 100 === 0) {
      alert(`🎉 ¡FELICITACIONES! Esta fue la bolsa N° ${totalBolsasVendidas}.\n\n🎁 ¡SE REGALA UN POCHOCLO A ESTE CLIENTE!`);
    } else {
      alert(`Venta registrada con éxito: ${detalle}`);
    }
  } else {
    alert(`Venta registrada con éxito: ${detalle}`);
  }
}

// Lógica de Admin
function modificarStock(carritoId) {
  const cantidad = prompt("Ingrese la cantidad de cajas a añadir al carrito:");
  if (cantidad && !isNaN(cantidad)) {
    const elem = document.getElementById(`stock-${carritoId}`);
    elem.innerText = parseInt(elem.innerText) + parseInt(cantidad);
  }
}

// Lógica de Cliente
function agregarReseña() {
  const nombre = document.getElementById('nombre-cliente').value;
  const comentario = document.getElementById('comentario').value;
  const puntuacion = document.getElementById('puntuacion').value;

  if (!nombre || !comentario) {
    alert("Por favor completa tu nombre y comentario.");
    return;
  }

  const contenedor = document.getElementById('lista-reseñas');
  const nuevaReseña = document.createElement('div');
  nuevaReseña.className = 'card review-card';
  nuevaReseña.innerHTML = `
    <div class="review-header">
      <strong>${nombre}</strong>
      <span class="pochoclos-rating">${puntuacion}</span>
    </div>
    <p class="review-body">"${comentario}"</p>
  `;

  contenedor.prepend(nuevaReseña);

  document.getElementById('nombre-cliente').value = '';
  document.getElementById('comentario').value = '';
  alert("¡Gracias por tu reseña!");
}

// Efecto interactivo: Lluvia / Explosión de Pochoclos al presionar el ícono
function lanzarPochoclos(e) {
  const rect = e.target.getBoundingClientRect();
  const origenX = rect.left + rect.width / 2;
  const origenY = rect.top + rect.height / 2;

  for (let i = 0; i < 15; i++) {
    const p = document.createElement('span');
    p.innerText = '🍿';
    p.className = 'popcorn-particle';
    
    p.style.left = `${origenX}px`;
    p.style.top = `${origenY}px`;

    const angle = Math.random() * Math.PI * 2;
    const velocity = 60 + Math.random() * 90;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity - 40;

    p.style.setProperty('--vx', `${vx}px`);
    p.style.setProperty('--vy', `${vy}px`);

    document.body.appendChild(p);

    setTimeout(() => {
      p.remove();
    }, 900);
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  actualizarContadorYProgreso();
});