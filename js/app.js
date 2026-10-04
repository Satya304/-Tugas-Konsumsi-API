/* =====================================================
   KONFIGURASI: sudah disesuaikan dengan postman_collection.json
   ===================================================== */
const API_BASE = "https://api.melangkah.my.id";

const RESOURCES = {
  asset: {
    page: "asset.html", title: "Master Asset", icon: "bi-box-seam", ops: "crud",
    dir: "/asset", key: "id",
    fields: [
      { name: "nama_asset", label: "Nama asset", type: "text" },
      { name: "kategori",   label: "Kategori",   type: "text" },
      { name: "jumlah",     label: "Jumlah",     type: "number" },
      { name: "kondisi",    label: "Kondisi",    type: "select", options: ["Baik", "Rusak"] },
      { name: "lokasi",     label: "Lokasi",     type: "text" },
      { name: "status",     label: "Status",     type: "select", options: ["Tersedia", "Dipinjam"] }
    ]
  },
  mahasiswa: {
    page: "mahasiswa.html", title: "Master Mahasiswa", icon: "bi-people", ops: "crud",
    dir: "/mahasiswa", key: "id",
    fields: [
      { name: "nim",      label: "NIM",      type: "text" },
      { name: "nama",     label: "Nama",     type: "text" },
      { name: "jurusan",  label: "Jurusan",  type: "text" },
      { name: "angkatan", label: "Angkatan", type: "number" },
      { name: "email",    label: "Email",    type: "email" },
      { name: "telepon",  label: "Telepon",  type: "text" }
    ]
  },
  peminjaman: {
    page: "peminjaman.html", title: "Transaksi Peminjaman", icon: "bi-arrow-left-right", ops: "cr",
    dir: "/peminjaman", key: "id_peminjaman",
    fields: [
      { name: "id_mahasiswa", label: "Mahasiswa", type: "ref", ref: "mahasiswa", refValue: "id", refLabel: "nama", altLabel: "nama_mahasiswa" },
      { name: "id_asset",     label: "Asset",     type: "ref", ref: "asset",     refValue: "id", refLabel: "nama_asset", altLabel: "nama_asset" },
      { name: "jumlah",            label: "Jumlah",         type: "number" },
      { name: "tanggal_pinjam",    label: "Tanggal pinjam", type: "date" },
      { name: "tanggal_kembali",   label: "Tanggal kembali", type: "date" },
      { name: "keterangan",        label: "Keterangan",     type: "text" },
      { name: "status_peminjaman", label: "Status",         type: "select", options: ["Pending", "Dipinjam", "Dikembalikan"] }
    ]
  }
};

/* ===================== UTILITAS ===================== */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function toList(d) {
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object") {
    for (const k of ["data", "result", "results", "rows", "records", "items"])
      if (Array.isArray(d[k])) return d[k];
    const arr = Object.values(d).find(Array.isArray);
    if (arr) return arr;
  }
  return [];
}

async function api(path, method = "GET", body) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* bukan JSON */ }
  if (!res.ok) throw new Error(data?.message || `${res.status} ${res.statusText}`);
  if (data && (data.success === false || data.status === false || data.status === "error"))
    throw new Error(data.message || "Permintaan ditolak oleh server");
  if (data === null && text) throw new Error("Respon bukan JSON: " + text.slice(0, 120));
  return data;
}

function notify(msg, type = "success") {
  $("alertBox").innerHTML = `<div class="alert alert-${type} alert-dismissible fade show">${esc(msg)}
    <button class="btn-close" data-bs-dismiss="alert"></button></div>`;
}

/* ===================== LAYOUT ===================== */
function layout(activePage, title, tombol = "") {
  const menu = [{ page: "beranda.html", title: "Beranda", icon: "bi-house" }, ...Object.values(RESOURCES)];
  $("app").innerHTML = `
  <div class="container-fluid"><div class="row">
    <nav class="col-md-2 sidebar p-3">
      <h5 class="text-white mb-4"><i class="bi bi-tools me-2"></i>Lab Peminjaman_075</h5>
      <div class="nav flex-column gap-1">
        ${menu.map(m => `<a href="${m.page}" class="nav-link ${m.page === activePage ? "active" : ""}">
          <i class="bi ${m.icon} me-2"></i>${m.title}</a>`).join("")}
      </div>
    </nav>
    <main class="col-md-10 p-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">${title}</h3>
        ${tombol ? `<button id="btnTambah" class="btn btn-primary"><i class="bi bi-plus-lg me-1"></i>${tombol}</button>` : ""}
      </div>
      <div id="alertBox"></div>
      <div id="content"></div>
    </main>
  </div></div>
  <div class="modal fade" id="modalForm" tabindex="-1"><div class="modal-dialog">
    <form class="modal-content" id="formData">
      <div class="modal-header"><h5 class="modal-title" id="modalJudul"></h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body" id="formBody"></div>
      <div class="modal-footer">
        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Batal</button>
        <button type="submit" class="btn btn-primary">Simpan</button></div>
    </form>
  </div></div>`;
}

/* ===================== HALAMAN BERANDA ===================== */
function initHome() {
  layout("beranda.html", "Beranda");
  $("content").innerHTML = `<div class="row g-3">` + Object.values(RESOURCES).map(r => `
    <div class="col-md-4"><a href="${r.page}" class="text-decoration-none">
      <div class="card h-100"><div class="card-body">
        <i class="bi ${r.icon} fs-2 text-primary"></i>
        <h5 class="mt-2 text-dark">${r.title}</h5>
        <p class="text-muted mb-0">${r.ops === "crud" ? "Tambah, lihat, ubah, dan hapus data." : "Tambah dan lihat data."}</p>
      </div></div></a></div>`).join("") + `</div>`;
}

/* ===================== HALAMAN CRUD ===================== */
function initCrud(resKey) {
  const r = RESOURCES[resKey];
  let rows = [], refCache = {}, editKey = null;

  layout(r.page, r.title, "Tambah data");
  const modal = new bootstrap.Modal("#modalForm");

  $("content").innerHTML = `
    <div class="card"><div class="card-body table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light"><tr>
          <th>#</th>${r.fields.map(f => `<th>${f.label}</th>`).join("")}${r.ops === "crud" ? "<th class='text-end'>Aksi</th>" : ""}
        </tr></thead>
        <tbody id="tbody"></tbody>
      </table>
    </div></div>
    <small class="text-muted d-block mt-3">API: <code>${API_BASE + r.dir}/read.php</code></small>`;

  async function loadRefs() {
    for (const f of r.fields.filter(f => f.type === "ref")) {
      try { refCache[f.ref] = toList(await api(RESOURCES[f.ref].dir + "/read.php")); }
      catch { refCache[f.ref] = []; }
    }
  }

  function cell(f, row) {
    const v = row[f.name];
    if (f.type === "ref") {
      const item = (refCache[f.ref] || []).find(x => String(x[f.refValue]) === String(v));
      return esc(item ? item[f.refLabel] : (row[f.altLabel] ?? v));
    }
    return esc(v);
  }

  function render() {
    if (!rows.length) {
      $("tbody").innerHTML = `<tr><td colspan="12" class="text-center text-muted py-4">Belum ada data. Klik "Tambah data" untuk mulai.</td></tr>`;
      return;
    }
    $("tbody").innerHTML = rows.map((row, i) => `<tr><td>${i + 1}</td>` +
      r.fields.map(f => `<td>${cell(f, row)}</td>`).join("") +
      (r.ops === "crud" ? `<td class="text-end text-nowrap">
        <button class="btn btn-sm btn-outline-primary me-1" data-edit="${esc(row[r.key])}"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" data-del="${esc(row[r.key])}"><i class="bi bi-trash"></i></button></td>` : "") +
      `</tr>`).join("");
    document.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => openForm(b.dataset.edit));
    document.querySelectorAll("[data-del]").forEach(b => b.onclick = () => hapus(b.dataset.del));
  }

  async function load() {
    $("tbody").innerHTML = `<tr><td colspan="12" class="text-center text-muted py-4">Memuat data…</td></tr>`;
    try {
      await loadRefs();
      rows = toList(await api(r.dir + "/read.php"));
      render();
    } catch (e) {
      $("tbody").innerHTML = "";
      notify("Gagal memuat data: " + e.message, "danger");
    }
  }

  function openForm(key = null) {
    editKey = key;
    const data = key !== null ? rows.find(x => String(x[r.key]) === String(key)) || {} : {};
    $("modalJudul").textContent = (key !== null ? "Ubah " : "Tambah ") + r.title;
    $("formBody").innerHTML = r.fields.map(f => {
      const v = data[f.name] ?? "";
      let input;
      if (f.type === "select") {
        const opts = f.options.includes(v) || v === "" ? f.options : [...f.options, v];
        input = `<select class="form-select" name="${f.name}" required>${opts.map(o => `<option ${o === v ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
      } else if (f.type === "ref") {
        input = `<select class="form-select" name="${f.name}" required><option value="">-- pilih --</option>${(refCache[f.ref] || []).map(o =>
          `<option value="${esc(o[f.refValue])}" ${String(o[f.refValue]) === String(v) ? "selected" : ""}>${esc(o[f.refLabel])}</option>`).join("")}</select>`;
      } else {
        input = `<input class="form-control" type="${f.type}" name="${f.name}" value="${esc(String(v).slice(0, f.type === "date" ? 10 : 999))}" required>`;
      }
      return `<div class="mb-3"><label class="form-label">${f.label}</label>${input}</div>`;
    }).join("");
    modal.show();
  }

  async function hapus(key) {
    if (!confirm("Hapus data ini?")) return;
    try {
      await api(`${r.dir}/delete.php?${r.key}=${encodeURIComponent(key)}`, "DELETE");
      notify("Data berhasil dihapus.");
      load();
    } catch (err) { notify("Gagal menghapus: " + err.message, "danger"); }
  }

  $("btnTambah").onclick = () => openForm();

  $("formData").onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(e.target), body = {};
    r.fields.forEach(f => {
      const v = fd.get(f.name);
      body[f.name] = (f.type === "number" || f.type === "ref") && v !== "" && !isNaN(v) ? Number(v) : v;
    });
    try {
      if (editKey !== null) {
        body[r.key] = isNaN(editKey) ? editKey : Number(editKey);
        await api(r.dir + "/update.php", "POST", body);
      } else {
        await api(r.dir + "/create.php", "POST", body);
      }
      modal.hide();
      notify(editKey !== null ? "Data berhasil diubah." : "Data berhasil ditambahkan.");
      load();
    } catch (err) { notify("Gagal menyimpan: " + err.message, "danger"); }
  };

  load();
}