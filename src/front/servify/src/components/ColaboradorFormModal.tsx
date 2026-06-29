import { useEffect, useState, type FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import EmailOutlined from '@mui/icons-material/EmailOutlined'
import PersonAddOutlined from '@mui/icons-material/PersonAddOutlined'
import WorkOutlineOutlined from '@mui/icons-material/WorkOutlineOutlined'
import {
  labelPerfilColaborador,
  PERFIS_COLABORADOR,
} from '../utils/perfilColaborador'

const NAVY = '#1e3a5f'
const BORDER = '#e2e8f0'

type ColaboradorFormModalProps = {
  open: boolean
  email: string
  cargo: string
  onEmailChange: (value: string) => void
  onCargoChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void | Promise<void>
}

export default function ColaboradorFormModal({
  open,
  email,
  cargo,
  onEmailChange,
  onCargoChange,
  onClose,
  onSubmit,
}: ColaboradorFormModalProps) {
  const [erroLocal, setErroLocal] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setErroLocal(null)
        setEnviando(false)
      })
      return
    }
    queueMicrotask(() => setErroLocal(null))
  }, [open])

  async function handleFormSubmit(e: FormEvent) {
    e.preventDefault()
    const emailTrim = email.trim()
    const cargoTrim = cargo.trim()
    if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setErroLocal('Informe um email válido.')
      return
    }
    if (!cargoTrim) {
      setErroLocal('Selecione um perfil.')
      return
    }
    setErroLocal(null)
    setEnviando(true)
    try {
      await Promise.resolve(onSubmit())
    } catch (err) {
      setErroLocal(
        err instanceof Error
          ? err.message
          : 'Não foi possível enviar o convite.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
      <Box
        component="form"
        onSubmit={handleFormSubmit}
        sx={{ bgcolor: '#ffffff' }}
      >
        <Box sx={{ position: 'relative', px: { xs: 2.5, sm: 3 }, pt: 3, pb: 2 }}>
          <IconButton
            aria-label="Fechar"
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              color: '#64748b',
            }}
          >
            <CloseOutlined />
          </IconButton>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', pr: 4 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: '#e0e7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PersonAddOutlined sx={{ color: NAVY, fontSize: 26 }} />
            </Box>
            <Box sx={{ minWidth: 0, pt: 0.25 }}>
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  fontWeight: 700,
                  color: NAVY,
                  fontSize: '1.125rem',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.3,
                }}
              >
                Convidar Colaborador
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: '#64748b', mt: 0.5, fontSize: '0.875rem' }}
              >
                Envie um convite por email
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ px: { xs: 2.5, sm: 3 }, pb: 2.5, display: 'flex', flexDirection: 'column', gap: 2.25 }}>
          <Box>
            <Typography
              component="label"
              htmlFor="colab-email"
              sx={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#475569',
                mb: 0.75,
              }}
            >
              Email do colaborador
            </Typography>
            <TextField
              id="colab-email"
              name="email"
              fullWidth
              type="email"
              autoComplete="email"
              placeholder="colaborador@empresa.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              variant="outlined"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined sx={{ color: '#9ca3af', fontSize: 22 }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  '& fieldset': { borderColor: BORDER },
                },
              }}
            />
          </Box>

          <Box>
            <Typography
              component="label"
              htmlFor="colab-perfil"
              sx={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#475569',
                mb: 0.75,
              }}
            >
              Perfil
            </Typography>
            <TextField
              id="colab-perfil"
              name="cargo"
              select
              fullWidth
              value={cargo}
              onChange={(e) => onCargoChange(e.target.value)}
              variant="outlined"
              slotProps={{
                select: {
                  displayEmpty: true,
                  renderValue: (v: unknown) =>
                    v === '' || v == null ? (
                      <Typography component="span" sx={{ color: '#9ca3af' }}>
                        Selecione o perfil
                      </Typography>
                    ) : (
                      labelPerfilColaborador(String(v))
                    ),
                },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <WorkOutlineOutlined sx={{ color: '#9ca3af', fontSize: 22 }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  '& fieldset': { borderColor: BORDER },
                },
              }}
            >
              <MenuItem value="" disabled sx={{ color: '#9ca3af' }}>
                Selecione o perfil
              </MenuItem>
              {PERFIS_COLABORADOR.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  {p.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>

        <Box
          sx={{
            px: { xs: 2.5, sm: 3 },
            pb: 3,
            pt: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {erroLocal ? (
            <Alert severity="error" onClose={() => setErroLocal(null)}>
              {erroLocal}
            </Alert>
          ) : null}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Button
              type="button"
              variant="outlined"
              onClick={onClose}
              disabled={enviando}
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
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={enviando}
              sx={{
                borderRadius: '10px',
                px: 2.5,
                py: 1,
                fontWeight: 700,
                textTransform: 'none',
                bgcolor: NAVY,
                '&:hover': { bgcolor: '#162d4a' },
              }}
            >
              {enviando ? 'Enviando…' : 'Enviar Convite'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  )
}
