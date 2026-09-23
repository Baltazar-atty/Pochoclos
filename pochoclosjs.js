let usuarioSesion = null;
let calificacionSeleccionada = 5;

// EFECTO POCHOCLOS EN EL TÍTULO
function explotarPochoclos(e) {
  const rect = e.target.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'popcorn-particle';
    p.textContent = '🍿';
    
    const dx = (Math.random() - 0.5) * 200 + 'px';
    const dy = -(Math.random() * 150 + 50) + 'px';
    const rot = (Math.random() - 0.5) * 360 + 'deg';

    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.setProperty('--dx', dx);
    p.style.setProperty('--dy', dy);
    p.style.setProperty('--rot', rot);

    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
}

// MODAL DE LOGIN
function abrirModalLogin() {
  document.getElementById('modal-login').classList.remove('hidden');
}

function cerrarModalLogin() {
  document.getElementById('modal-login').classList.add('hidden');
}

// LOGIN MEDIANTE PHP (login.php)
async function procesarLogin(e) {
  e.preventDefault();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  console.log("=== INICIO LOGIN ===");
  console.log("Email:", email);

  try {
    const res = await fetch('login.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    console.log("Estado HTTP:", res.status);
    console.log("OK:", res.ok);

    const texto = await res.text();

    console.log("Respuesta exacta de PHP:");
    console.log(texto);

    let data;

    try {
      data = JSON.parse(texto);
    } catch (error) {
      console.error("ERROR AL CONVERTIR JSON:", error);
      alert("PHP no está devolviendo JSON válido. Mirá la consola.");
      return;
    }

    console.log("Datos recibidos:", data);

    if (data.success) {
      console.log("LOGIN CORRECTO");
      console.log("Rol:", data.rol);
      console.log("Nombre:", data.nombre);

      usuarioSesion = data;
      cerrarModalLogin();
      activarPanel(data.rol, data.nombre);

    } else {
      console.log("LOGIN RECHAZADO:", data.message);
      alert(data.message || "Credenciales incorrectas.");
    }

  } catch (err) {
    console.error("ERROR REAL:", err);
    alert("ERROR REAL: " + err.message);
  }
}

function activarPanel(rol, nombre) {
  document.getElementById('vista-publica').classList.add('hidden');
  document.getElementById('btn-abrir-login').classList.add('hidden');
  document.getElementById('label-usuario').classList.remove('hidden');
  document.getElementById('btn-cerrar-sesion').classList.remove('hidden');

  const label = document.getElementById('label-usuario');

  if (rol === 'admin') {
    label.textContent = `👑 Admin: ${nombre}`;
    document.getElementById('vista-admin').classList.remove('hidden');
    renderizarEmpleados();
  } else {
    label.textContent = `🛒 ${nombre}`;
    document.getElementById('vista-empleado').classList.remove('hidden');
  }
}

function cerrarSesion() {
  usuarioSesion = null;
  document.getElementById('vista-admin').classList.add('hidden');
  document.getElementById('vista-empleado').classList.add('hidden');
  document.getElementById('label-usuario').classList.add('hidden');
  document.getElementById('btn-cerrar-sesion').classList.add('hidden');

  document.getElementById('vista-publica').classList.remove('hidden');
  document.getElementById('btn-abrir-login').classList.remove('hidden');
}

// GESTIÓN DE EMPLEADOS CON BASE DE DATOS (empleados.php)
async function renderizarEmpleados() {
  const lista = document.getElementById('tabla-empleados');
  lista.innerHTML = '<li>Cargando empleados...</li>';

  try {
    const res = await fetch('empleados.php');
    const data = await res.json();

    if (data.success) {
      lista.innerHTML = '';
      if (data.empleados.length === 0) {
        lista.innerHTML = '<li style="color: #64748b;">No hay empleados registrados.</li>';
        return;
      }

      data.empleados.forEach(emp => {
        lista.innerHTML += `
          <li>
            <span>
              <strong>${emp.nombre} ${emp.apellido}</strong> - ${emp.email}<br>
              <small style="color: #64748b;">Carrito Asignado ID: ${emp.carrito_id || 'Sin asignación'}</small>
            </span>
            <button class="btn btn-danger" onclick="eliminarEmpleado(${emp.id})">Borrar</button>
          </li>
        `;
      });
    } else {
      lista.innerHTML = '<li style="color: #ef4444;">Error al obtener empleados.</li>';
    }
  } catch (err) {
    lista.innerHTML = '<li style="color: #ef4444;">Error de conexión con el servidor.</li>';
  }
}

async function crearEmpleado(e) {
  e.preventDefault();

  const nombre = document.getElementById('emp-nombre').value.trim();
  const apellido = document.getElementById('emp-apellido').value.trim();
  const email = document.getElementById('emp-email').value.trim();
  const password = document.getElementById('emp-password').value.trim();
  const carrito_id = document.getElementById('emp-carrito').value;

  try {
    const res = await fetch('empleados.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, apellido, email, password, carrito_id })
    });

    const data = await res.json();

    if (data.success) {
      alert("✅ " + data.message);
      e.target.reset();
      renderizarEmpleados();
    } else {
      alert("⚠️ " + data.message);
    }
  } catch (err) {
    alert("❌ Error al conectar con el servidor.");
  }
}

async function eliminarEmpleado(id) {
  if (!confirm("¿Seguro que querés eliminar la cuenta de este empleado?")) return;

  try {
    const res = await fetch('empleados.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    const data = await res.json();

    if (data.success) {
      alert("✅ " + data.message);
      renderizarEmpleados();
    } else {
      alert("⚠️ " + data.message);
    }
  } catch (err) {
    alert("❌ Error al procesar la eliminación.");
  }
}

// SISTEMA DE CALIFICACIÓN POR POCHOCLOS
function seleccionarCalificacion(valor) {
  calificacionSeleccionada = valor;
  const bolsitas = document.querySelectorAll('#rating-container .popcorn-star');
  bolsitas.forEach((b, index) => {
    if (index < valor) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });
}

function guardarComentario(e) {
  e.preventDefault();
  const nombre = document.getElementById('com-nombre').value;
  const apellido = document.getElementById('com-apellido').value;
  const texto = document.getElementById('com-texto').value;

  const bolsitasStr = '🍿'.repeat(calificacionSeleccionada);

  const lista = document.getElementById('lista-comentarios');
  const nuevoComentario = `
    <div class="comment-item">
      <div class="comment-header">
        <span class="comment-author">${nombre} ${apellido}</span>
        <span>${bolsitasStr}</span>
      </div>
      <p style="font-size: 0.88rem; color: #334155;">${texto}</p>
    </div>
  `;

  lista.insertAdjacentHTML('afterbegin', nuevoComentario);
  e.target.reset();
  seleccionarCalificacion(5);
}

function registrarVenta(e) {
  e.preventDefault();
  alert("✅ Venta registrada con éxito.");
}