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
    { consecutive: 'PED-1001', date: '2026-06-20', customer: 'Juan Perez', total: 120000 },
    { consecutive: 'PED-1002', date: '2026-06-21', customer: 'Maria Gomez', total: 45000 },
    { consecutive: 'PED-1003', date: '2026-06-22', customer: 'Carlos Ruiz', total: 25000 },
    { consecutive: 'PED-1004', date: '2026-06-23', customer: 'Ana Lopez', total: 210000 },
    { consecutive: 'PED-1005', date: '2026-06-24', customer: 'Consumidor Final', total: 35000 }
];

let quotesDB = [
    { consecutive: 'COT-2001', date: '2026-06-20', customer: 'Empresa XYZ', total: 240000 },
    { consecutive: 'COT-2002', date: '2026-06-21', customer: 'Colegio ABC', total: 90000 },
    { consecutive: 'COT-2003', date: '2026-06-22', customer: 'Luis Fernando', total: 50000 },
    { consecutive: 'COT-2004', date: '2026-06-23', customer: 'Optica Sur', total: 420000 },
    { consecutive: 'COT-2005', date: '2026-06-24', customer: 'Cliente Frecuente', total: 70000 }
];

// Global State
let activeView = 'home'; // home, documento, resumen, listado
let formType = null; // 'PED', 'COT'

let currentDocument = null;
let currentOrderConsecutive = 1006;
let currentQuoteConsecutive = 2006;

// Modal Flow State
let barcodeProduct = null;
let modalPhase = null; // 'qty', 'price', 'discount'
let tempItem = {}; // stores temp input before adding to cart

// DOM Elements
const mainContent = document.getElementById('main-content');

// --- Initialization ---
function init() {
    // Add Modals to document body
    const modalsHtml = `
        <!-- Formulario Inicial Modal -->
        <div class="modal-overlay" id="form-modal">
            <div class="modal-content modal-content-form">
                <div class="modal-title" id="form-modal-title">Registrar Documento</div>
                <div class="form-grid">
                    <div class="form-group"><label class="form-label">Fecha</label><input type="date" class="form-control" id="f-fecha"></div>
                    <div class="form-group"><label class="form-label">Empresa</label><input type="text" class="form-control" id="f-emp" value="MaxiGafas"></div>
                    <div class="form-group"><label class="form-label">Sucursal</label><input type="text" class="form-control" id="f-suc" value="Principal"></div>
                    <div class="form-group"><label class="form-label">Centro Costo</label><input type="text" class="form-control" id="f-cc" value="Ventas"></div>
                    <div class="form-group"><label class="form-label">Vendedor</label><input type="text" class="form-control" id="f-vend" value="Juan"></div>
                    <div class="form-group"><label class="form-label">Tipo Venta</label><select class="form-control" id="f-tipo"><option>Contado</option><option>Crédito</option></select></div>
                    <div class="form-group"><label class="form-label">Bodega</label><input type="text" class="form-control" id="f-bod" value="Central"></div>
                    <div class="form-group"><label class="form-label">Documento</label><input type="text" class="form-control" id="f-doc" disabled></div>
                    <div class="form-group"><label class="form-label">Lista Precio</label><input type="text" class="form-control" id="f-lp" value="General"></div>
                    <div class="form-group"><label class="form-label">Cond. Pago</label><input type="number" class="form-control" id="f-cond" value="0"></div>
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
    `;
    document.body.insertAdjacentHTML('beforeend', modalsHtml);
    renderHome();
}

// --- Navigation ---
window.renderHome = function() {
    activeView = 'home';
    document.getElementById('header-title').innerText = 'MaxiGafas App';
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
    const consecutivo = type === 'PED' ? `PED-${currentOrderConsecutive}` : `COT-${currentQuoteConsecutive}`;
    document.getElementById('form-modal-title').innerText = type === 'PED' ? 'Formulario de Pedido' : 'Formulario de Cotización';
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
    document.getElementById('header-title').innerText = isPED ? 'Crear Pedido' : 'Crear Cotización';
    
    let html = `
        <!-- Información Fija -->
        <div class="fixed-info-banner">
            <div class="doc-number">${currentDocument.consecutive} - ${currentDocument.tercero}</div>
            <div>Vendedor: ${currentDocument.vendedor} | Bodega: ${currentDocument.bodega}</div>
        </div>

        <!-- Buscador -->
        <div class="search-box">
            <i class="ph ph-magnifying-glass"></i>
            <input type="text" id="barcode-search" placeholder="Escriba referencia o escanee..." autofocus>
            <i class="ph ph-barcode" onclick="document.getElementById('barcode-search').value='REF001'; handleBarcodeScan({target:document.getElementById('barcode-search')});"></i>
        </div>

        <!-- Tabla -->
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
                        return `
                        <tr>
                            <td>${i+1}</td>
                            <td>${item.id}</td>
                            <td>${item.qty}</td>
                            <td>$${item.price}</td>
                            <td>${item.discount}%</td>
                            <td>$${sub.toFixed(2)}</td>
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
    
    // Bind search event
    const searchInput = document.getElementById('barcode-search');
    if(searchInput) {
        searchInput.addEventListener('change', handleBarcodeScan);
        // focus the input for easy scanning
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
        // Add to items array
        currentDocument.items.push(tempItem);
        document.getElementById('flow-modal').classList.remove('active');
        renderDocumentView(); // Refresh table
    }
}

// Bind enter key on flow modal input
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
    document.getElementById('header-title').innerText = 'Resumen';
    
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
    const iva = base * 0.19;
    const neto = base + iva;

    const isPED = currentDocument.type === 'PED';

    mainContent.innerHTML = `
        <div class="fixed-info-banner" style="background:#F3F4F6; border-left:4px solid var(--text-muted); color:var(--text-main);">
            <div class="doc-number">${currentDocument.consecutive} - ${currentDocument.tercero}</div>
        </div>

        <div class="summary-container">
            <div class="summary-row"><span>Número de Items:</span><span>${items}</span></div>
            <div class="summary-row"><span>Valor Bruto:</span><span>$${bruto.toFixed(2)}</span></div>
            <div class="summary-row"><span>Subtotal (Línea):</span><span>$${subtotal.toFixed(2)}</span></div>
            
            <div class="summary-row" style="align-items:center; margin-top:1rem;">
                <span>% Dcto Global:</span>
                <input type="number" id="inp-global" value="${currentDocument.globalDiscount}" style="width:60px; padding:0.25rem; color:black; border-radius:4px; border:none; text-align:center;">
            </div>
            <div style="text-align:right; margin-bottom: 1rem;">
                <button class="btn btn-secondary" style="font-size:0.75rem; padding:0.25rem 0.5rem; display:inline-block;" onclick="applyGlobalDcto()">Aplicar Descuento Global</button>
            </div>

            <div class="summary-row"><span>IVA:</span><span>$${iva.toFixed(2)}</span></div>
            <div class="summary-row large"><span>Valor Neto:</span><span>$${neto.toFixed(2)}</span></div>
        </div>

        <div class="bottom-bar">
            <div class="left-actions">
                <i class="ph ph-arrow-left arrow-regresar" onclick="renderDocumentView()"></i> 
            </div>
            <div class="right-actions">
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
    
    const docToSave = {
        consecutive: currentDocument.consecutive,
        date: currentDocument.date,
        customer: currentDocument.tercero,
        total: netoTotal
    };

    if(currentDocument.type === 'PED') {
        ordersDB.push(docToSave);
        currentOrderConsecutive++;
        alert(`Pedido guardado.\nTurno para facturación: T-${Math.floor(Math.random()*100)}`);
    } else {
        quotesDB.push(docToSave);
        currentQuoteConsecutive++;
        alert("Cotización guardada exitosamente.");
    }
    
    renderList(currentDocument.type);
}

// --- List View ---
window.renderList = function(type) {
    activeView = 'listado';
    const isPED = type === 'PED';
    document.getElementById('header-title').innerText = isPED ? 'Consulta de Pedidos' : 'Consulta de Cotizaciones';
    const db = isPED ? ordersDB : quotesDB;

    mainContent.innerHTML = `
        <div class="card">
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Documento</th>
                            <th>Fecha</th>
                            <th>Tercero</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${db.map(doc => `
                            <tr>
                                <td><strong>${doc.consecutive}</strong></td>
                                <td>${doc.date}</td>
                                <td>${doc.customer}</td>
                                <td>
                                    <button class="icon-btn"><i class="ph ph-pencil-simple"></i></button>
                                    <button class="icon-btn"><i class="ph ph-printer"></i></button>
                                </td>
                            </tr>
                        `).join('')}
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
}

window.onload = init;
