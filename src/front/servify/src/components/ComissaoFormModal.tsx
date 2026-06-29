import { useState, useEffect, type FormEvent } from "react"
import type { ComissaoPayload } from "../services/comissao"
import { Dialog, Box, IconButton, Typography, Button, InputAdornment, TextField, Alert } from '@mui/material'
import { CloseOutlined, LocalOfferOutlined } from '@mui/icons-material'

const NAVY = '#1e3a5f'
const BORDER = '#e2e8f0'

export type ComissaoFormValues = {
    usuarioId: number
    nome: string
    valor: number
}

type ComissaoFormModalProps = {
    open: boolean
    initial?: ComissaoFormValues
    onClose: () => void
    onSubmit: (payload: ComissaoPayload) => void | Promise<void>
}

function validar(valor: string): string | null {
    const n = parseFloat(valor.replace(',', '.'))
    if (!Number.isFinite(n) || n < 0 || n > 100) {
        return 'Informe um valor entre 0,00 e 100,00.'
    }
    return null
}

function toPayload(values: ComissaoFormValues): ComissaoPayload {
    return {
        usuarioId: values.usuarioId,
        valor: values.valor,
    }
}

export default function ComissaoFormModal({
    open,
    initial,
    onClose,
    onSubmit }:
    ComissaoFormModalProps) {
    const [valorInput, setValorInput] = useState('')
    const [erroLocal, setErroLocal] = useState<string | null>(null)
    const [enviando, setEnviando] = useState(false)

    const titulo = 'Editar Comissão'
    const subtitulo = 'Modifique o valor da comissão'
    const labelSubmit = 'Salvar'

    useEffect(() => {
        if (open && initial) {
            setValorInput((initial.valor * 100).toFixed(2).replace('.', ','))
        }
    }, [open, initial])

    async function handleFormSubmit(e: FormEvent) {
        e.preventDefault()

        if (!initial) return;

        const erro = validar(valorInput)
        if (erro) {
            setErroLocal(erro)
            return
        }
        setErroLocal(null)
        setEnviando(true)
        try {
            await onSubmit(toPayload({
                usuarioId: initial.usuarioId,
                nome: initial.nome,
                valor: parseFloat(valorInput.replace(',', '.')) / 100
            }))
        } catch (err) {
            setErroLocal(
                err instanceof Error ? err.message : 'Não foi possível alterar a comissão.',
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
            <Box component="form" onSubmit={handleFormSubmit} sx={{ bgcolor: '#ffffff' }}>
                <Box sx={{ position: 'relative', px: { xs: 2.5, sm: 3 }, pt: 3, pb: 2 }}>
                    <IconButton
                        aria-label="Fechar"
                        onClick={onClose}
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
                                bgcolor: '#e0e7ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <LocalOfferOutlined sx={{ color: NAVY, fontSize: 26 }} />
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
                                {titulo}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: '#64748b', mt: 0.5, fontSize: '0.875rem' }}
                            >
                                {subtitulo}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Box
                    sx={{
                        px: { xs: 2.5, sm: 3 },
                        pb: 2.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2.25,
                    }}
                >
                    <TextField
                        fullWidth
                        label="Comissão (%)"
                        value={valorInput}
                        onChange={(e) => {
                            const v = e.target.value
                            if (/^\d{0,3}([.,]\d{0,2})?$/.test(v)) {
                                setValorInput(v)
                            }
                        }}
                        placeholder="Ex: 10"
                        inputMode="numeric"
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">%</InputAdornment>
                                ),
                            },
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '10px',
                                '& fieldset': { borderColor: BORDER },
                            },
                        }}
                        onBlur={() => {
                            const n = parseFloat(valorInput.replace(',', '.'))
                            if (Number.isFinite(n)) {
                                setValorInput(n.toFixed(2).replace('.', ','))
                            }
                        }}
                    />
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
                            {enviando ? 'Salvando…' : labelSubmit}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Dialog>)
}