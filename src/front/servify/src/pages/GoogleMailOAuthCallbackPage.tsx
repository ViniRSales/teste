import { useEffect, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { exchangeGmailOAuthCode } from '../services/gmailOAuth'

type Phase = 'loading' | 'ok' | 'err'

export default function GoogleMailOAuthCallbackPage() {
  const [params] = useSearchParams()
  const [phase, setPhase] = useState<Phase>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const oauthError = params.get('error')
    const code = params.get('code')
    if (oauthError) {
      setPhase('err')
      setMessage(
        params.get('error_description')?.replace(/\+/g, ' ') || oauthError,
      )
      return
    }
    if (!code) {
      setPhase('err')
      setMessage(
        'Nenhum código recebido. Confira se a URI de redirecionamento no Google Cloud é exatamente a desta página.',
      )
      return
    }
    let alive = true
    void (async () => {
      try {
        await exchangeGmailOAuthCode(code)
        if (!alive) return
        setPhase('ok')
      } catch (e: unknown) {
        if (!alive) return
        setPhase('err')
        setMessage(
          e instanceof Error ? e.message : 'Não foi possível concluir a autorização.',
        )
      }
    })()
    return () => {
      alive = false
    }
  }, [params])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 440,
          width: 1,
          p: 3,
          borderRadius: 2,
          bgcolor: '#fff',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e3a5f', mb: 2 }}>
          Conectar Gmail — Servify
        </Typography>

        {phase === 'loading' ? (
          <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={36} />
          </Box>
        ) : null}

        {phase === 'ok' ? (
          <>
            <Typography sx={{ color: '#15803d', mb: 2 }}>
              Conta autorizada. Você já pode enviar convites por e-mail a partir do painel.
            </Typography>
            <Button
              component={RouterLink}
              to="/colaboradores"
              variant="contained"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Voltar para colaboradores
            </Button>
          </>
        ) : null}

        {phase === 'err' ? (
          <>
            <Typography sx={{ color: '#b91c1c', mb: 2 }}>{message}</Typography>
            <Button
              component={RouterLink}
              to="/colaboradores"
              variant="outlined"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Voltar
            </Button>
          </>
        ) : null}
      </Box>
    </Box>
  )
}
