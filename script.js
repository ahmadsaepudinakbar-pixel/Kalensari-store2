document.addEventListener('DOMContentLoaded', () => {
    const inputEl = document.getElementById('customInput');
    const actionBtn = document.getElementById('actionBtn');
    const searchIcon = document.getElementById('searchIcon');
    const clearIcon = document.getElementById('clearIcon');

    // Fungsi untuk memperbarui tampilan icon berdasarkan input
    function updateIconState() {
        if (inputEl.value.trim() !== '') {
            searchIcon.classList.remove('active');
            clearIcon.classList.add('active');
        } else {
            clearIcon.classList.remove('active');
            searchIcon.classList.add('active');
        }
    }

    // Event listener saat pengguna mengetik
    inputEl.addEventListener('input', updateIconState);

    // Event listener saat tombol ditekan
    actionBtn.addEventListener('click', () => {
        if (clearIcon.classList.contains('active')) {
            inputEl.value = ''; // Kosongkan input
            updateIconState();   // Kembalikan logo seperti semula
            inputEl.focus();     // Kembalikan fokus kursor ke input
        }
    });
});
