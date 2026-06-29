import Swal from 'sweetalert2'
import type { SweetAlertIcon } from 'sweetalert2'

/** Configuração centralizada para toasts (SweetAlert2 mixin). */
const toastMixin = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 5000,
  timerProgressBar: true,
  background: '#fff',
})

const showAlert = ({
  type = 'info' as SweetAlertIcon,
  title = '',
  text = '',
  showCancelButton = false,
  confirmButtonText = 'Ok',
  cancelButtonText = 'Cancelar',
  confirmButtonColor = '#1a3d37',
  cancelButtonColor = '#e31818',
  onConfirm = () => {},
  onCancel = () => {},
  toast = false,
}: {
  type?: SweetAlertIcon
  title?: string
  text?: string
  showCancelButton?: boolean
  confirmButtonText?: string
  cancelButtonText?: string
  confirmButtonColor?: string
  cancelButtonColor?: string
  onConfirm?: () => void
  onCancel?: () => void
  toast?: boolean
}) => {
  if (toast) {
    toastMixin.fire({
      icon: type,
      title: text || title,
    })
  } else {
    Swal.fire({
      icon: type,
      title,
      text,
      showCancelButton,
      confirmButtonText,
      cancelButtonText,
      confirmButtonColor,
      cancelButtonColor,
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) onConfirm()
      else if (result.dismiss === Swal.DismissReason.cancel) onCancel()
    })
  }
}

/** Modal de confirmação para exclusão; retorna true se o usuário confirmou. */
export async function confirmDeleteRecord(
  title: string,
  text: string,
): Promise<boolean> {
  const result = await Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    reverseButtons: true,
  })
  return result.isConfirmed
}

export function toastSuccess(message: string) {
  toastMixin.fire({ icon: 'success', title: message })
}

export function toastError(message: string) {
  toastMixin.fire({ icon: 'error', title: message })
}

export function toastCadastroSucesso(message: string) {
  toastMixin.fire({ icon: 'success', title: message })
}

export function toastCadastroErro(message: string) {
  toastMixin.fire({ icon: 'error', title: message })
}

export default showAlert
