import { useNavigate } from "react-router-dom"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
    getColaboradoresComissao,
    criarComissao,
    atualizarComissao,
    type ColaboradorComissao,
    type ComissaoPayload,
} from "../services/comissao"
import { mensagemDeErroCapturado } from "../services/api"
import { toastCadastroSucesso, toastError } from "../components/showAlert"
import { useSidebarLayout } from '../context/SidebarLayoutContext'
import { Box, Container, IconButton, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material"
import ViewSidebarOutlined from '@mui/icons-material/ViewSidebarOutlined'
import { ArrowBackOutlined, EditOutlined, LocalOfferOutlined, Search } from "@mui/icons-material"
import ComissaoFormModal, {
    type ComissaoFormValues,
}
    from "../components/ComissaoFormModal"

const NAVY = '#1e3a5f'
const BORDER = '#e2e8f0'
const PAGE_BG = '#f8fafc'

export default function ComissaoPage() {
    const navigate = useNavigate()
    const { sidebarExpanded, toggleSidebar } = useSidebarLayout()
    const [busca, setBusca] = useState('')
    const [comissoes, setComissao] = useState<ColaboradorComissao[]>([])
    const [loading, setLoading] = useState(true)

    const [formOpen, setFormOpen] = useState(false)
    const [formInitial, setFormInitial] = useState<ComissaoFormValues | undefined>()
    const [editingColaborador, setEditingColaborador] = useState<ColaboradorComissao | null>(null)


    const carregarColaboradoresComissao = useCallback(async () => {
        const data = await getColaboradoresComissao()
        setComissao(data)
    }, [])

    useEffect(() => {
        let alive = true
        void (async () => {
            try {
                const data = await getColaboradoresComissao()
                if (!alive) return
                setComissao(data)
            } catch (e: unknown) {
                if (!alive) return
                toastError(
                    mensagemDeErroCapturado(e, 'Não foi possível carregar os serviços.')
                )
            } finally {
                queueMicrotask(() => {
                    if (alive) setLoading(false)
                })
            }
        })()
        return () => {
            alive = false
        }
    }, [])

    function abrirEditar(row: ColaboradorComissao) {
        setFormOpen(true)
        setEditingColaborador(row)
        setFormInitial({
            usuarioId: row.usuarioId,
            nome: row.usuarioNome,
            valor: row.valor,
        })
    }

    function fecharForm() {
        setFormOpen(false)
        setEditingColaborador(null)
        setFormInitial(undefined)
    }

    async function handleSalvarForm(payload: ComissaoPayload) {
        try {
            if (editingColaborador?.comissaoId) {
                await atualizarComissao(editingColaborador.comissaoId, payload)
            }
            else if (editingColaborador) {
                await criarComissao(payload)
            }
            await carregarColaboradoresComissao()
            fecharForm()
            toastCadastroSucesso('Comissão atualizada com sucesso!')
        } catch (e: unknown) {
            throw new Error(
                mensagemDeErroCapturado(e, 'Não foi possível salvar a comissão.')
            )
        }
    }

    const filtrados = useMemo(() => {
        const q = busca.trim().toLowerCase()
        if (!q) return comissoes
        return comissoes.filter((c) => c.usuarioNome.toLowerCase().includes(q))
    }, [busca, comissoes])

    function formatarValorPercentual(valor: number): string {
        return `${(valor * 100).toFixed(2).replace('.', ',')}%`
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: PAGE_BG }}>
            <Box
                sx={{
                    bgcolor: '#FFFFFF',
                    borderBottom: `1px solid ${BORDER}`,
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <IconButton
                    edge="start"
                    aria-label={
                        sidebarExpanded ? 'Fechar menu lateral' : 'Abrir menu lateral'
                    }
                    aria-expanded={sidebarExpanded}
                    onClick={toggleSidebar}
                    sx={{
                        color: NAVY,
                        alignSelf: 'center',
                        ml: { xs: 0.75, sm: 1 },
                        borderRadius: 1,
                    }}
                >
                    <ViewSidebarOutlined sx={{ fontSize: 26 }} />
                </IconButton>
                <Container
                    maxWidth="lg"
                    sx={{
                        flex: 1,
                        py: 2.5,
                        pr: { xs: 2, sm: 3 },
                        pl: { xs: 1, sm: 2 },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        minWidth: 0,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        <IconButton
                            aria-label="Voltar"
                            onClick={() => navigate('/agendamentos')}
                            sx={{ color: NAVY, mr: 0.5 }}
                        >
                            <ArrowBackOutlined />
                        </IconButton>
                        <LocalOfferOutlined sx={{ fontSize: 28, color: NAVY }} />
                        <Typography
                            variant="h6"
                            component="h1"
                            sx={{
                                fontWeight: 700,
                                color: NAVY,
                                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                                letterSpacing: '-0.02em',
                            }}
                        >
                            Gerenciar Comissões
                        </Typography>
                    </Box>
                </Container>
            </Box>
            <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Buscar colaborador..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    disabled={loading}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: '#9ca3af', fontSize: 22 }} />
                                </InputAdornment>
                            ),
                        },
                    }}
                    sx={{
                        mb: 2.5,
                        '& .MuiOutlinedInput-root': {
                            bgcolor: '#ffffff',
                            borderRadius: '10px',
                            '& fieldset': { borderColor: BORDER },
                        },
                    }}
                />
                <TableContainer
                    sx={{
                        border: `1px solid ${BORDER}`,
                        borderRadius: '12px',
                        bgcolor: '#ffffff',
                        overflow: 'hidden',
                    }}
                >
                    <Table size="medium">
                        <TableHead>
                            <TableRow
                                sx={{
                                    bgcolor: '#f1f5f9',
                                    '& th': {
                                        borderBottom: `1px solid ${BORDER}`,
                                        color: '#334155',
                                        fontWeight: 700,
                                        fontSize: '0.875rem',
                                        py: 2,
                                        px: 2.5,
                                    },
                                }}
                            >
                                <TableCell>Nome do Colaborador</TableCell>
                                <TableCell width="14%">Comissão</TableCell>
                                <TableCell width="12%" align="right">
                                    Ações
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtrados.map((row, index) => (
                                <TableRow
                                    key={row.usuarioId}
                                    sx={{
                                        '&:last-child td': { borderBottom: 0 },
                                        '& td': {
                                            borderBottom:
                                                index < filtrados.length - 1
                                                    ? `1px solid ${BORDER}`
                                                    : 'none',
                                            py: 2,
                                            px: 2.5,
                                            verticalAlign: 'middle',
                                        },
                                    }}
                                >
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 700, color: NAVY }}>
                                            {row.usuarioNome}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography sx={{ color: '#64748b', fontSize: '0.9375rem' }}>
                                            {formatarValorPercentual(row.valor)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                                gap: 0.5,
                                            }}
                                        >
                                            <IconButton
                                                aria-label="Editar serviço"
                                                size="small"
                                                sx={{ color: '#0ea5e9' }}
                                                onClick={() => abrirEditar(row)}
                                            >
                                                <EditOutlined fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && filtrados.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} sx={{ py: 4 }}>
                                        <Typography sx={{ color: '#64748b', textAlign: 'center' }}>
                                            Nenhum colaborador encontrado.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Typography
                    variant="body2"
                    sx={{ mt: 2, color: '#94a3b8', fontSize: '0.875rem' }}
                >
                    {loading
                        ? 'Carregando colaboradores...'
                        : `${filtrados.length} colaborador${filtrados.length === 1 ? '' : 'es'} encontrado${filtrados.length === 1 ? '' : 's'}`}
                </Typography>
            </Container>
            <ComissaoFormModal
                open={formOpen}
                initial={formInitial}
                onClose={fecharForm}
                onSubmit={handleSalvarForm}
            />
        </Box >
    )
}
