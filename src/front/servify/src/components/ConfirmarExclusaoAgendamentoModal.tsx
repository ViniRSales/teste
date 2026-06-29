import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined'

const NAVY = '#1e3a5f'
const BORDER = '#e2e8f0'

type ConfirmarExclusaoAgendamentoModalProps = {
  open: boolean
  nomeServico: string
  onClose: () => void
  onConfirm: () => void | Promise<void>
  excluindo?: boolean
}

export default function ConfirmarExclusaoAgendamentoModal({
  open,
  nomeServico,
  onClose,
  onConfirm,
  excluindo = false,
}: ConfirmarExclusaoAgendamentoModalProps) {
  return (
    <Dialog
      open={open}
      onClose={excluindo ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(8px)',
            bgcolor: 'rgba(15, 23, 42, 0.48)',
          },
        },
        paper: {
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
          },
        },
      }}
    >
      <Box sx={{ bgcolor: '#ffffff', position: 'relative', px: 3, pt: 3, pb: 3 }}>
        <IconButton
          aria-label="Fechar"
          onClick={onClose}
          disabled={excluindo}
          sx={{ position: 'absolute', top: 12, right: 12, color: '#64748b' }}
        >
          <CloseOutlined />
        </IconButton>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', pr: 4, mb: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ErrorOutlineOutlined sx={{ color: '#dc2626', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              component="h2"
              sx={{ fontWeight: 700, color: NAVY, fontSize: '1.125rem' }}
            >
              Confirmar Exclusão
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
              Esta ação não pode ser desfeita
            </Typography>
          </Box>
        </Box>

        <Typography sx={{ color: '#475569', fontSize: '0.9375rem', mb: 3 }}>
          Deseja confirmar a exclusão do agendamento{' '}
          <Typography component="span" sx={{ fontWeight: 700, color: NAVY }}>
            {nomeServico}
          </Typography>
          ?
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button
            type="button"
            variant="outlined"
            onClick={onClose}
            disabled={excluindo}
            sx={{
              borderRadius: '10px',
              px: 2.5,
              fontWeight: 600,
              textTransform: 'none',
              color: '#475569',
              borderColor: BORDER,
            }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="contained"
            onClick={() => void onConfirm()}
            disabled={excluindo}
            sx={{
              borderRadius: '10px',
              px: 2.5,
              fontWeight: 700,
              textTransform: 'none',
              bgcolor: '#dc2626',
              '&:hover': { bgcolor: '#b91c1c' },
            }}
          >
            {excluindo ? 'Excluindo...' : 'Excluir'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
