// --- Mock Data (Kardex / DB) ---
const INVENTORY = [
    { id: 'REF001', name: 'Montura RayBan Aviator', stock: 15, listPrice: 120000 },
    { id: 'REF002', name: 'Lente de Contacto Acuvue', stock: 50, listPrice: 45000 },
    { id: 'REF003', name: 'Líquido Multipropósito', stock: 30, listPrice: 25000 },
    { id: 'REF004', name: 'Gafas de Sol Oakley', stock: 5, listPrice: 210000 },
    { id: 'REF005', name: 'Montura Pasta Genérica', stock: 100, listPrice: 35000 },
    { id: 'MV1', name: 'Montura de Prueba MV1', stock: 200, listPrice: 85000 },
    { id: 'MV2', name: 'Lente de Prueba MV2', stock: 150, listPrice: 95000 }
];

let ordersDB = [
    { consecutive: 'PED-1001', date: '2026-06-20', customer: 'Juan Perez', total: 120000, status: 'pendiente', empresa: 'Jose Maria Iglesias', sucursal: 'Maxigafas', centroCosto: 'Punto de venta Maxigafas', logistica: {} },
    { consecutive: 'PED-1002', date: '2026-06-21', customer: 'Maria Gomez', total: 45000, status: 'alistamiento', empresa: 'Jose Maria Iglesias', sucursal: 'Optimax', centroCosto: 'Punto de venta Optimax', logistica: {} },
    { consecutive: 'PED-1003', date: '2026-06-22', customer: 'Carlos Ruiz', total: 25000, status: 'transporte', empresa: 'Jose Maria Iglesias', sucursal: 'Surtiopticas', centroCosto: 'Punto de venta Surtiopticas', logistica: {} },
    { consecutive: 'PED-1004', date: '2026-06-23', customer: 'Ana Lopez', total: 210000, status: 'entregado', empresa: 'Jose Maria Iglesias', sucursal: 'Maxigafas', centroCosto: 'Sala de ventas Maxigafas', logistica: {} },
    { consecutive: 'PED-1005', date: '2026-06-24', customer: 'Consumidor Final', total: 35000, status: 'pendiente', empresa: 'Jose Maria Iglesias', sucursal: 'Optimax', centroCosto: 'Punto de venta Optimax', logistica: {} }
];

let quotesDB = [
    { consecutive: 'COT-2001', date: '2026-06-20', customer: 'Empresa XYZ', total: 240000, empresa: 'Jose Maria Iglesias', sucursal: 'Maxigafas', centroCosto: 'Punto de venta Maxigafas' },
    { consecutive: 'COT-2002', date: '2026-06-21', customer: 'Colegio ABC', total: 90000, empresa: 'Jose Maria Iglesias', sucursal: 'Optimax', centroCosto: 'Punto de venta Optimax' },
    { consecutive: 'COT-2003', date: '2026-06-22', customer: 'Luis Fernando', total: 50000, empresa: 'Jose Maria Iglesias', sucursal: 'Surtiopticas', centroCosto: 'Punto de venta Surtiopticas' },
    { consecutive: 'COT-2004', date: '2026-06-23', customer: 'Optica Sur', total: 420000, empresa: 'Jose Maria Iglesias', sucursal: 'Maxigafas', centroCosto: 'Sala de ventas Maxigafas' },
    { consecutive: 'COT-2005', date: '2026-06-24', customer: 'Cliente Frecuente', total: 70000, empresa: 'Jose Maria Iglesias', sucursal: 'Surtiopticas', centroCosto: 'Punto de venta Surtiopticas' }
];

// Global State
let activeView = 'login';
let formType = null;
let currentDocument = null;
let currentLogisticsOrder = null;

// Counters per branch
let branchCounters = {
    "Maxigafas-Punto de venta Maxigafas": { PED: 1006, COT: 2006 },
    "Maxigafas-Sala de ventas Maxigafas": { PED: 1500, COT: 2500 },
    "Optimax-Punto de venta Optimax": { PED: 3006, COT: 4006 },
    "Surtiopticas-Punto de venta Surtiopticas": { PED: 5006, COT: 6006 }
};

// Session State
let currentUser = null;
let globalSession = {
    empresa: null,
    sucursal: null,
    centroCosto: null
};

// Modal Flow State
let barcodeProduct = null;
let modalPhase = null;
let tempItem = {};

// DOM Elements
const mainContent = document.getElementById('main-content');
const appHeader = document.getElementById('app-header'); // Asume que header tiene este ID o lo buscamos
const headerTitle = document.getElementById('header-title');

// --- Initialization ---
function init() {
    // Esconder el header al inicio durante el login
    const header = document.querySelector('header');
    if(header) header.style.display = 'none';

    const modalsHtml = `
        <!-- Formulario Inicial Modal -->
        <div class="modal-overlay" id="form-modal">
            <div class="modal-content modal-content-form">
                <div class="modal-title" id="form-modal-title">Registrar Documento</div>
                <div class="form-grid">
                    <div class="form-group"><label class="form-label">Fecha</label><input type="date" class="form-control" id="f-fecha"></div>
                    <div class="form-group"><label class="form-label">Empresa</label><input type="text" class="form-control" id="f-emp" disabled></div>
                    <div class="form-group"><label class="form-label">Sucursal</label><input type="text" class="form-control" id="f-suc" disabled></div>
                    <div class="form-group"><label class="form-label">Centro Costo</label><input type="text" class="form-control" id="f-cc" disabled></div>
                    <div class="form-group"><label class="form-label">Vendedor</label><input type="text" class="form-control" id="f-vend" disabled></div>
                    <div class="form-group"><label class="form-label">Tipo Venta</label><select class="form-control" id="f-tipo"><option>Contado</option><option>Crédito</option></select></div>
                    <div class="form-group"><label class="form-label">Bodega</label><input type="text" class="form-control" id="f-bod" value="Central"></div>
                    <div class="form-group"><label class="form-label">Documento</label><input type="text" class="form-control" id="f-doc" disabled></div>
                    <div class="form-group"><label class="form-label">Lista Precio</label><input type="text" class="form-control" id="f-lp" value="General"></div>
                    <div class="form-group"><label class="form-label">Cond. Pago</label><input type="number" class="form-control" id="f-cond" value="0"></div>
                    <div class="form-group full-width"><label class="form-label">Documento a facturar</label><select class="form-control" id="f-doc-facturar"><option>Remisión</option><option>Factura electrónica</option></select></div>
                    <div class="form-group full-width"><label class="form-label">Tercero</label><input type="text" class="form-control" id="f-ter" placeholder="Nombre o NIT"></div>
                </div>
                <div style="display:flex; gap:0.5rem; margin-top:1rem;">
                    <button class="btn btn-secondary" onclick="closeFormModal()">Cancelar</button>
                    <button class="btn btn-primary" onclick="startDocumentRegistration()">Iniciar Registro</button>
                </div>
            </div>
        </div>

        <!-- Flujo Lector Barras Modal -->
        <div class="modal-overlay" id="flow-modal">
            <div class="modal-content">
                <div class="modal-title" id="flow-modal-title"></div>
                <div class="modal-subtitle" id="flow-modal-subtitle"></div>
                <input type="number" class="modal-input" id="flow-modal-input" autocomplete="off">
                <button class="btn btn-primary" style="width:100%;" onclick="nextModalPhase()">Aceptar <i class="ph ph-check"></i></button>
            </div>
        </div>

        <!-- Logística Modal (Solo Pedidos) -->
        <div class="modal-overlay" id="logistics-modal">
            <div class="modal-content modal-content-form">
                <div class="modal-title" id="log-modal-title">Información Logística</div>
                <div class="form-grid">
                    <div class="form-group full-width">
                        <label class="form-label">Encargado Alistamiento</label>
                        <select class="form-control" id="log-alistamiento">
                            <option value="">Seleccione...</option>
                            <option>Cristian</option><option>Cinthya</option>
                            <option>Felipe</option><option>Juan Pablo</option>
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label class="form-label">Encargado Verificación</label>
                        <select class="form-control" id="log-verificacion">
                            <option value="">Seleccione...</option>
                            <option>Cristian</option><option>Cinthya</option>
                            <option>Felipe</option><option>Juan Pablo</option>
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label class="form-label">Encargado del Transporte</label>
                        <select class="form-control" id="log-transporte" onchange="toggleTransportFields()">
                            <option value="">Seleccione...</option>
                            <option>Vendedor</option>
                            <option>Mensajero</option>
                            <option>Transportadora</option>
                        </select>
                    </div>
                    
                    <div id="transportadora-fields" style="display:none; grid-column: span 2; grid-template-columns: 1fr 1fr; gap:0.75rem;">
                        <div class="form-group">
                            <label class="form-label">Transportadora</label>
                            <select class="form-control" id="log-empresa-transporte">
                                <option value="">Seleccione...</option>
                                <option>Transprensa</option>
                                <option>Interrapidisimo</option>
                                <option>Estelar Express</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Guía</label>
                            <input type="text" class="form-control" id="log-guia">
                        </div>
                    </div>

                    <div class="form-group"><label class="form-label">Fecha Despacho</label><input type="date" class="form-control" id="log-fecha-despacho"></div>
                    <div class="form-group"><label class="form-label">Fecha Entrega Real</label><input type="date" class="form-control" id="log-fecha-entrega"></div>
                    <div class="form-group full-width">
                        <label class="form-label">Novedades</label>
                        <textarea class="form-control" id="log-novedades" rows="3"></textarea>
                    </div>
                </div>
                <div style="display:flex; gap:0.5rem; margin-top:1rem;">
                    <button class="btn btn-secondary" onclick="closeLogisticsModal()">Cancelar</button>
                    <button class="btn btn-primary" onclick="saveLogistics()">Guardar</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalsHtml);
    document.getElementById('transportadora-fields').style.display = 'none';
    
    renderLogin();
}

// --- Auth & Sede Selection ---
window.renderLogin = function() {
    activeView = 'login';
    mainContent.innerHTML = `
        <div class="auth-container">
            <div class="auth-box">
                <i class="ph ph-sunglasses auth-logo"></i>
                <div class="auth-title">MaxiGafas</div>
                <div class="auth-subtitle">Ingresa tus credenciales</div>
                
                <div class="form-group">
                    <label class="form-label">Usuario</label>
                    <input type="text" class="form-control" id="login-user" value="admin">
                </div>
                <div class="form-group">
                    <label class="form-label">Contraseña</label>
                    <input type="password" class="form-control" id="login-pass" value="1234">
                </div>
                
                <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="attemptLogin()">Ingresar</button>
            </div>
        </div>
    `;
}

window.attemptLogin = function() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;

    if(user === 'admin' && pass === '1234') {
        currentUser = 'Administrador';
        renderSedeSelection();
    } else {
        alert('Credenciales incorrectas (Usa admin / 1234)');
    }
}

window.renderSedeSelection = function() {
    activeView = 'sede-selection';
    mainContent.innerHTML = `
        <div class="auth-container">
            <div class="auth-box">
                <div class="auth-title" style="font-size: 1.25rem;">Configuración de Sede</div>
                <div class="auth-subtitle">¿Dónde te encuentras hoy?</div>
                
                <div class="form-group">
                    <label class="form-label">Empresa</label>
                    <select class="form-control" id="sess-emp">
                        <option value="Jose Maria Iglesias">Jose Maria Iglesias</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Sucursal</label>
                    <select class="form-control" id="sess-suc" onchange="updateCentroCostos('sess-suc', 'sess-cc')">
                        <option value="">Seleccione...</option>
                        <option value="Maxigafas">Maxigafas</option>
                        <option value="Optimax">Optimax</option>
                        <option value="Surtiopticas">Surtiopticas</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Centro de Costo</label>
                    <select class="form-control" id="sess-cc">
                        <option value="">Seleccione sucursal primero...</option>
                    </select>
                </div>
                
                <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="confirmSedeSelection()">Iniciar Turno</button>
            </div>
        </div>
    `;
}

window.confirmSedeSelection = function() {
    const emp = document.getElementById('sess-emp').value;
    const suc = document.getElementById('sess-suc').value;
    const cc = document.getElementById('sess-cc').value;

    if(!emp || !suc || !cc) {
        alert("Por favor complete todos los datos de la sede.");
        return;
    }

    globalSession = { empresa: emp, sucursal: suc, centroCosto: cc };
    
    // Mostrar header global
    const header = document.querySelector('header');
    if(header) header.style.display = 'flex';

    renderHome();
}

window.updateCentroCostos = function(sucursalId, ccId) {
    const sucursal = document.getElementById(sucursalId).value;
    const ccSelect = document.getElementById(ccId);
    ccSelect.innerHTML = '';
    
    if (sucursal === 'Maxigafas') {
        ccSelect.innerHTML = '<option value="Punto de venta Maxigafas">Punto de venta Maxigafas</option><option value="Sala de ventas Maxigafas">Sala de ventas Maxigafas</option>';
    } else if (sucursal === 'Optimax') {
        ccSelect.innerHTML = '<option value="Punto de venta Optimax">Punto de venta Optimax</option>';
    } else if (sucursal === 'Surtiopticas') {
        ccSelect.innerHTML = '<option value="Punto de venta Surtiopticas">Punto de venta Surtiopticas</option>';
    } else {
        ccSelect.innerHTML = '<option value="">Seleccione sucursal primero...</option>';
    }
}

// --- Navigation ---
window.updateHeaderTitles = function(title) {
    headerTitle.innerHTML = `
        ${title}
        <div class="session-info">
            <i class="ph ph-map-pin"></i> ${globalSession.sucursal} - ${globalSession.centroCosto} | 
            <i class="ph ph-user"></i> <span>${currentUser}</span>
        </div>
    `;
}

window.renderHome = function() {
    activeView = 'home';
    updateHeaderTitles('Inicio');
    
    mainContent.innerHTML = `
        <div class="module-section">
            <div class="module-header">
                <i class="ph ph-shopping-cart"></i> Módulo Pedidos
            </div>
            <div class="submodule-grid">
                <div class="submodule-card" onclick="openFormModal('PED')">
                    <i class="ph ph-plus-circle"></i>
                    <span>Creación de Pedido</span>
                </div>
                <div class="submodule-card" onclick="renderList('PED')">
                    <i class="ph ph-list-magnifying-glass"></i>
                    <span>Consulta de Pedidos</span>
                </div>
            </div>
        </div>

        <div class="module-section">
            <div class="module-header">
                <i class="ph ph-receipt"></i> Módulo Cotizaciones
            </div>
            <div class="submodule-grid">
                <div class="submodule-card" onclick="openFormModal('COT')">
                    <i class="ph ph-plus-circle"></i>
                    <span>Creación de Cotización</span>
                </div>
                <div class="submodule-card" onclick="renderList('COT')">
                    <i class="ph ph-list-bullets"></i>
                    <span>Consulta de Cotizaciones</span>
                </div>
            </div>
        </div>
    `;
}

// --- Form Modal Logic ---
window.openFormModal = function(type) {
    formType = type;
    const key = `${globalSession.sucursal}-${globalSession.centroCosto}`;
    if (!branchCounters[key]) branchCounters[key] = { PED: 1, COT: 1 };
    
    const consecutivo = formType === 'PED' ? `PED-${branchCounters[key].PED}` : `COT-${branchCounters[key].COT}`;
    document.getElementById('form-modal-title').innerText = formType === 'PED' ? 'Formulario de Pedido' : 'Formulario de Cotización';
    
    // Llenar directamente desde la sesión global
    document.getElementById('f-emp').value = globalSession.empresa;
    document.getElementById('f-suc').value = globalSession.sucursal;
    document.getElementById('f-cc').value = globalSession.centroCosto;
    document.getElementById('f-vend').value = currentUser; // Asignar el vendedor bloqueado al user logueado

    document.getElementById('f-fecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('f-doc').value = consecutivo;
    document.getElementById('f-ter').value = '';
    
    document.getElementById('form-modal').classList.add('active');
}

window.closeFormModal = function() {
    document.getElementById('form-modal').classList.remove('active');
}

window.startDocumentRegistration = function() {
    currentDocument = {
        type: formType,
        consecutive: document.getElementById('f-doc').value,
        date: document.getElementById('f-fecha').value,
        empresa: document.getElementById('f-emp').value,
        sucursal: document.getElementById('f-suc').value,
        centroCosto: document.getElementById('f-cc').value,
        vendedor: document.getElementById('f-vend').value,
        tipoVenta: document.getElementById('f-tipo').value,
        bodega: document.getElementById('f-bod').value,
        listaPrecio: document.getElementById('f-lp').value,
        condicionPago: document.getElementById('f-cond').value,
        documentoFacturar: document.getElementById('f-doc-facturar').value,
        tercero: document.getElementById('f-ter').value || 'Consumidor Final',
        items: [],
        globalDiscount: 0
    };
    closeFormModal();
    renderDocumentView();
}

// --- Document View (Fixed Info + Search + Table) ---
window.renderDocumentView = function() {
    activeView = 'documento';
    const isPED = currentDocument.type === 'PED';
    updateHeaderTitles(isPED ? 'Crear Pedido' : 'Crear Cotización');
    
    let html = `
        <div class="fixed-info-banner">
            <div class="doc-number">${currentDocument.consecutive} - ${currentDocument.tercero}</div>
            <div>Bodega: ${currentDocument.bodega}</div>
        </div>

        <div class="search-box">
            <i class="ph ph-magnifying-glass"></i>
            <input type="text" id="barcode-search" placeholder="Escriba referencia o escanee..." autofocus>
            <i class="ph ph-barcode" onclick="document.getElementById('barcode-search').value='REF001'; handleBarcodeScan({target:document.getElementById('barcode-search')});"></i>
        </div>

        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>N°</th>
                        <th>Referencia</th>
                        <th>Cant</th>
                        <th>Precio lista</th>
                        <th>Dcto</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${currentDocument.items.length === 0 ? '<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Aún no hay referencias agregadas</td></tr>' : ''}
                    ${currentDocument.items.map((item, i) => {
                        const sub = item.qty * item.price * (1 - item.discount/100);
                        const fmt = (num) => '$' + Math.round(num).toLocaleString('es-CO');
                        return `
                        <tr>
                            <td>${i+1}</td>
                            <td>${item.id}</td>
                            <td>${item.qty}</td>
                            <td>${fmt(item.price)}</td>
                            <td>${item.discount}%</td>
                            <td>${fmt(sub)}</td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="bottom-bar">
            <div class="left-actions">
                <i class="ph ph-arrow-left arrow-regresar" onclick="renderHome()"></i>
            </div>
            <div class="right-actions">
                <button class="btn btn-primary" onclick="renderSummary()">Siguiente <i class="ph ph-arrow-right"></i></button>
            </div>
        </div>
    `;
    mainContent.innerHTML = html;
    
    const searchInput = document.getElementById('barcode-search');
    if(searchInput) {
        searchInput.addEventListener('change', handleBarcodeScan);
        setTimeout(() => searchInput.focus(), 100);
    }
}

// --- Interactive Data Entry Flow ---
window.handleBarcodeScan = function(e) {
    const query = e.target.value.toUpperCase().trim();
    if(!query) return;
    
    const product = INVENTORY.find(p => p.id === query);
    if(product) {
        barcodeProduct = product;
        modalPhase = 'qty';
        openFlowModal();
    } else {
        alert("Referencia no encontrada.");
    }
    e.target.value = ''; 
}

function openFlowModal() {
    const title = document.getElementById('flow-modal-title');
    const sub = document.getElementById('flow-modal-subtitle');
    const input = document.getElementById('flow-modal-input');
    
    document.getElementById('flow-modal').classList.add('active');
    
    if (modalPhase === 'qty') {
        title.innerText = "Indicar Cantidad";
        sub.innerText = `Disp. en bodega: ${barcodeProduct.stock} unds`;
        input.value = "1";
    } else if (modalPhase === 'price') {
        title.innerText = "Ingresar Precio";
        sub.innerText = "Predeterminado editable";
        input.value = barcodeProduct.listPrice;
    } else if (modalPhase === 'discount') {
        title.innerText = "Ingresar Descuento %";
        sub.innerText = "Predeterminado 0%";
        input.value = "0";
    }
    setTimeout(() => {
        input.focus();
        input.select();
    }, 100);
}

window.nextModalPhase = function() {
    const input = document.getElementById('flow-modal-input');
    const val = parseFloat(input.value) || 0;
    
    if (modalPhase === 'qty') {
        if(val <= 0) return;
        if(val > barcodeProduct.stock) {
            alert(`Solo hay ${barcodeProduct.stock} unidades disponibles.`);
            return;
        }
        tempItem = { id: barcodeProduct.id, qty: val };
        modalPhase = 'price';
        openFlowModal();
    } 
    else if (modalPhase === 'price') {
        tempItem.price = val;
        modalPhase = 'discount';
        openFlowModal();
    } 
    else if (modalPhase === 'discount') {
        tempItem.discount = val;
        currentDocument.items.push(tempItem);
        document.getElementById('flow-modal').classList.remove('active');
        renderDocumentView(); 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('keyup', (e) => {
        if (e.key === 'Enter' && document.getElementById('flow-modal').classList.contains('active')) {
            nextModalPhase();
        }
    });
});

// --- Summary View ---
window.renderSummary = function() {
    activeView = 'resumen';
    updateHeaderTitles('Resumen');
    
    let bruto = 0, descuentos = 0, items = 0;
    currentDocument.items.forEach(i => {
        const lineBruto = i.qty * i.price;
        const lineDcto = lineBruto * (i.discount/100);
        bruto += lineBruto;
        descuentos += lineDcto;
        items += i.qty;
    });
    const subtotal = bruto - descuentos;
    
    const dctoGlobalMonto = subtotal * (currentDocument.globalDiscount/100);
    const base = subtotal - dctoGlobalMonto;
    
    let iva = 0;
    if (currentDocument.documentoFacturar === 'Factura electrónica') {
        iva = base * 0.19;
    }
    
    const neto = base + iva;

    const isPED = currentDocument.type === 'PED';

    const fmt = (num) => '$' + Math.round(num).toLocaleString('es-CO');

    mainContent.innerHTML = `
        <div class="fixed-info-banner" style="background:var(--bg-surface); border-left:4px solid var(--text-muted); color:var(--text-main);">
            <div class="doc-number">${currentDocument.consecutive} - ${currentDocument.tercero}</div>
        </div>

        <div class="summary-container">
            <div class="summary-row"><span>Número de Items:</span><span>${items}</span></div>
            <div class="summary-row"><span>Valor Bruto:</span><span>${fmt(bruto)}</span></div>
            <div class="summary-row"><span>Subtotal (Línea):</span><span>${fmt(subtotal)}</span></div>
            
            <div class="discount-box">
                <span style="font-weight:600; font-size: 0.95rem;">Descuento Global (%)</span>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                    <input type="number" id="inp-global" value="${currentDocument.globalDiscount}" min="0" max="100">
                    <button class="btn btn-secondary" style="padding:0.4rem 1rem;" onclick="applyGlobalDcto()">Aplicar</button>
                </div>
            </div>

            <div class="summary-row"><span>IVA (19%):</span><span>${fmt(iva)}</span></div>
            <div class="summary-row large"><span>Valor Neto:</span><span>${fmt(neto)}</span></div>
        </div>

        <div class="bottom-bar">
            <div class="left-actions">
            </div>
            <div class="right-actions" style="display:flex; gap:0.5rem;">
                <button class="btn btn-secondary" onclick="renderDocumentView()">Regresar</button>
                <button class="btn btn-danger" onclick="renderHome()">Cancelar</button>
                <button class="btn btn-primary" onclick="saveDocument(${neto})">
                    ${isPED ? 'Pasar a Facturación' : 'Pasar a Pedidos'}
                </button>
            </div>
        </div>
    `;
}

window.applyGlobalDcto = function() {
    const inputVal = parseFloat(document.getElementById('inp-global').value) || 0;
    currentDocument.globalDiscount = inputVal;
    renderSummary();
}

window.saveDocument = function(netoTotal) {
    if(currentDocument.items.length === 0) {
        alert("El documento está vacío.");
        return;
    }
    
    currentDocument.total = netoTotal;
    currentDocument.customer = currentDocument.tercero;
    
    const db = currentDocument.type === 'PED' ? ordersDB : quotesDB;
    const existingIndex = db.findIndex(d => d.consecutive === currentDocument.consecutive);
    
    if (existingIndex >= 0) {
        db[existingIndex] = currentDocument;
        alert("Documento actualizado exitosamente.");
    } else {
        currentDocument.status = 'pendiente';
        currentDocument.logistica = {};
        db.unshift(currentDocument);
        
        const key = `${currentDocument.sucursal}-${currentDocument.centroCosto}`;
        if(currentDocument.type === 'PED') {
            branchCounters[key].PED++;
            alert(`Pedido guardado.\nTurno para facturación: T-${Math.floor(Math.random()*100)}`);
        } else {
            branchCounters[key].COT++;
            alert("Cotización guardada exitosamente.");
        }
    }
    
    renderList(currentDocument.type);
}

// --- List View & Logistics Logic ---
window.renderList = function(type) {
    activeView = 'listado';
    const isPED = type === 'PED';
    updateHeaderTitles(isPED ? 'Consulta de Pedidos' : 'Consulta de Cotizaciones');
    
    const db = isPED ? ordersDB : quotesDB;

    // Filtrar BD usando ÚNICAMENTE la sesión global actual
    const filteredDB = db.filter(doc => {
        if (doc.empresa !== globalSession.empresa) return false;
        if (doc.sucursal !== globalSession.sucursal) return false;
        if (doc.centroCosto !== globalSession.centroCosto) return false;
        return true;
    });

    let html = `
        <div class="card">
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Documento</th>
                            <th>Fecha</th>
                            <th>Tercero</th>
                            ${isPED ? '<th>Estado del pedido</th>' : ''}
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredDB.map(doc => {
                            const rowClass = isPED ? `estado-${doc.status}` : '';
                            return `
                            <tr class="${rowClass}">
                                <td><strong>${doc.consecutive}</strong></td>
                                <td>${doc.date}</td>
                                <td>${doc.customer}</td>
                                ${isPED ? `
                                <td>
                                    <select class="select-estado estado-pill-${doc.status}" onchange="changeStatus('${doc.consecutive}', this.value)">
                                        <option value="pendiente" ${doc.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                                        <option value="alistamiento" ${doc.status === 'alistamiento' ? 'selected' : ''}>Alistamiento</option>
                                        <option value="verificacion" ${doc.status === 'verificacion' ? 'selected' : ''}>Verificación</option>
                                        <option value="transporte" ${doc.status === 'transporte' ? 'selected' : ''}>Transporte</option>
                                        <option value="entregado" ${doc.status === 'entregado' ? 'selected' : ''}>Entregado</option>
                                        <option value="novedad" ${doc.status === 'novedad' ? 'selected' : ''}>Novedad</option>
                                        <option value="facturado" ${doc.status === 'facturado' ? 'selected' : ''}>Facturado</option>
                                    </select>
                                </td>
                                ` : ''}
                                <td>
                                    ${isPED ? `<button class="icon-btn" title="Facturar" onclick="changeStatus('${doc.consecutive}', 'facturado')"><i class="ph ph-currency-dollar"></i></button>` : ''}
                                    ${isPED ? `<button class="icon-btn" title="Logística" onclick="openLogisticsModal('${doc.consecutive}')"><i class="ph ph-package"></i></button>` : ''}
                                    <button class="icon-btn" title="Modificar" onclick="editDocument('${doc.consecutive}', '${isPED ? 'PED' : 'COT'}')"><i class="ph ph-pencil-simple"></i></button>
                                    <button class="icon-btn" title="Imprimir"><i class="ph ph-printer"></i></button>
                                </td>
                            </tr>
                            `;
                        }).join('')}
                        ${filteredDB.length === 0 ? `<tr><td colspan="${isPED ? 5 : 4}" style="text-align:center; padding: 2rem;">No hay documentos para ${globalSession.sucursal} - ${globalSession.centroCosto}</td></tr>` : ''}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="bottom-bar">
            <div class="left-actions">
                <i class="ph ph-arrow-left arrow-regresar" onclick="renderHome()"></i>
                <span style="font-weight:600; cursor:pointer;" onclick="renderHome()">Volver al Inicio</span>
            </div>
        </div>
    `;
    mainContent.innerHTML = html;
}

window.editDocument = function(consecutive, type) {
    const db = type === 'PED' ? ordersDB : quotesDB;
    const doc = db.find(d => d.consecutive === consecutive);
    if (!doc) return;
    
    // Clonar para editar sin afectar inmediatamente la tabla
    currentDocument = JSON.parse(JSON.stringify(doc));
    currentDocument.type = type;
    
    // Rellenar propiedades vacías en datos de prueba antiguos
    if (!currentDocument.items) currentDocument.items = [];
    if (currentDocument.globalDiscount === undefined) currentDocument.globalDiscount = 0;
    if (!currentDocument.tercero) currentDocument.tercero = currentDocument.customer || 'Consumidor Final';
    if (!currentDocument.vendedor) currentDocument.vendedor = currentUser || 'Admin';
    if (!currentDocument.bodega) currentDocument.bodega = 'Central';
    if (!currentDocument.documentoFacturar) currentDocument.documentoFacturar = 'Remisión';
    
    renderDocumentView();
}

window.changeStatus = function(consecutive, newStatus) {
    const order = ordersDB.find(o => o.consecutive === consecutive);
    if(order) {
        order.status = newStatus;
        if(activeView === 'listado') {
            renderList('PED'); 
        }
    }
}

// Logistics Modal Logic
window.toggleTransportFields = function() {
    const transportType = document.getElementById('log-transporte').value;
    const fields = document.getElementById('transportadora-fields');
    if(transportType === 'Transportadora') {
        fields.style.display = 'grid'; 
    } else {
        fields.style.display = 'none';
        document.getElementById('log-empresa-transporte').value = '';
        document.getElementById('log-guia').value = '';
    }
}

window.openLogisticsModal = function(consecutive) {
    const order = ordersDB.find(o => o.consecutive === consecutive);
    if(!order) return;
    
    currentLogisticsOrder = order;
    document.getElementById('log-modal-title').innerText = `Logística - ${order.consecutive}`;
    
    const log = order.logistica || {};
    document.getElementById('log-alistamiento').value = log.alistamiento || '';
    document.getElementById('log-verificacion').value = log.verificacion || '';
    document.getElementById('log-transporte').value = log.transporte || '';
    document.getElementById('log-empresa-transporte').value = log.empresaTransporte || '';
    document.getElementById('log-guia').value = log.guia || '';
    document.getElementById('log-fecha-despacho').value = log.fechaDespacho || '';
    document.getElementById('log-fecha-entrega').value = log.fechaEntrega || '';
    document.getElementById('log-novedades').value = log.novedades || '';
    
    toggleTransportFields();
    document.getElementById('logistics-modal').classList.add('active');
}

window.closeLogisticsModal = function() {
    document.getElementById('logistics-modal').classList.remove('active');
    currentLogisticsOrder = null;
}

window.saveLogistics = function() {
    if(!currentLogisticsOrder) return;
    
    const log = {
        alistamiento: document.getElementById('log-alistamiento').value,
        verificacion: document.getElementById('log-verificacion').value,
        transporte: document.getElementById('log-transporte').value,
        empresaTransporte: document.getElementById('log-empresa-transporte').value,
        guia: document.getElementById('log-guia').value,
        fechaDespacho: document.getElementById('log-fecha-despacho').value,
        fechaEntrega: document.getElementById('log-fecha-entrega').value,
        novedades: document.getElementById('log-novedades').value,
    };
    
    currentLogisticsOrder.logistica = log;
    
    let statusChanged = false;
    if(currentLogisticsOrder.status !== 'facturado') {
        if (log.fechaEntrega) {
            currentLogisticsOrder.status = 'entregado';
            statusChanged = true;
        } else if (log.fechaDespacho) {
            currentLogisticsOrder.status = 'transporte';
            statusChanged = true;
        }
    }
    
    closeLogisticsModal();
    renderList('PED'); 
    
    if (statusChanged) {
        alert("Estado del pedido actualizado automáticamente basado en las fechas.");
    }
}

window.onload = init;
