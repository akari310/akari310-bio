export const toast = document.getElementById('toast');
let toastTimeout: number;

export function showToast(message: string) {
    if (!toast) return;
    toast.innerHTML = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}
