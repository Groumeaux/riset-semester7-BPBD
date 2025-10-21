// --- VALIDATION PAGE SCRIPT ---

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
                tbody.innerHTML = '';

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
                    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">Tidak ada laporan bulan ini.</td></tr>`;
                    return;
                }

                monthlyReports.forEach(report => {
                    const statusBadge = report.status === 'approved' ? '<span class="badge bg-success">Disetujui</span>' :
                                       report.status === 'rejected' ? '<span class="badge bg-danger">Ditolak</span>' :
                                       '<span class="badge bg-warning">Menunggu</span>';

                    const checkbox = report.status === 'pending' ? `<input type="checkbox" class="report-checkbox" value="${report.id}">` : '';

                    const row = `
                        <tr>
                            <td>${checkbox}</td>
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
                            <td>${statusBadge}</td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
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
            alert(data.message);
            loadPendingReports(); // Reload the list
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Gagal memproses validasi laporan.');
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
 * Handle select all checkbox
 */
function handleSelectAll() {
    const selectAllCheckbox = document.getElementById('select-all');
    const checkboxes = document.querySelectorAll('.report-checkbox');

    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
}

/**
 * Approve all pending reports for current month
 */
function approveAllReports() {
    const selectedCheckboxes = document.querySelectorAll('.report-checkbox:checked');

    if (selectedCheckboxes.length === 0) {
        alert('Pilih laporan yang ingin disetujui terlebih dahulu.');
        return;
    }

    if (!confirm(`Apakah Anda yakin ingin menyetujui ${selectedCheckboxes.length} laporan?`)) {
        return;
    }

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
                alert(`Berhasil menyetujui ${successCount} laporan.`);
            } else {
                alert(`Berhasil menyetujui ${successCount} laporan, gagal ${failCount} laporan.`);
            }
            loadPendingReports();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Gagal memproses validasi laporan.');
        });
}

/**
 * Reject all pending reports for current month
 */
function rejectAllReports() {
    const selectedCheckboxes = document.querySelectorAll('.report-checkbox:checked');

    if (selectedCheckboxes.length === 0) {
        alert('Pilih laporan yang ingin ditolak terlebih dahulu.');
        return;
    }

    if (!confirm(`Apakah Anda yakin ingin menolak ${selectedCheckboxes.length} laporan?`)) {
        return;
    }

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
                alert(`Berhasil menolak ${successCount} laporan.`);
            } else {
                alert(`Berhasil menolak ${successCount} laporan, gagal ${failCount} laporan.`);
            }
            loadPendingReports();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Gagal memproses validasi laporan.');
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
    loadPendingReports();

    // Select all checkbox
    document.getElementById('select-all').addEventListener('change', handleSelectAll);

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
});

