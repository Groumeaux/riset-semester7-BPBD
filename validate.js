
// --- VALIDATION PAGE SCRIPT ---
let validationTable; 
/**
 * Load disaster reports for monthly batch validation
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
                const tbody = document.getElementById('pending-reports-body');

                // 1. DESTROY existing DataTable instance if it exists
                // We use the ID we added to the <table> tag
                if ($.fn.DataTable.isDataTable('#pending-reports-table')) {
                    $('#pending-reports-table').DataTable().destroy();
                }

                tbody.innerHTML = ''; // Clear table body

                // Get current month reports
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();

                const monthlyReports = data.data.filter(report => {
                    const reportDate = new Date(report.created_at);
                    return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
                });

                // Count statistics
                const pendingCount = monthlyReports.filter(r => r.status === 'pending').length;
                const approvedCount = monthlyReports.filter(r => r.status === 'approved').length;
                const rejectedCount = monthlyReports.filter(r => r.status === 'rejected').length;

                document.getElementById('pending-count').textContent = pendingCount;
                document.getElementById('approved-count').textContent = approvedCount;
                document.getElementById('rejected-count').textContent = rejectedCount;

                if (monthlyReports.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">Tidak ada laporan bulan ini.</td></tr>`;
                } else {
                    // 2. GENERATE the table rows (This is your existing logic)
                    monthlyReports.forEach(report => {
                        const statusBadge = report.status === 'approved' ? '<span class="badge bg-success">Disetujui</span>' :
                                           report.status === 'rejected' ? '<span class="badge bg-danger">Ditolak</span>' :
                                           '<span class="badge bg-warning">Menunggu</span>';

                        const checkbox = report.status === 'pending' ? `<input type="checkbox" class="report-checkbox" value="${report.id}">` : '';

                        // Generate photo thumbnails
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

                // 3. INITIALIZE the new DataTable instance
                validationTable = $('#pending-reports-table').DataTable({
                    "pageLength": 5, // Set default entries to 5
                    "lengthMenu": [5, 10], // Show options for 5, 10, 25 entries
                    "responsive": true,
                    "order": [[ 6, "desc" ]], // Default sort by Tanggal (column 6) descending
                    
                    // Disable sorting on the Checkbox (col 0) and Foto (col 7)
                    "columnDefs": [
                      {
                        "orderable": false,
                        "targets": [0, 7] 
                      },
                      {
                        "className": "text-center", // Center-align checkbox and photos
                        "targets": [0, 7]
                      }
                    ],
                    
                    // Add Indonesian translation
                    "language": {
                        "search": "Cari:",
                        "lengthMenu": "Tampilkan _MENU_ data",
                        "info": "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
                        "infoEmpty": "Tidak ada data",
                        "infoFiltered": "(difilter dari _MAX_ total data)",
                        "paginate": {
                            "first": "Pertama",
                            "last": "Terakhir",
                            "next": "Berikutnya",
                            "previous": "Sebelumnya"
                        }
                    }
                });

                // Update select all checkbox
                updateSelectAllCheckbox();
            } else {
                // Redirect to login if not authenticated
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
 * Validate a disaster report (approve or reject)
 * @param {number} id - Report ID
 * @param {string} action - 'approved' or 'rejected'
 */
function validateReport(id, action) {
    const formData = new FormData();
    formData.append('id', id);
    formData.append('action', action);

    // FIX: The fetch request must point to the processing script, not the page itself.
    fetch('validation_process.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: data.message,
                timer: 2000,
                showConfirmButton: false
            });
            loadPendingReports(); // Reload the list
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Gagal!',
                text: data.message
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Gagal memproses validasi laporan.'
        });
    });
}

/**
 * Update select all checkbox state and button text
 */
function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('select-all');
    const checkboxes = document.querySelectorAll('.report-checkbox');
    const checkedBoxes = document.querySelectorAll('.report-checkbox:checked');

    selectAllCheckbox.checked = checkboxes.length > 0 && checkedBoxes.length === checkboxes.length;
    selectAllCheckbox.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length;

    // Update button text based on selection
    updateButtonText();
}

/**
 * Update button text based on selected reports
 */
function updateButtonText() {
    const checkedBoxes = document.querySelectorAll('.report-checkbox:checked');
    const count = checkedBoxes.length;

    const approveBtn = document.getElementById('approve-all-btn');
    const rejectBtn = document.getElementById('reject-all-btn');

    if (count === 0) {
        approveBtn.textContent = 'Setujui Semua Laporan Bulan Ini';
        rejectBtn.textContent = 'Tolak Semua Laporan Bulan Ini';
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

    // Ensure buttons start disabled
    approveBtn.disabled = true;
    rejectBtn.disabled = true;
}



/**
 * Handle select all checkbox
 */
function handleSelectAll() {
    const selectAllCheckbox = document.getElementById('select-all');
    const checkboxes = document.querySelectorAll('.report-checkbox');

    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });

    // Update button states after selecting/deselecting all
    updateButtonText();
}

/**
 * Approve all pending reports for current month
 */
function approveAllReports() {
    const selectedCheckboxes = document.querySelectorAll('.report-checkbox:checked');

    if (selectedCheckboxes.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Pilih Laporan!',
            text: 'Pilih laporan yang ingin disetujui terlebih dahulu.'
        });
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
                        Swal.fire({
                            icon: 'success',
                            title: 'Berhasil!',
                            text: `Berhasil menyetujui ${successCount} laporan.`,
                            timer: 2000,
                            showConfirmButton: false
                        });
                    } else {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Sebagian Berhasil',
                            text: `Berhasil menyetujui ${successCount} laporan, gagal ${failCount} laporan.`
                        });
                    }
                    loadPendingReports();
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: 'Gagal memproses validasi laporan.'
                    });
                });
        }
    });
}

/**
 * Reject all pending reports for current month
 */
function rejectAllReports() {
    const selectedCheckboxes = document.querySelectorAll('.report-checkbox:checked');

    if (selectedCheckboxes.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Pilih Laporan!',
            text: 'Pilih laporan yang ingin ditolak terlebih dahulu.'
        });
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
                        Swal.fire({
                            icon: 'success',
                            title: 'Berhasil!',
                            text: `Berhasil menolak ${successCount} laporan.`,
                            timer: 2000,
                            showConfirmButton: false
                        });
                    } else {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Sebagian Berhasil',
                            text: `Berhasil menolak ${successCount} laporan, gagal ${failCount} laporan.`
                        });
                    }
                    loadPendingReports();
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: 'Gagal memproses validasi laporan.'
                    });
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

// --- EVENT LISTENERS ---

// Load pending reports when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeButtons();
    loadPendingReports();

    // Select all checkbox
    document.getElementById('select-all').addEventListener('change', handleSelectAll);

    // Filter by Status
    document.getElementById('filter-status').addEventListener('change', function(e) {
        if (validationTable) {
            // Column 8 is the "Status" column
            validationTable.column(8).search(e.target.value).draw();
        }
    });

    // Filter by Jenis Bencana
    document.getElementById('filter-jenis').addEventListener('change', function(e) {
        if (validationTable) {
            // Column 1 is the "Jenis Bencana" column
            validationTable.column(1).search(e.target.value).draw();
        }
    });

    // Individual checkboxes
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('report-checkbox')) {
            updateSelectAllCheckbox();
        }
    });

    // Approve all button
    document.getElementById('approve-all-btn').addEventListener('click', approveAllReports);

    // Reject all button
    document.getElementById('reject-all-btn').addEventListener('click', rejectAllReports);

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Handle photo modal
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-bs-target="#photo-modal"]')) {
            const imgSrc = e.target.getAttribute('data-photo-src');
            const imgTitle = e.target.getAttribute('data-photo-title');
            document.getElementById('photo-modal-image').src = imgSrc;
            document.getElementById('photoModalLabel').textContent = imgTitle || 'Foto Bencana';
        }
    });
});

