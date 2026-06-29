import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import InputAdornment from '@mui/material/InputAdornment'
import PersonOutlined from '@mui/icons-material/PersonOutlined'
import LockOutlined from '@mui/icons-material/LockOutlined'
import logoCompleta from '../assets/logo-completa.png'
import { toastError } from '../components/showAlert'
import {
  canAccessPrivateRoute,
  getDefaultAuthenticatedRoute,
  setSession,
} from '../auth/session'
import { mensagemDeErroCapturado } from '../services/api'
import { loginApi } from '../services/auth'
import './styles/LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const userEmail = email.trim()
    if (!userEmail || !password) {
      toastError('Preencha e-mail e senha.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      toastError('Informe um e-mail válido.')
      return
    }

    if (password.length < 6) {
      toastError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    try {
      setLoading(true)
      const user = await loginApi(userEmail, password)
      setSession({ user })

      const tokenConv = user.conviteToken?.trim()
      if (user.cadastroPendente && tokenConv) {
        navigate(`/convite/${encodeURIComponent(tokenConv)}`, { replace: true })
        return
      }

      const from = (location.state as { from?: { pathname?: string } } | null)?.from
      const fromPath = from?.pathname && typeof from.pathname === 'string' ? from.pathname : ''
      const target = fromPath && canAccessPrivateRoute(user, fromPath)
        ? fromPath
        : getDefaultAuthenticatedRoute()
      navigate(target, { replace: true })
    } catch (e: unknown) {
      toastError(
        mensagemDeErroCapturado(e, 'Não foi possível entrar. Tente novamente.'),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box className="login-page">
      <Card className="login-card" elevation={0} variant="outlined">
        <Box
          component="img"
          src={logoCompleta}
          alt="Servify - Gestão de serviços inteligente"
          className="login-logo"
        />

        <Box
          component="form"
          className="login-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <Stack spacing={4}>
            <Stack spacing={2.5}>
              <Box className="login-field">
                <Typography
                  className="login-label"
                  variant="body2"
                  component="label"
                  htmlFor="login-user"
                  color="text.primary"
                >
                  Login
                </Typography>
                <TextField
                  id="login-user"
                  name="login"
                  className="login-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  type="email"
                  autoComplete="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  slotProps={{
                    htmlInput: {
                      inputMode: 'email',
                      autoCapitalize: 'off',
                      spellCheck: false,
                    },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>

              <Box className="login-field">
                <Typography
                  className="login-label"
                  variant="body2"
                  component="label"
                  htmlFor="login-password"
                  color="text.primary"
                >
                  Senha
                </Typography>
                <TextField
                  id="login-password"
                  name="password"
                  className="login-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Stack>

            <Button
              type="submit"
              color="primary"
              variant="contained"
              fullWidth
              className="login-submit"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </Stack>
        </Box>

        <br />
        <Typography
          className="login-footer"
          variant="body2"
          component="p"
          align="center"
          color="text.secondary"
        >
          <Box component="span" className="login-footer__muted">
            Não tenho cadastro?
          </Box>
          <Link
            component={RouterLink}
            to="/cadastro"
            underline="hover"
            className="login-footer__link"
          >
            Criar conta
          </Link>
        </Typography>
      </Card>
    </Box>
  )
}
