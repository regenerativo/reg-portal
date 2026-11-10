// Finanzas de regenerativo: ingresos, gastos y presupuesto de la empresa. Solo perfil de facturación.
import * as D from './datos.js';
import { cop, fecha, iso } from './formato.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const C_ING = '#0090B0', C_GAS = '#C0603A';   // par validado (CVD y contraste)
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const mesDe = f => f.slice(0, 7);
const compacto = n => n >= 1e6 ? (n / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' M' : n >= 1e3 ? Math.round(n / 1e3) + ' mil' : String(Math.round(n));

export async function vistaFinanzas(mesSel) {
  const [cats, movs, encargos, docs] = await Promise.all([D.finCategorias(), D.finMovimientos(), D.encargos(), D.finDocumentosCobro()]);
  const hoy = new Date();
  const mes = mesSel && /^\d{4}-\d{2}$/.test(mesSel) ? mesSel : iso(hoy).slice(0, 7);
  const [a, m] = mes.split('-').map(Number);
  const mesTxt = `${MESES[m - 1]} ${a}`;
  const delMes = movs.filter(x => mesDe(x.fecha) === mes);
  const suma = (l, t) => l.filter(x => x.tipo === t).reduce((s, x) => s + Number(x.valor), 0);
  const ing = suma(delMes, 'ingreso'), gas = suma(delMes, 'gasto');

  // Por cobrar: plan de pagos de la propuesta + adendas aprobadas, menos ingresos registrados por encargo
  const porEnc = encargos.map(e => {
    const prop = docs.filter(d => d.encargo_id === e.id && d.tipo === 'propuesta' && ['aprobado', 'firmado'].includes(d.estado)).at(-1);
    const adds = docs.filter(d => d.encargo_id === e.id && d.tipo === 'adenda' && ['aprobado', 'firmado'].includes(d.estado));
    const esperado = (prop?.contenido?.honorarios || 0) + adds.reduce((s, d) => s + (d.contenido.valor || 0), 0);
    const recibido = suma(movs.filter(x => x.encargo_id === e.id), 'ingreso');
    const gastos = suma(movs.filter(x => x.encargo_id === e.id), 'gasto');
    return { e, esperado, recibido, gastos, porCobrar: Math.max(0, esperado - recibido), neto: recibido - gastos };
  }).filter(r => r.esperado || r.recibido || r.gastos);
  const porCobrar = porEnc.reduce((s, r) => s + r.porCobrar, 0);

  // Últimos 6 meses
  const meses = Array.from({ length: 6 }, (_, i) => { const d = new Date(a, m - 1 - (5 - i), 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; });
  const serie = meses.map(k => ({ k, ing: suma(movs.filter(x => mesDe(x.fecha) === k), 'ingreso'), gas: suma(movs.filter(x => mesDe(x.fecha) === k), 'gasto') }));

  // Presupuesto por categoría (gastos del mes)
  const catsGasto = cats.filter(c => c.tipo === 'gasto').map(c => ({ ...c, gastado: delMes.filter(x => x.categoria_id === c.id).reduce((s, x) => s + Number(x.valor), 0) }));
  const presTotal = catsGasto.reduce((s, c) => s + Number(c.presupuesto_mensual || 0), 0);
  const ejemplos = movs.some(x => x.ejemplo);
  const prev = new Date(a, m - 2, 1), next = new Date(a, m, 1);
  const k = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  const html = `
    ${ejemplos ? `<div class="aviso-ej">Hay movimientos de ejemplo para que veas cómo funciona. <button class="btn sec mini" id="borrar-ej">Borrar ejemplos</button></div>` : ''}
    <div class="barra-doc">
      <div class="mes-nav"><a class="btn sec mini" href="#/finanzas/${k(prev)}">‹</a><b>${mesTxt}</b><a class="btn sec mini" href="#/finanzas/${k(next)}">›</a></div>
      <div class="barra-acc"><button class="btn mini" data-nuevo="ingreso">+ Ingreso</button><button class="btn sec mini" data-nuevo="gasto">+ Gasto</button></div>
    </div>
    <div class="kpis">
      <div class="kpi"><div class="et">Ingresos del mes</div><div class="va">${cop(ing)}</div></div>
      <div class="kpi"><div class="et">Gastos del mes</div><div class="va">${cop(gas)}</div><div class="su">${presTotal ? `de ${cop(presTotal)} presupuestados` : ''}</div>${presTotal ? `<div class="barra"><i style="width:${Math.min(100, gas / presTotal * 100)}%;background:${gas > presTotal ? 'var(--vino)' : C_ING}"></i></div>` : ''}</div>
      <div class="kpi"><div class="et">Balance del mes</div><div class="va">${cop(ing - gas)}</div><div class="su">${ing - gas >= 0 ? 'Entró más de lo que salió' : 'Salió más de lo que entró'}</div></div>
      <div class="kpi"><div class="et">Por cobrar</div><div class="va">${cop(porCobrar)}</div><div class="su">Propuestas y adendas aprobadas</div></div>
    </div>
    <div class="dos">
      <section class="panel"><h3>Ingresos y gastos · últimos 6 meses</h3>${barras(serie)}</section>
      <section class="panel"><h3>Presupuesto de gastos · ${mesTxt}</h3>
        <div class="pres-cats">${catsGasto.map(c => {
          const p = Number(c.presupuesto_mensual || 0), pctu = p ? c.gastado / p : 0, exc = p && c.gastado > p;
          return `<div class="pc"><div class="pc-fila"><span class="pc-ico">${esc(c.icono || '•')}</span><span class="pc-nom">${esc(c.nombre)}</span>
            <span class="pc-val">${cop(c.gastado)}${p ? ` <span class="sub">/ ${compacto(p)}</span>` : ''}</span></div>
            ${p ? `<div class="barra"><i style="width:${Math.min(100, pctu * 100)}%;background:${exc ? 'var(--vino)' : C_ING}"></i></div>${exc ? `<div class="pc-exc">▲ Excedido por ${cop(c.gastado - p)}</div>` : ''}` : `<div class="sub">Sin presupuesto · <a href="#" data-pres="${c.id}">asignar</a></div>`}</div>`;
        }).join('')}</div>
        <p class="sub" style="margin-top:10px"><a href="#" id="editar-pres">Editar presupuesto mensual por categoría</a></p></section>
    </div>
    <section class="panel" style="margin-top:20px"><h3>Por encargo</h3>
      ${porEnc.length ? `<div class="tabla-cont"><table><thead><tr><th>Encargo</th><th class="num">Valor acordado</th><th class="num">Recibido</th><th class="num">Por cobrar</th><th class="num col-opc">Gastos</th><th class="num col-opc">Neto</th></tr></thead><tbody>
      ${porEnc.map(r => `<tr><td><b>${esc(r.e.nombre)}</b><div class="sub">${esc(r.e.codigo)}</div></td><td class="num">${cop(r.esperado)}</td><td class="num">${cop(r.recibido)}</td><td class="num">${cop(r.porCobrar)}</td><td class="num col-opc">${cop(r.gastos)}</td><td class="num col-opc">${cop(r.neto)}</td></tr>`).join('')}
      </tbody></table></div>` : '<div class="vacio">Todavía no hay movimientos asociados a encargos.</div>'}</section>
    <section class="panel" style="margin-top:20px"><h3>Movimientos de ${mesTxt}</h3>
      ${delMes.length ? `<div class="tabla-cont"><table><thead><tr><th>Fecha</th><th>Concepto</th><th class="col-opc">Categoría</th><th class="col-opc">Encargo</th><th class="num">Valor</th><th></th></tr></thead><tbody>
      ${delMes.map(x => `<tr><td>${fecha(x.fecha)}</td><td>${esc(x.descripcion || '')}<div class="sub">${esc(x.medio || '')}</div></td><td class="col-opc">${esc(x.categoria?.icono || '')} ${esc(x.categoria?.nombre || '')}</td>
        <td class="col-opc sub">${x.encargo ? esc(x.encargo.nombre) : 'Regenerativo'}</td>
        <td class="num" style="color:${x.tipo === 'ingreso' ? C_ING : 'var(--negro)'}">${x.tipo === 'ingreso' ? '+' : '−'} ${cop(x.valor)}</td>
        <td class="acciones-fila"><button class="btn sec mini" data-editar="${x.id}">Editar</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="vacio">No hay movimientos este mes.</div>'}</section>`;

  return { html, montar: recargar => {
    document.querySelectorAll('[data-nuevo]').forEach(b => b.onclick = () => modalMov({ tipo: b.dataset.nuevo, fecha: iso(new Date()) }, cats, encargos, recargar));
    document.querySelectorAll('[data-editar]').forEach(b => b.onclick = () => modalMov(movs.find(x => x.id === b.dataset.editar), cats, encargos, recargar));
    const be = $('#borrar-ej'); if (be) be.onclick = async () => { if (confirm('¿Borrar todos los movimientos de ejemplo?')) { await D.finBorrarEjemplos(); recargar(); } };
    const ep = () => modalPresupuesto(cats.filter(c => c.tipo === 'gasto'), recargar);
    $('#editar-pres').onclick = ev => { ev.preventDefault(); ep(); };
    document.querySelectorAll('[data-pres]').forEach(x => x.onclick = ev => { ev.preventDefault(); ep(); });
    document.querySelectorAll('.g-col').forEach(col => {
      col.onmouseenter = () => { const t = $('#tip-fin'); t.innerHTML = col.dataset.tip; t.style.display = 'block'; };
      col.onmousemove = ev => { const t = $('#tip-fin'), r = col.closest('.graf').getBoundingClientRect(); t.style.left = (ev.clientX - r.left + 12) + 'px'; t.style.top = (ev.clientY - r.top - 10) + 'px'; };
      col.onmouseleave = () => { $('#tip-fin').style.display = 'none'; };
    });
  } };
}

function barras(serie) {
  const max = Math.max(1, ...serie.flatMap(s => [s.ing, s.gas]));
  const H = 180;
  return `<div class="graf">
    <div class="leyenda-fin"><span><i style="background:${C_ING}"></i>Ingresos</span><span><i style="background:${C_GAS}"></i>Gastos</span></div>
    <div class="graf-area" style="height:${H + 26}px">
      ${[0.5, 1].map(f => `<div class="graf-guia" style="bottom:${26 + H * f}px"><span>${compacto(max * f)}</span></div>`).join('')}
      <div class="graf-cols">${serie.map(s => {
        const [y, mm] = s.k.split('-').map(Number);
        return `<div class="g-col" data-tip="<b>${MESES[mm - 1]} ${y}</b><br>Ingresos ${cop(s.ing)}<br>Gastos ${cop(s.gas)}<br>Balance ${cop(s.ing - s.gas)}">
          <div class="g-par" style="height:${H}px"><span style="height:${s.ing / max * H}px;background:${C_ING}"></span><span style="height:${s.gas / max * H}px;background:${C_GAS}"></span></div>
          <div class="g-mes">${MESES[mm - 1].slice(0, 3)}</div></div>`;
      }).join('')}</div>
      <div id="tip-fin" class="tip-fin"></div>
    </div></div>`;
}

function modalMov(m, cats, encargos, recargar) {
  const fondo = document.createElement('div'); fondo.className = 'modal-fondo';
  const opsCat = t => cats.filter(c => c.tipo === t).map(c => `<option value="${c.id}" ${c.id === m.categoria_id ? 'selected' : ''}>${esc(c.icono || '')} ${esc(c.nombre)}</option>`).join('');
  fondo.innerHTML = `<form class="modal" id="fm">
    <h2>${m.id ? 'Editar' : 'Nuevo'} ${m.tipo === 'ingreso' ? 'ingreso' : 'gasto'}</h2>
    <div class="grilla-form">
      <div><label>Valor (COP)</label><input name="valor" inputmode="numeric" required value="${m.valor ? Number(m.valor).toLocaleString('es-CO').replace(/,/g, '.') : ''}"></div>
      <div><label>Fecha</label><input name="fecha" type="date" required value="${m.fecha || ''}"></div>
      <div><label>Categoría</label><select name="categoria_id">${opsCat(m.tipo)}</select></div>
      <div><label>Encargo</label><select name="encargo_id"><option value="">Regenerativo (general)</option>${encargos.map(e => `<option value="${e.id}" ${e.id === m.encargo_id ? 'selected' : ''}>${esc(e.nombre)}</option>`).join('')}</select></div>
      <div class="ancho"><label>Concepto</label><input name="descripcion" value="${esc(m.descripcion || '')}" placeholder="${m.tipo === 'ingreso' ? 'Pago 50% al iniciar' : 'Taxi visita de obra'}"></div>
      <div><label>Medio</label><input name="medio" value="${esc(m.medio || '')}" placeholder="Transferencia, efectivo, tarjeta…"></div>
    </div>
    <div class="aviso" id="aviso"></div>
    <div class="pie-modal">${m.id ? '<button type="button" class="btn sec" id="borrar" style="margin-right:auto">Borrar</button>' : ''}<button type="button" class="btn sec" id="cancelar">Cancelar</button><button class="btn" type="submit">Guardar</button></div>
  </form>`;
  document.body.appendChild(fondo);
  const f = $('#fm', fondo);
  f.valor.oninput = () => { const n = f.valor.value.replace(/\D/g, ''); f.valor.value = n ? Number(n).toLocaleString('es-CO').replace(/,/g, '.') : ''; };
  $('#cancelar', fondo).onclick = () => fondo.remove();
  const b = $('#borrar', fondo); if (b) b.onclick = async () => { if (confirm('¿Borrar este movimiento?')) { await D.finBorrarMovimiento(m.id); fondo.remove(); recargar(); } };
  f.onsubmit = async ev => {
    ev.preventDefault();
    const v = Object.fromEntries(new FormData(f));
    const reg = { tipo: m.tipo, valor: Number(v.valor.replace(/\D/g, '')), fecha: v.fecha, categoria_id: v.categoria_id || null, encargo_id: v.encargo_id || null, descripcion: v.descripcion, medio: v.medio };
    if (m.id) reg.id = m.id;
    try { await D.finGuardarMovimiento(reg); fondo.remove(); recargar(); } catch (err) { $('#aviso', fondo).textContent = err.message; }
  };
}

function modalPresupuesto(cats, recargar) {
  const fondo = document.createElement('div'); fondo.className = 'modal-fondo';
  fondo.innerHTML = `<form class="modal" id="fp"><h2>Presupuesto mensual de gastos</h2><p class="sub">Déjalo vacío si una categoría no tiene tope.</p>
    <div class="tabla-cont"><table><thead><tr><th>Categoría</th><th class="num">Tope mensual (COP)</th></tr></thead><tbody>
    ${cats.map(c => `<tr><td>${esc(c.icono || '')} ${esc(c.nombre)}</td><td class="num"><input class="cant ancho-p" name="${c.id}" inputmode="numeric" value="${c.presupuesto_mensual ? Number(c.presupuesto_mensual).toLocaleString('es-CO').replace(/,/g, '.') : ''}"></td></tr>`).join('')}
    </tbody></table></div>
    <div class="pie-modal"><button type="button" class="btn sec" id="cancelar">Cancelar</button><button class="btn" type="submit">Guardar</button></div></form>`;
  document.body.appendChild(fondo);
  $('#cancelar', fondo).onclick = () => fondo.remove();
  $('#fp', fondo).onsubmit = async ev => {
    ev.preventDefault();
    for (const c of cats) {
      const raw = fondo.querySelector(`[name="${c.id}"]`).value.replace(/\D/g, '');
      const val = raw ? Number(raw) : null;
      if (val !== (c.presupuesto_mensual ? Number(c.presupuesto_mensual) : null)) await D.finActualizarCategoria(c.id, { presupuesto_mensual: val });
    }
    fondo.remove(); recargar();
  };
}
