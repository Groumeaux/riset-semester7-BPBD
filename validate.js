// --- VALIDATION PAGE SCRIPT ---
let validationBencanaTable; 
let validationInsidenTable;

/**
 * [FUNGSI DIPERBARUI] Muat SEMUA laporan dan pisahkan ke tabel masing-masing
 */
function loadPendingReports() {
    fetch('get_disasters.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                
                // Get current month reports
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();

                const monthlyReports = data.data.filter(report => {
                    const reportDate = new Date(report.created_at);
                    return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
                });

                // --- LOGIKA PEMISAHAN DATA BARU ---
                // Pisahkan data berdasarkan kategori
                // Fallback: data lama yg 'kategori_laporan' == null dianggap 'bencana'
                const bencanaReports = monthlyReports.filter(d => d.kategori_laporan === 'bencana' || !d.kategori_laporan);
                const insidenReports = monthlyReports.filter(d => d.kategori_laporan === 'insiden');

                // --- Update Statistik (tetap global) ---
                const pendingCount = monthlyReports.filter(r => r.status === 'pending').length;
                const approvedCount = monthlyReports.filter(r => r.status === 'approved').length;
                const rejectedCount = monthlyReports.filter(r => r.status === 'rejected').length;

                document.getElementById('pending-count').textContent = pendingCount;
                document.getElementById('approved-count').textContent = approvedCount;
                document.getElementById('rejected-count').textContent = rejectedCount;

                // --- Hancurkan DataTables yang ada ---
                if ($.fn.DataTable.isDataTable('#pending-reports-table')) {
                    $('#pending-reports-table').DataTable().destroy();
                }
                if ($.fn.DataTable.isDataTable('#insiden-reports-table')) {
                    $('#insiden-reports-table').DataTable().destroy();
                }
                
                // --- Panggil fungsi untuk mengisi setiap tabel ---
                populateBencanaTable(bencanaReports);
                populateInsidenTable(insidenReports);
                
                // --- Inisialisasi ulang DataTables (JIKA ADA DATA) ---
                const dataTableOptions = {
                    "pageLength": 5,
                    "lengthMenu": [5, 10],
                    "responsive": true,
                    "language": {
                        "search": "Cari:",
                        "lengthMenu": "Tampilkan _MENU_ data",
                        "info": "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
                        "infoEmpty": "Tidak ada data",
                        "infoFiltered": "(difilter dari _MAX_ total data)",
                        "paginate": { "first": "Pertama", "last": "Terakhir", "next": "Berikutnya", "previous": "Sebelumnya" }
                    }
                };

                if (bencanaReports.length > 0) {
                    validationBencanaTable = $('#pending-reports-table').DataTable({
                        ...dataTableOptions,
                        "order": [[6, "desc"]], // Urutkan berdasarkan Tanggal Lapor
                        "columnDefs": [
                          { "orderable": false, "targets": [0, 3, 4, 7] }
                        ]
                    });
                }
                
                if (insidenReports.length > 0) {
                    validationInsidenTable = $('#insiden-reports-table').DataTable({
                        ...dataTableOptions,
                        "order": [[5, "desc"]], // Urutkan berdasarkan Tanggal Lapor
                        "columnDefs": [
                          { "orderable": false, "targets": [0, 2, 3, 6] }
                        ]
                    });
                }
                
                // Perbarui status filter
                applyGlobalFilters();
                updateSelectAllCheckboxes();

            } else {
                if (data.message === 'Not authenticated') {
                    window.location.href = 'index.php';
                } else {
                    alert('Error loading reports: ' + data.message);
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Gagal memuat laporan. Silakan cek konsol untuk detail.');
        });
}

/**
 * [FUNGSI BARU] Mengisi tabel Bencana (#pending-reports-body)
 */
function populateBencanaTable(bencanaReports) {
    const tbody = document.getElementById('pending-reports-body');
    tbody.innerHTML = ''; // Kosongkan tabel

    if (bencanaReports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">Tidak ada laporan bencana bulan ini.</td></tr>`;
        return;
    }

    bencanaReports.forEach(report => {
        const statusBadge = report.status === 'approved' ? '<span class="badge bg-success">Disetujui</span>' :
                           report.status === 'rejected' ? '<span class="badge bg-danger">Ditolak</span>' :
                           '<span class="badge bg-warning">Menunggu</span>';

        const checkbox = report.status === 'pending' ? `<input type="checkbox" class="report-checkbox" value="${report.id}">` : '';

        let photoThumbnails = '';
        if (report.photos && report.photos.length > 0) {
            photoThumbnails = '<div class="d-flex flex-wrap gap-1">';
            report.photos.forEach(photo => {
                photoThumbnails += `<img src="${photo.file_path}" alt="Foto bencana" class="img-thumbnail" style="width: 40px; height: 40px; object-fit: cover;" data-bs-toggle="modal" data-bs-target="#photo-modal" data-photo-src="${photo.file_path}" data-photo-title="${photo.original_filename}">`;
            });
            photoThumbnails += '</div>';
        } else {
            photoThumbnails = '<span class="text-muted">Tidak ada foto</span>';
        }

        const row = `
            <tr>
                <td class="text-center">${checkbox}</td>
                <td class="fw-medium">${report.jenisBencana}</td>
                <td>${report.lokasi}</td>
                <td>${report.jiwaTerdampak} Jiwa / ${report.kkTerdampak} KK</td>
                <td>
                    <span class="badge ${
                        report.tingkatKerusakan === 'Berat' ? 'bg-danger-subtle text-danger-emphasis' :
                        report.tingkatKerusakan === 'Sedang' ? 'bg-warning-subtle text-warning-emphasis' : 'bg-secondary-subtle text-secondary-emphasis'
                    } rounded-pill">${report.tingkatKerusakan}</span>
                </td>
                <td>${report.submitted_by_name}</td>
                <td>${new Date(report.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                <td class="text-center">${photoThumbnails}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

/**
 * [FUNGSI BARU] Mengisi tabel Insiden (#insiden-reports-body)
 */
function populateInsidenTable(insidenReports) {
    const tbody = document.getElementById('insiden-reports-body');
    tbody.innerHTML = ''; // Kosongkan tabel

    if (insidenReports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">Tidak ada laporan insiden bulan ini.</td></tr>`;
        return;
    }

    insidenReports.forEach(report => {
        const statusBadge = report.status === 'approved' ? '<span class="badge bg-success">Disetujui</span>' :
                           report.status === 'rejected' ? '<span class="badge bg-danger">Ditolak</span>' :
                           '<span class="badge bg-warning">Menunggu</span>';

        const checkbox = report.status === 'pending' ? `<input type="checkbox" class="report-checkbox" value="${report.id}">` : '';

        let photoThumbnails = '';
        if (report.photos && report.photos.length > 0) {
            photoThumbnails = '<div class="d-flex flex-wrap gap-1">';
            report.photos.forEach(photo => {
                photoThumbnails += `<img src="${photo.file_path}" alt="Foto insiden" class="img-thumbnail" style="width: 40px; height: 40px; object-fit: cover;" data-bs-toggle="modal" data-bs-target="#photo-modal" data-photo-src="${photo.file_path}" data-photo-title="${photo.original_filename}">`;
            });
            photoThumbnails += '</div>';
        } else {
            photoThumbnails = '<span class="text-muted">Tidak ada foto</span>';
        }

        const row = `
            <tr>
                <td class="text-center">${checkbox}</td>
                <td class="fw-medium">${report.jenisBencana}</td>
                <td>${report.lokasi}</td>
                <td>${report.keterangan || '<span class="text-muted">N/A</span>'}</td>
                <td>${report.submitted_by_name}</td>
                <td>${new Date(report.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                <td class="text-center">${photoThumbnails}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}


/**
 * [FUNGSI DIPERBARUI] Menerapkan filter ke tabel yang relevan
 */
function applyGlobalFilters() {
    const statusFilter = document.getElementById('filter-status').value;
    const jenisFilter = document.getElementById('filter-jenis').value;

    if (validationBencanaTable) {
        validationBencanaTable.column(8).search(statusFilter); // Kolom Status Bencana
        validationBencanaTable.column(1).search(jenisFilter);  // Kolom Jenis Bencana
        validationBencanaTable.draw();
    }
    
    if (validationInsidenTable) {
        validationInsidenTable.column(7).search(statusFilter); // Kolom Status Insiden
        // Filter Jenis Bencana tidak berlaku untuk tabel insiden
        validationInsidenTable.draw();
    }
}


/**
 * [FUNGSI DIPERBARUI] Update checkbox "select all" untuk kedua tabel
 */
function updateSelectAllCheckboxes() {
    // Checkbox Bencana
    const selectAllBencana = document.getElementById('select-all-bencana');
    const bencanaCheckboxes = document.querySelectorAll('#pending-reports-body .report-checkbox');
    const checkedBencana = document.querySelectorAll('#pending-reports-body .report-checkbox:checked');
    if (selectAllBencana) {
        selectAllBencana.checked = bencanaCheckboxes.length > 0 && checkedBencana.length === bencanaCheckboxes.length;
        selectAllBencana.indeterminate = checkedBencana.length > 0 && checkedBencana.length < bencanaCheckboxes.length;
    }

    // Checkbox Insiden
    const selectAllInsiden = document.getElementById('select-all-insiden');
    const insidenCheckboxes = document.querySelectorAll('#insiden-reports-body .report-checkbox');
    const checkedInsiden = document.querySelectorAll('#insiden-reports-body .report-checkbox:checked');
    if (selectAllInsiden) {
        selectAllInsiden.checked = insidenCheckboxes.length > 0 && checkedInsiden.length === insidenCheckboxes.length;
        selectAllInsiden.indeterminate = checkedInsiden.length > 0 && checkedInsiden.length < insidenCheckboxes.length;
    }
    
    // Update tombol
    updateButtonText();
}

/**
 * [FUNGSI DIPERBARUI] Update tombol berdasarkan *semua* checkbox yang dicentang
 */
function updateButtonText() {
    const checkedBoxes = document.querySelectorAll('.report-checkbox:checked');
    const count = checkedBoxes.length;

    const approveBtn = document.getElementById('approve-all-btn');
    const rejectBtn = document.getElementById('reject-all-btn');

    if (count === 0) {
        approveBtn.textContent = 'Setujui Laporan Terpilih';
        rejectBtn.textContent = 'Tolak Laporan Terpilih';
        approveBtn.disabled = true;
        rejectBtn.disabled = true;
    } else if (count === 1) {
        approveBtn.textContent = 'Setujui 1 Laporan';
        rejectBtn.textContent = 'Tolak 1 Laporan';
        approveBtn.disabled = false;
        rejectBtn.disabled = false;
    } else {
        approveBtn.textContent = `Setujui ${count} Laporan`;
        rejectBtn.textContent = `Tolak ${count} Laporan`;
        approveBtn.disabled = false;
        rejectBtn.disabled = false;
    }
}

/**
 * Initialize button states on page load
 */
function initializeButtons() {
    const approveBtn = document.getElementById('approve-all-btn');
    const rejectBtn = document.getElementById('reject-all-btn');
    if (approveBtn && rejectBtn) {
        approveBtn.disabled = true;
        rejectBtn.disabled = true;
    }
}

/**
 * [FUNGSI DIPERBARUI] Handle select all untuk kedua tabel
 */
function handleSelectAll(e) {
    let checkboxes;
    if (e.target.id === 'select-all-bencana') {
        checkboxes = document.querySelectorAll('#pending-reports-body .report-checkbox');
    } else if (e.target.id === 'select-all-insiden') {
        checkboxes = document.querySelectorAll('#insiden-reports-body .report-checkbox');
    } else {
        return;
    }
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
    });
    updateButtonText();
}

/**
 * [TETAP SAMA] Logika batch approve (mengambil semua checkbox yang dicentang)
 */
function approveAllReports() {
    const selectedCheckboxes = document.querySelectorAll('.report-checkbox:checked');

    if (selectedCheckboxes.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Pilih Laporan!', text: 'Pilih laporan yang ingin disetujui.' });
        return;
    }

    Swal.fire({
        title: 'Apakah Anda yakin?',
        text: `Anda akan menyetujui ${selectedCheckboxes.length} laporan.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Setujui',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            const promises = Array.from(selectedCheckboxes).map(checkbox => {
                const formData = new FormData();
                formData.append('id', checkbox.value);
                formData.append('action', 'approved');

                return fetch('validation_process.php', {
                    method: 'POST',
                    body: formData
                }).then(response => response.json());
            });

            Promise.all(promises)
                .then(results => {
                    const successCount = results.filter(r => r.success).length;
                    const failCount = results.length - successCount;

                    if (failCount === 0) {
                        Swal.fire({ icon: 'success', title: 'Berhasil!', text: `Berhasil menyetujui ${successCount} laporan.`, timer: 2000, showConfirmButton: false });
                    } else {
                        Swal.fire({ icon: 'warning', title: 'Sebagian Berhasil', text: `Berhasil menyetujui ${successCount} laporan, gagal ${failCount} laporan.` });
                    }
                    loadPendingReports(); // Muat ulang kedua tabel
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire({ icon: 'error', title: 'Error!', text: 'Gagal memproses validasi laporan.' });
                });
        }
    });
}

/**
 * [TETAP SAMA] Logika batch reject (mengambil semua checkbox yang dicentang)
 */
function rejectAllReports() {
    const selectedCheckboxes = document.querySelectorAll('.report-checkbox:checked');

    if (selectedCheckboxes.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Pilih Laporan!', text: 'Pilih laporan yang ingin ditolak.' });
        return;
    }

    Swal.fire({
        title: 'Apakah Anda yakin?',
        text: `Anda akan menolak ${selectedCheckboxes.length} laporan.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Tolak',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            const promises = Array.from(selectedCheckboxes).map(checkbox => {
                const formData = new FormData();
                formData.append('id', checkbox.value);
                formData.append('action', 'rejected');

                return fetch('validation_process.php', {
                    method: 'POST',
                    body: formData
                }).then(response => response.json());
            });

            Promise.all(promises)
                .then(results => {
                    const successCount = results.filter(r => r.success).length;
                    const failCount = results.length - successCount;

                    if (failCount === 0) {
                        Swal.fire({ icon: 'success', title: 'Berhasil!', text: `Berhasil menolak ${successCount} laporan.`, timer: 2000, showConfirmButton: false });
                    } else {
                        Swal.fire({ icon: 'warning', title: 'Sebagian Berhasil', text: `Berhasil menolak ${successCount} laporan, gagal ${failCount} laporan.` });
                    }
                    loadPendingReports(); // Muat ulang kedua tabel
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire({ icon: 'error', title: 'Error!', text: 'Gagal memproses validasi laporan.' });
                });
        }
    });
}

/**
 * Handle logout
 */
function handleLogout() {
    window.location.href = 'logout.php';
}

// --- [EVENT LISTENERS DIPERBARUI] ---

document.addEventListener('DOMContentLoaded', function() {
    initializeButtons();
    loadPendingReports();

    // Checkbox "Select All"
    const selectAllBencana = document.getElementById('select-all-bencana');
    if (selectAllBencana) {
        selectAllBencana.addEventListener('change', handleSelectAll);
    }
    const selectAllInsiden = document.getElementById('select-all-insiden');
    if (selectAllInsiden) {
        selectAllInsiden.addEventListener('change', handleSelectAll);
    }

    // Filter by Status (Terapkan ke kedua tabel)
    const filterStatus = document.getElementById('filter-status');
    if (filterStatus) {
        filterStatus.addEventListener('change', applyGlobalFilters);
    }

    // Filter by Jenis (Hanya terapkan ke tabel bencana)
    const filterJenis = document.getElementById('filter-jenis');
    if (filterJenis) {
        filterJenis.addEventListener('change', applyGlobalFilters);
    }

    // Listener untuk checkbox individual (untuk update tombol)
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('report-checkbox')) {
            updateSelectAllCheckboxes();
        }
    });

    // Tombol Aksi Batch
    const approveBtn = document.getElementById('approve-all-btn');
    if (approveBtn) {
        approveBtn.addEventListener('click', approveAllReports);
    }
    const rejectBtn = document.getElementById('reject-all-btn');
    if (rejectBtn) {
        rejectBtn.addEventListener('click', rejectAllReports);
    }

    // Tombol Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Handle Photo Modal
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-bs-target="#photo-modal"]')) {
            const imgSrc = e.target.getAttribute('data-photo-src');
            const imgTitle = e.target.getAttribute('data-photo-title');
            document.getElementById('photo-modal-image').src = imgSrc;
            document.getElementById('photoModalLabel').textContent = imgTitle || 'Foto Laporan';
        }
    });
});