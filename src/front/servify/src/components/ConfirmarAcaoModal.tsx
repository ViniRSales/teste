import type { ReactNode } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined'

const BORDER = '#e2e8f0'

type ConfirmarAcaoModalProps = {
  open: boolean
  titulo: string
  mensagem: ReactNode
  labelConfirmar?: string
  labelCancelar?: string
  corConfirmar?: string
  corConfirmarHover?: string
  carregando?: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmarAcaoModal({
  open,
  titulo,
  mensagem,
  labelConfirmar = 'Confirmar',
  labelCancelar = 'Cancelar',
  corConfirmar = '#f59e0b',
  corConfirmarHover = '#d97706',
  carregando = false,
  onConfirm,
  onClose,
}: ConfirmarAcaoModalProps) {
  return (
    <Dialog
      open={open}
      onClose={carregando ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      scroll="body"
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
            boxShadow:
              '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.03)',
          },
        },
      }}
    >
      <Box sx={{ bgcolor: '#ffffff' }}>
        {/* Cabeçalho */}
        <Box sx={{ position: 'relative', px: { xs: 2.5, sm: 3 }, pt: 3, pb: 2 }}>
          <IconButton
            aria-label="Fechar"
            onClick={onClose}
            disabled={carregando}
            sx={{ position: 'absolute', top: 12, right: 12, color: '#64748b' }}
          >
            <CloseOutlined />
          </IconButton>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', pr: 4 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <WarningAmberOutlined sx={{ color: '#d97706', fontSize: 26 }} />
            </Box>
            <Box sx={{ minWidth: 0, pt: 0.25 }}>
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  fontWeight: 700,
                  color: '#1e3a5f',
                  fontSize: '1.125rem',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.3,
                }}
              >
                {titulo}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Mensagem */}
        <Box sx={{ px: { xs: 2.5, sm: 3 }, pb: 2.5 }}>
          <Typography
            sx={{
              color: '#475569',
              fontSize: '0.9375rem',
              lineHeight: 1.6,
            }}
          >
            {mensagem}
          </Typography>
        </Box>

        {/* Rodapé */}
        <Box
          sx={{
            px: { xs: 2.5, sm: 3 },
            pb: 3,
            pt: 1,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1.5,
          }}
        >
          <Button
            type="button"
            variant="outlined"
            onClick={onClose}
            disabled={carregando}
            sx={{
              borderRadius: '10px',
              px: 2.5,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              color: '#475569',
              borderColor: BORDER,
              '&:hover': { borderColor: '#cbd5e1' },
            }}
          >
            {labelCancelar}
          </Button>
          <Button
            type="button"
            variant="contained"
            onClick={onConfirm}
            disabled={carregando}
            sx={{
              borderRadius: '10px',
              px: 2.5,
              py: 1,
              fontWeight: 700,
              textTransform: 'none',
              bgcolor: corConfirmar,
              boxShadow: 'none',
              '&:hover': { bgcolor: corConfirmarHover, boxShadow: 'none' },
            }}
          >
            {carregando ? 'Aguarde...' : labelConfirmar}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
