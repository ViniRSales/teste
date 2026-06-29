import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
import PersonOutlined from '@mui/icons-material/PersonOutlined'
import EmailOutlined from '@mui/icons-material/EmailOutlined'
import PhoneOutlined from '@mui/icons-material/PhoneOutlined'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import BadgeOutlined from '@mui/icons-material/BadgeOutlined'
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import TagOutlined from '@mui/icons-material/TagOutlined'
import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined'
import MapOutlined from '@mui/icons-material/MapOutlined'
import LocationCityOutlined from '@mui/icons-material/LocationCityOutlined'
import PublicOutlined from '@mui/icons-material/PublicOutlined'
import LockOutlined from '@mui/icons-material/LockOutlined'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import {
  cepDigits,
  fetchAddressByCep,
  formatCepDisplay,
} from '../services/viacep'
import { maskCpf, maskEmailInput, maskPhoneBr } from '../utils/masks'
import { apiPostJson, mensagemDeErroCapturado } from '../services/api'
import { toastCadastroErro, toastCadastroSucesso } from '../components/showAlert'
import './styles/RegisterPage.css'

const UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const

type FormState = {
  nome: string
  email: string
  telefone: string
  dataNascimento: string
  cpf: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  senha: string
  confirmarSenha: string
}

const initialForm: FormState = {
  nome: '',
  email: '',
  telefone: '',
  dataNascimento: '',
  cpf: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  senha: '',
  confirmarSenha: '',
}

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [cepLoading, setCepLoading] = useState(false)
  const [cepHelperText, setCepHelperText] = useState<string | null>(null)
  const cepAbortRef = useRef<AbortController | null>(null)
  const navigate = useNavigate()

  function setField<K extends keyof FormState>(key: K) {
    return (ev: React.ChangeEvent<HTMLInputElement>) => {
      setForm((s) => ({ ...s, [key]: ev.target.value }))
    }
  }

  function handleEmailChange(ev: React.ChangeEvent<HTMLInputElement>) {
    setForm((s) => ({ ...s, email: maskEmailInput(ev.target.value) }))
  }

  function handleTelefoneChange(ev: React.ChangeEvent<HTMLInputElement>) {
    setForm((s) => ({ ...s, telefone: maskPhoneBr(ev.target.value) }))
  }

  function handleCpfChange(ev: React.ChangeEvent<HTMLInputElement>) {
    setForm((s) => ({ ...s, cpf: maskCpf(ev.target.value) }))
  }

  function handleCepChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const digits = cepDigits(ev.target.value)
    const display = formatCepDisplay(digits)
    setForm((s) => ({ ...s, cep: display }))
    setCepHelperText(null)

    cepAbortRef.current?.abort()

    if (digits.length !== 8) {
      setCepLoading(false)
      cepAbortRef.current = null
      return
    }

    const controller = new AbortController()
    cepAbortRef.current = controller
    setCepLoading(true)

    void (async () => {
      try {
        const addr = await fetchAddressByCep(digits, controller.signal)
        if (cepAbortRef.current !== controller) return
        if (!addr) {
          setCepHelperText('CEP não encontrado.')
          return
        }
        setForm((s) => ({
          ...s,
          cep: display,
          logradouro: addr.logradouro,
          bairro: addr.bairro,
          cidade: addr.cidade,
          uf: addr.uf,
        }))
      } catch (e: unknown) {
        if (cepAbortRef.current !== controller) return
        if (e instanceof DOMException && e.name === 'AbortError') return
        setCepHelperText('Não foi possível buscar o CEP. Tente novamente.')
      } finally {
        if (cepAbortRef.current === controller) {
          setCepLoading(false)
        }
      }
    })()
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const nome = form.nome.trim()
    const email = form.email.trim()
    const cpfDigits = form.cpf.replace(/\D/g, '')

    if (!nome) {
      toastCadastroErro('Informe o nome completo.')
      return
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toastCadastroErro('Informe um e-mail válido.')
      return
    }
    if (cpfDigits.length !== 11) {
      toastCadastroErro('CPF deve ter 11 dígitos.')
      return
    }
    if (!form.senha || form.senha.length < 6) {
      toastCadastroErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (form.senha !== form.confirmarSenha) {
      toastCadastroErro('Senha e confirmação não conferem.')
      return
    }

    try {
      await apiPostJson('/usuarios/cadastro-cliente', {
        perfilId: 3,
        cpf: cpfDigits,
        nome,
        email,
        senha: form.senha,
        telefone: form.telefone.replace(/\D/g, ''),
        dataNascimento: form.dataNascimento,
        cep: form.cep.replace(/\D/g, ''),
        logradouro: form.logradouro,
        numero: form.numero,
        complemento: form.complemento,
        bairro: form.bairro,
        cidade: form.cidade,
        uf: form.uf,
      })

      toastCadastroSucesso('Cadastro realizado com sucesso!')
      setForm(initialForm)

      setTimeout(() => {
        navigate('/login')
      }, 2500)
    } catch (err) {
      toastCadastroErro(
        mensagemDeErroCapturado(
          err,
          'Não foi possível concluir o cadastro. Tente novamente.',
        ),
      )
    }
  }

  return (
    <Box className="register-page">
      <Card className="register-card" elevation={0} variant="outlined">
        <Typography
          className="register-title"
          variant="h5"
          component="h1"
          align="center"
          color="text.primary"
        >
          Cadastro de Cliente
        </Typography>
        <Typography
          className="register-subtitle"
          variant="body2"
          component="p"
          align="center"
          color="text.secondary"
        >
          Preencha os dados do cliente para criar uma conta
        </Typography>

        <br />

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Box className="register-field">
                <Typography
                  className="register-label"
                  variant="body2"
                  component="label"
                  htmlFor="reg-nome"
                  color="text.primary"
                >
                  Nome completo
                </Typography>
                <TextField
                  id="reg-nome"
                  name="nome"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  autoComplete="name"
                  placeholder="Seu nome completo"
                  value={form.nome}
                  onChange={setField('nome')}
                  slotProps={{
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
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box className="register-field">
                <Typography
                  className="register-label"
                  variant="body2"
                  component="label"
                  htmlFor="reg-email"
                  color="text.primary"
                >
                  E-mail
                </Typography>
                <TextField
                  id="reg-email"
                  name="email"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={handleEmailChange}
                  slotProps={{
                    htmlInput: {
                      inputMode: 'email',
                      autoCapitalize: 'off',
                      spellCheck: false,
                    },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box className="register-field">
                <Typography
                  className="register-label"
                  variant="body2"
                  component="label"
                  htmlFor="reg-telefone"
                  color="text.primary"
                >
                  Telefone
                </Typography>
                <TextField
                  id="reg-telefone"
                  name="telefone"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                  value={form.telefone}
                  onChange={handleTelefoneChange}
                  slotProps={{
                    htmlInput: { maxLength: 15, inputMode: 'tel' },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className="register-field">
                <Typography
                  className="register-label"
                  variant="body2"
                  component="label"
                  htmlFor="reg-nascimento"
                  color="text.primary"
                >
                  Data de nascimento
                </Typography>
                <DatePicker
                  format="DD/MM/YYYY"
                  openTo="day"
                  views={['year', 'month', 'day']}
                  value={
                    form.dataNascimento
                      ? dayjs(form.dataNascimento)
                      : null
                  }
                  onChange={(newValue) => {
                    setForm((s) => ({
                      ...s,
                      dataNascimento:
                        newValue && dayjs(newValue).isValid()
                          ? dayjs(newValue).format('YYYY-MM-DD')
                          : '',
                    }))
                  }}
                  maxDate={dayjs()}
                  minDate={dayjs().subtract(120, 'year')}
                  slotProps={{
                    textField: {
                      id: 'reg-nascimento',
                      name: 'dataNascimento',
                      fullWidth: true,
                      size: 'small',
                      variant: 'outlined',
                      hiddenLabel: true,
                      className: 'register-input',
                      slotProps: {
                        htmlInput: { placeholder: 'DD/MM/AAAA' },
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarMonthOutlined fontSize="small" />
                            </InputAdornment>
                          ),
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className="register-field">
                <Typography
                  className="register-label"
                  variant="body2"
                  component="label"
                  htmlFor="reg-cpf"
                  color="text.primary"
                >
                  CPF
                </Typography>
                <TextField
                  id="reg-cpf"
                  name="cpf"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={handleCpfChange}
                  slotProps={{
                    htmlInput: { maxLength: 14, inputMode: 'numeric' },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>
          </Grid>

          <br />

          <Typography
            className="register-section-title"
            component="h2"
            variant="subtitle2"
          >
            Endereço
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <Box className="register-field">
                <Typography
                  className="register-label"
                  variant="body2"
                  component="label"
                  htmlFor="reg-cep"
                  color="text.primary"
                >
                  CEP
                </Typography>
                <TextField
                  id="reg-cep"
                  name="cep"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  placeholder="00000-000"
                  value={form.cep}
                  onChange={handleCepChange}
                  disabled={cepLoading}
                  error={Boolean(cepHelperText)}
                  helperText={cepHelperText || undefined}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOnOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: cepLoading ? (
                        <InputAdornment position="end">
                          <CircularProgress color="inherit" size={18} />
                        </InputAdornment>
                      ) : undefined,
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 8, md: 9 }}>
              <Box className="register-field">
                <Typography
                  className="register-label"
                  variant="body2"
                  component="label"
                  htmlFor="reg-logradouro"
                  color="text.primary"
                >
                  Logradouro
                </Typography>
                <TextField
                  id="reg-logradouro"
                  name="logradouro"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  autoComplete="street-address"
                  placeholder="Rua, Avenida..."
                  value={form.logradouro}
                  onChange={setField('logradouro')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <HomeOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <Box className="register-field">
                <Typography
                  className="register-label"
                  variant="body2"
                  component="label"
                  htmlFor="reg-numero"
                  color="text.primary"
                >
                  Número
                </Typography>
                <TextField
                  id="reg-numero"
                  name="numero"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  placeholder="Nº"
                  value={form.numero}
                  onChange={setField('numero')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <TagOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 5 }}>
              <Box className="register-field">
                <Typography
                  className="register-label"
                  variant="body2"
                  component="label"
                  htmlFor="reg-complemento"
                  color="text.primary"
                >
                  Complemento
                </Typography>
                <TextField
                  id="reg-complemento"
                  name="complemento"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  placeholder="Apto, Bloco..."
                  value={form.complemento}
                  onChange={setField('complemento')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <ApartmentOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 4 }}>
              <Box className="register-field">
                <Typography
                  className="register-label"
                  variant="body2"
                  component="label"
                  htmlFor="reg-bairro"
                  color="text.primary"
                >
                  Bairro
                </Typography>
                <TextField
                  id="reg-bairro"
                  name="bairro"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  placeholder="Bairro"
                  value={form.bairro}
                  onChange={setField('bairro')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <MapOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 8, md: 7 }}>
              <Box className="register-field">
                <Typography
                  className="register-label"
                  variant="body2"
                  component="label"
                  htmlFor="reg-cidade"
                  color="text.primary"
                >
                  Cidade
                </Typography>
                <TextField
                  id="reg-cidade"
                  name="cidade"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  autoComplete="address-level2"
                  placeholder="Cidade"
                  value={form.cidade}
                  onChange={setField('cidade')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationCityOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 5 }}>
              <Box className="register-field">
                <Typography
                  className="register-label"
                  variant="body2"
                  component="label"
                  htmlFor="reg-uf"
                  color="text.primary"
                >
                  UF
                </Typography>
                <TextField
                  id="reg-uf"
                  name="uf"
                  className="register-input"
                  select
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  value={form.uf}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, uf: e.target.value }))
                  }
                  slotProps={{
                    select: { displayEmpty: true },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PublicOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Selecione</em>
                  </MenuItem>
                  {UFS.map((uf) => (
                    <MenuItem key={uf} value={uf}>
                      {uf}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Grid>
          </Grid>

          <br />

          <Typography
            className="register-section-title"
            component="h2"
            variant="subtitle2"
          >
            Segurança
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box className="register-field">
                <Typography
                  className="register-label"
                  variant="body2"
                  component="label"
                  htmlFor="reg-senha"
                  color="text.primary"
                >
                  Senha
                </Typography>
                <TextField
                  id="reg-senha"
                  name="senha"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.senha}
                  onChange={setField('senha')}
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
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box className="register-field">
                <Typography
                  className="register-label"
                  variant="body2"
                  component="label"
                  htmlFor="reg-confirmar"
                  color="text.primary"
                >
                  Confirmar senha
                </Typography>
                <TextField
                  id="reg-confirmar"
                  name="confirmarSenha"
                  className="register-input"
                  fullWidth
                  hiddenLabel
                  variant="outlined"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  value={form.confirmarSenha}
                  onChange={setField('confirmarSenha')}
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
            </Grid>
          </Grid>

          <Button
            type="submit"
            color="primary"
            variant="contained"
            fullWidth
            className="register-submit"
          >
            Cadastrar Cliente
          </Button>
        </Box>


        <br />

        <Typography
          className="register-footer"
          variant="body2"
          component="p"
          align="center"
          color="text.secondary"
        >
          <Box component="span" className="register-footer__muted">
            Já tem uma conta? {''}
          </Box>
          <Link
            component={RouterLink}
            to="/login"
            underline="hover"
            className="register-footer__link"
          >
            Fazer login
          </Link>
        </Typography>
      </Card>
    </Box>
  )
}
