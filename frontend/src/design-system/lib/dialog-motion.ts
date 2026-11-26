export function closeModal(dialog: HTMLDialogElement | null, afterClose?: () => void) {
  if (!dialog?.open || dialog.dataset.closing) return;

  function finish() {
    dialog!.close();
    dialog!.removeAttribute('data-closing');
    afterClose?.();
  }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !dialog.animate) {
    finish();
    return;
  }

  dialog.dataset.closing = 'true';
  const style = getComputedStyle(dialog);
  const exitTransform = style.getPropertyValue('--modal-exit-transform').trim() || 'translateY(7px) scale(.96)';
  const exit = dialog.animate([
    { opacity: style.opacity, transform: style.transform },
    { opacity: 0, transform: exitTransform }
  ], { duration: 190, easing: 'cubic-bezier(.4,0,.75,.35)', fill: 'forwards' });

  exit.finished.then(() => {
    finish();
    exit.cancel();
  }, finish);
}

export function closeModalOnEscape(event: {
  currentTarget: HTMLDialogElement;
  preventDefault(): void;
}) {
  event.preventDefault();
  closeModal(event.currentTarget);
}
