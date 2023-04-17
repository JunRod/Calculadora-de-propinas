let cliente = {
    mesa: '',
    hora: '',
    pedido: [],
};

const categorias = {
    1: 'Comida',
    2: 'Bebida',
    3: 'Postre',
};

const guardarCliente = document.querySelector('#guardar-cliente').addEventListener('click', validarForm);

function validarForm() {
    const mesa = document.querySelector('#mesa').value;
    const hora = document.querySelector('#hora').value;

    const form = [mesa, hora].some((campo) => campo === '');

    if (form) {
        Mensaje('Debe rellenar ambos campos', 'error');
        return;
    }

    cliente = { ...cliente, mesa, hora };

    const modalFormulario = document.querySelector('#formulario');
    const modalBoostrap = bootstrap.Modal.getInstance(modalFormulario);
    modalBoostrap.hide();

    mostrarSecciones();

    obtenerPlatillos();
}

function mostrarSecciones() {
    const seccionesOcultas = document.querySelectorAll('.d-none');
    seccionesOcultas.forEach((seccion) => {
        seccion.classList.remove('d-none');
    });
}

function obtenerPlatillos() {
    const url = `http://localhost:3000/platillos`;

    fetch(url)
        .then((respuesta) => respuesta.json())
        .then((resultado) => imprimirPlatillos(resultado));
}

function imprimirPlatillos(platillos) {
    const contenido = document.querySelector('#platillos .contenido');

    platillos.forEach((platillo) => {
        const row = document.createElement('div');
        row.classList.add('row', 'py-3', 'border-top');

        const nombre = document.createElement('div');
        nombre.classList.add('col-md-4');
        nombre.textContent = platillo.nombre;
        row.appendChild(nombre);

        const precio = document.createElement('div');
        precio.classList.add('col-md-3', 'fw-bold');
        precio.textContent = `$${platillo.precio}`;
        row.appendChild(precio);

        const categoria = document.createElement('div');
        categoria.classList.add('col-md-3', 'fw-bold');
        categoria.textContent = categorias[platillo.categoria];
        row.appendChild(categoria);

        const inputNumber = document.createElement('input');
        inputNumber.min = 0;
        inputNumber.value = 0;
        inputNumber.type = 'number';
        inputNumber.id = `producto-${platillo.id}`;
        inputNumber.classList.add('form-control');
        inputNumber.onchange = () => {
            const cantidad = parseInt(inputNumber.value);
            live({ ...platillo, cantidad });
        };

        const div = document.createElement('div');
        div.classList.add('col-md-2');
        div.appendChild(inputNumber);
        row.appendChild(div);

        contenido.appendChild(row);
    });
}

function live(producto) {
    let { pedido } = cliente;

    if (producto.cantidad > 0) {
        //Actualizar Cantidad
        //Comrpueba si existe en el array
        if (pedido.some((articulo) => articulo.id === producto.id)) {
            //El articulo existe: Actualiza la cantidad (OJO: juan juega primero con "pedido", pero no es el original)
            const pedidoActualizado = pedido.map((articulo) => {
                if (articulo.id === producto.id) {
                    articulo.cantidad = producto.cantidad;
                }
                return articulo;
            });
            //Asigna el nuevo array actualizado (este array actualizado "pedido" era una copia del original)
            cliente.pedido = [...pedidoActualizado];
        } else {
            cliente.pedido = [...pedido, producto];
        }
    } else {
        //Borrar Articulo si la cantidad llego a 0
        const resultado = pedido.filter((pedidoFilter) => pedidoFilter.id !== producto.id);
        cliente.pedido = [...resultado];
    }

    actualizarHTML(cliente);
}

function actualizarHTML(cliente) {
    const contenido = document.querySelector('#resumen .contenido');
    const { pedido } = cliente;

    if (cliente.pedido.length === 0) {
        contenido.innerHTML = `<p class="text-center">Añade los elementos del pedido</p>`;
        return;
    }

    //Borrar los elementos de contenido
    while (contenido.firstChild) {
        contenido.removeChild(contenido.firstChild);
    }

    //Contenedor Global
    const resumen = document.createElement('div');
    resumen.classList.add('col-md-6', 'card', 'py-5', 'px-3', 'shadow');

    //Info Mesa
    const mesa = document.createElement('div');
    mesa.innerHTML = `
        <p class="fw-bold">Mesa: <span class="fw-normal">${cliente.mesa}</span></p>
        <p class="fw-bold">Hora: <span class="fw-normal">${cliente.hora}</span></p>`;

    //Heading
    const heading = document.createElement('H4');
    heading.textContent = 'Platillos Consumidos';
    heading.classList.add('my-4', 'text-center', 'fw-bold');

    //Iterar sobre los articulos de pedidos

    const grupo = document.createElement('UL');
    grupo.classList.add('list-group');

    pedido.forEach((articulo) => {
        const { nombre, cantidad, precio, id } = articulo;

        const lista = document.createElement('LI');
        lista.classList.add('list-group-item');

        const nombreEl = document.createElement('H4');
        nombreEl.classList.add('my-4');
        nombreEl.textContent = nombre;

        const cantidadEl = document.createElement('P');
        cantidadEl.classList.add('fw-bold');
        cantidadEl.textContent = `Cantidad: ${cantidad}`;

        const precioEl = document.createElement('P');
        precioEl.classList.add('fw-bold');
        precioEl.textContent = `Precio: $${precio}`;

        const subtotalValor = document.createElement('P');
        subtotalValor.classList.add('fw-bold');
        subtotalValor.textContent = 'Subtotal: ' + calcularSubtotal(precio, cantidad);

        const btnEliminar = document.createElement('button');
        btnEliminar.classList.add('btn-danger', 'btn');
        btnEliminar.textContent = 'Eliminar del Pedido';
        btnEliminar.onclick = () => {
            eliminarArticulo(id);

            //Reinciar valor de (input) del articulo a 0
            document.querySelector(`#producto-${id}`).value = 0;
        };

        //Agregar valores a la lista
        lista.appendChild(nombreEl);
        lista.appendChild(cantidadEl);
        lista.appendChild(precioEl);
        lista.appendChild(subtotalValor);
        lista.appendChild(btnEliminar);

        grupo.appendChild(lista);
    });

    //Agregar a Resumen
    resumen.appendChild(heading);
    resumen.appendChild(mesa);
    resumen.appendChild(grupo);

    contenido.appendChild(resumen);

    //Imprimir Formulario Propinas
    ImprimirPropinas();
}

function ImprimirPropinas() {
    const contenido = document.querySelector('#resumen .contenido');

    const formulario = document.createElement('DIV');
    formulario.classList.add('col-md-5', 'formulario');

    const formularioDiv = document.createElement('div');
    formularioDiv.classList.add('card', 'py-2', 'px-3', 'shadow');

    const heading = document.createElement('H3');
    heading.classList.add('my-4', 'text-center');
    heading.textContent = 'Propina';

    //Radio 10%
    const radio10 = document.createElement('INPUT');
    radio10.type = 'radio';
    radio10.value = '10';
    radio10.name = 'propina';
    radio10.classList.add('form-check-input');
    radio10.onclick = calcularPropina;

    const radio10Label = document.createElement('label');
    radio10Label.classList.add('form-check-label');
    radio10Label.textContent = '10%';

    const radio10Div = document.createElement('DIV');
    radio10Div.classList.add('from-check');

    //Agregarle Radio y Label a DivRadio
    radio10Div.appendChild(radio10);
    radio10Div.appendChild(radio10Label);

    //Radio 25%
    const radio25 = document.createElement('INPUT');
    radio25.type = 'radio';
    radio25.value = '25';
    radio25.name = 'propina';
    radio25.classList.add('form-check-input');
    radio25.onclick = calcularPropina;

    const radio25Label = document.createElement('label');
    radio25Label.classList.add('form-check-label');
    radio25Label.textContent = '25%';

    const radio25Div = document.createElement('DIV');
    radio25Div.classList.add('from-check');

    //Agregarle Radio y Label a DivRadio
    radio25Div.appendChild(radio25);
    radio25Div.appendChild(radio25Label);

    //Radio 50%
    const radio50 = document.createElement('INPUT');
    radio50.type = 'radio';
    radio50.value = '50';
    radio50.name = 'propina';
    radio50.classList.add('form-check-input');
    radio50.onclick = calcularPropina;

    const radio50Label = document.createElement('label');
    radio50Label.classList.add('form-check-label');
    radio50Label.textContent = '50%';

    const radio50Div = document.createElement('DIV');
    radio50Div.classList.add('from-check');

    //Agregarle Radio y Label a DivRadio
    radio50Div.appendChild(radio50);
    radio50Div.appendChild(radio50Label);

    //Contenido de formulario
    formularioDiv.appendChild(heading);
    formularioDiv.appendChild(radio10Div);
    formularioDiv.appendChild(radio25Div);
    formularioDiv.appendChild(radio50Div);
    formulario.appendChild(formularioDiv);

    contenido.appendChild(formulario);
}

function calcularPropina() {
    const { pedido } = cliente;
    let subtotal = 0;

    pedido.forEach((articulo) => {
        subtotal += articulo.cantidad * articulo.precio;
    });

    //Selecciona el radio button seleccionado
    const propinaSeleccionada = Number(document.querySelector('[name="propina"]:checked').value);

    //calcula la propina (subtotal * porcentaje / 100)
    const propina = (subtotal * propinaSeleccionada) / 100;

    //calcular total a pagar
    const total = subtotal + propina;

    mostrarTotalHTML(total, subtotal, propina);
}

function mostrarTotalHTML(total, subtotal, propina) {
    const formularioPropina = document.querySelector('.formulario .card');

    const divTotales = document.createElement('div');
    divTotales.classList.add('total-pagar');

    //SubTotal
    const subTotal = document.createElement('P');
    subTotal.classList.add('fw-bold', 'pt-3');
    subTotal.innerHTML = `
    Subtotal: <span class=fw-normal">$${subtotal}</span>
    `;

    //Propina
    const propinaP = document.createElement('P');
    propinaP.classList.add('fw-bold');
    propinaP.innerHTML = `
    Propina: <span class=fw-normal">$${propina}</span>
    `;

    //Propina
    const totalP = document.createElement('P');
    totalP.classList.add('fw-bold');
    totalP.innerHTML = `
    Total a Pagar: <span class=fw-normal">$${total}</span>
    `;

    //Elimina resultado previo
    const totalPagar = document.querySelector('.total-pagar');

    if (totalPagar) {
        totalPagar.remove();
    }

    divTotales.appendChild(subTotal);
    divTotales.appendChild(propinaP);
    divTotales.appendChild(totalP);

    formularioPropina.appendChild(divTotales);
}
function eliminarArticulo(id) {
    const { pedido } = cliente;

    const resultado = pedido.filter((articulo) => articulo.id !== id);
    cliente.pedido = [...resultado];

    return actualizarHTML(cliente);
}

function calcularSubtotal(precio, cantidad) {
    return `$${precio * cantidad}`;
}

function Mensaje(texto, tipo) {
    Swal.fire({
        position: 'center',
        icon: tipo,
        title: texto,
        showConfirmButton: false,
        timer: 1500,
    });
}
