import { useEffect, useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { SvgIconProps } from '@mui/material/SvgIcon'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined'
import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded'
import AttachMoneyOutlined from '@mui/icons-material/AttachMoneyOutlined'
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined'
import ContentCutOutlined from '@mui/icons-material/ContentCutOutlined'
import EmojiEventsOutlined from '@mui/icons-material/EmojiEventsOutlined'
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined'
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined'
import GroupsOutlined from '@mui/icons-material/GroupsOutlined'
import MilitaryTechOutlined from '@mui/icons-material/MilitaryTechOutlined'
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined'
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined'
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined'
import WorkspacePremiumOutlined from '@mui/icons-material/WorkspacePremiumOutlined'
import dayjs, { type Dayjs } from 'dayjs'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { mensagemDeErroCapturado } from '../services/api'
import {
  dashboardPeriods,
  getDashboardData,
  type DashboardChartPoint,
  type DashboardData,
  type DashboardInsightIcon,
  type DashboardKpi,
  type DashboardKpiIcon,
  type DashboardMetric,
  type DashboardPeriod,
  type DashboardRankingRow,
  type DashboardWeekdayMetric,
} from '../services/dashboard'

const BLUE = '#2563eb'
const GREEN = '#10b981'
const BORDER = '#e2e8f0'
const PAGE_BG = '#f8fafc'
const MUTED = '#64748b'
const TEXT = '#0f172a'

type IconType = React.ComponentType<SvgIconProps>

const kpiIcons: Record<DashboardKpiIcon, IconType> = {
  money: AttachMoneyOutlined,
  wallet: AccountBalanceWalletOutlined,
  check: FactCheckOutlined,
  receipt: ReceiptLongOutlined,
  crown: WorkspacePremiumOutlined,
  trend: TrendingUpOutlined,
  trophy: EmojiEventsOutlined,
  award: MilitaryTechOutlined,
}

const insightIcons: Record<DashboardInsightIcon, IconType> = {
  crown: WorkspacePremiumOutlined,
  trophy: EmojiEventsOutlined,
  wallet: AccountBalanceWalletOutlined,
  trend: TrendingUpOutlined,
}

const emptyDashboard: DashboardData = {
  kpis: [],
  revenueSeries: [],
  categoryServices: [],
  weekdayServices: [],
  revenueByService: [],
  commissionByEmployee: [],
  rankings: {
    servicesRevenue: [],
    servicesCount: [],
    employeesWork: [],
    employeesCommission: [],
    clients: [],
  },
  summary: {
    growth: '+0,0%',
    newClients: '+0',
    retention: '0%',
  },
  insights: [],
}

const BRL = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })

function Card({
  children,
  sx,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode
  sx?: Record<string, unknown>
  onClick?: () => void
  ariaLabel?: string
}) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    onClick()
  }

  return (
    <Box
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      sx={{
        bgcolor: '#ffffff',
        border: `1px solid ${BORDER}`,
        borderRadius: '18px',
        boxShadow:
          '0 1px 2px rgba(15, 23, 42, 0.04), 0 10px 24px rgba(15, 23, 42, 0.04)',
        ...(onClick
          ? {
            cursor: 'pointer',
            transition: 'transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              borderColor: '#bfdbfe',
              boxShadow:
                '0 4px 10px rgba(15, 23, 42, 0.06), 0 16px 32px rgba(37, 99, 235, 0.10)',
            },
            '&:focus-visible': {
              outline: `3px solid ${BLUE}33`,
              outlineOffset: 3,
            },
          }
          : {}),
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}

function Delta({ value }: { value: number }) {
  const positive = value >= 0
  const Icon = positive ? ArrowUpwardRounded : ArrowDownwardRounded

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.35,
        borderRadius: 999,
        px: 1,
        py: 0.25,
        bgcolor: positive ? 'rgba(16, 185, 129, 0.10)' : 'rgba(244, 63, 94, 0.10)',
        color: positive ? '#059669' : '#e11d48',
        fontSize: '0.72rem',
        fontWeight: 800,
      }}
    >
      <Icon sx={{ fontSize: 14 }} />
      {positive ? '+' : ''}
      {value.toFixed(1).replace('.', ',')}%
    </Box>
  )
}

type KpiCardProps = DashboardKpi & {
  onClick?: () => void
}

type KpiExplanation = {
  analyzed: string
  how: string
  formula: string
  numberMeaning: string
  trendMeaning: string
  betterWhen: string
}

const kpiExplanations: Record<string, KpiExplanation> = {
  'Faturamento total': {
    analyzed: 'Soma o valor final dos agendamentos válidos no período selecionado.',
    how: 'O cálculo considera cada agendamento não cancelado, usando o valor do serviço com o desconto aplicado.',
    formula: 'Faturamento total = Σ(valor do serviço - desconto)',
    numberMeaning: 'O número exibido é o total em reais recebido nos atendimentos do período.',
    trendMeaning: 'A seta compara o faturamento atual com o período anterior equivalente.',
    betterWhen: 'Melhor quando sobe, pois indica aumento de receita.',
  },
  'Comissões pagas': {
    analyzed: 'Mostra quanto deve ser pago em comissão aos colaboradores no período.',
    how: 'Para cada atendimento, o dashboard aplica a comissão cadastrada sobre o valor final do serviço e soma os resultados.',
    formula: 'Comissões pagas = Σ(valor final do atendimento × percentual de comissão)',
    numberMeaning: 'O número exibido é o total em reais destinado a comissões no período.',
    trendMeaning: 'A seta compara o total de comissões pagas com o período anterior equivalente.',
    betterWhen: 'Depende do contexto: pode subir junto com mais vendas, mas como custo isolado é melhor quando cai proporcionalmente ao faturamento.',
  },
  'Serviços realizados': {
    analyzed: 'Conta quantos atendimentos foram registrados no período selecionado.',
    how: 'Entram apenas agendamentos que não estão cancelados e que caem dentro do filtro de data escolhido.',
    formula: 'Serviços realizados = quantidade de agendamentos válidos',
    numberMeaning: 'O número exibido é a quantidade de serviços atendidos no período.',
    trendMeaning: 'A seta compara essa quantidade com a quantidade do período anterior equivalente.',
    betterWhen: 'Melhor quando sobe, pois indica maior volume de atendimentos.',
  },
  'Ticket médio': {
    analyzed: 'Indica o valor médio recebido por atendimento.',
    how: 'É calculado dividindo o faturamento total pela quantidade de serviços realizados no período.',
    formula: 'Ticket médio = faturamento total ÷ serviços realizados',
    numberMeaning: 'O número exibido é quanto, em média, cada atendimento gerou de receita.',
    trendMeaning: 'A seta compara o ticket médio atual com o ticket médio do período anterior equivalente.',
    betterWhen: 'Geralmente é melhor quando sobe, pois indica atendimentos de maior valor médio.',
  },
  'Serviço mais rentável': {
    analyzed: 'Identifica o serviço que mais gerou receita no período.',
    how: 'O dashboard agrupa os atendimentos por serviço, soma o faturamento de cada grupo e exibe o maior resultado.',
    formula: 'Serviço mais rentável = maior Σ(valor final) agrupado por serviço',
    numberMeaning: 'O card mostra o nome do serviço líder e, abaixo, o faturamento gerado por ele.',
    trendMeaning: 'A seta compara a receita desse serviço com a receita do mesmo serviço no período anterior.',
    betterWhen: 'Melhor quando sobe, pois o serviço líder está gerando mais receita.',
  },
  'Serviço mais vendido': {
    analyzed: 'Mostra o serviço com maior quantidade de atendimentos.',
    how: 'Os agendamentos válidos são agrupados por serviço e comparados pela quantidade realizada.',
    formula: 'Serviço mais vendido = maior quantidade de atendimentos agrupada por serviço',
    numberMeaning: 'O card mostra o nome do serviço com mais atendimentos e, abaixo, sua quantidade realizada.',
    trendMeaning: 'A seta compara a quantidade desse serviço com a quantidade do mesmo serviço no período anterior.',
    betterWhen: 'Melhor quando sobe, pois indica maior procura pelo serviço.',
  },
  'Colaborador mais ativo': {
    analyzed: 'Destaca o colaborador que realizou mais atendimentos no período.',
    how: 'A análise agrupa os agendamentos por colaborador e ordena pela quantidade de serviços executados.',
    formula: 'Colaborador mais ativo = maior quantidade de atendimentos agrupada por colaborador',
    numberMeaning: 'O card mostra o colaborador com mais atendimentos e, abaixo, quantos serviços ele realizou.',
    trendMeaning: 'A seta compara a quantidade desse colaborador com a quantidade dele no período anterior.',
    betterWhen: 'Melhor quando sobe, desde que a carga de trabalho continue equilibrada.',
  },
  'Top em comissão': {
    analyzed: 'Mostra o colaborador com maior valor acumulado de comissão.',
    how: 'O dashboard soma as comissões geradas pelos atendimentos de cada colaborador e apresenta o maior valor.',
    formula: 'Top em comissão = maior Σ(comissão do atendimento) agrupado por colaborador',
    numberMeaning: 'O card mostra o colaborador com maior comissão acumulada e, abaixo, o valor em reais.',
    trendMeaning: 'A seta compara a comissão desse colaborador com a comissão dele no período anterior.',
    betterWhen: 'Depende do contexto: subir pode indicar maior produção, mas deve ser acompanhado pelo faturamento gerado.',
  },
}

function explanationForKpi(kpi: DashboardKpi): KpiExplanation {
  return (
    kpiExplanations[kpi.label] ?? {
      analyzed: 'Resume um indicador de desempenho do período selecionado.',
      how: 'O cálculo usa os agendamentos válidos retornados pelo filtro atual do dashboard.',
      formula: 'Indicador = resultado calculado com os agendamentos válidos do período',
      numberMeaning: 'O número exibido representa o resultado consolidado do indicador no período selecionado.',
      trendMeaning: 'A seta compara o indicador atual com o período anterior equivalente.',
      betterWhen: 'A interpretação depende da métrica analisada.',
    }
  )
}

function KpiCard({ label, value, delta, icon, tone, sub, onClick }: KpiCardProps) {
  const Icon = kpiIcons[icon]
  const color = tone === 'blue' ? BLUE : GREEN

  return (
    <Card sx={{ p: 2.5, minHeight: 150 }} onClick={onClick} ariaLabel={`Ver explicação de ${label}`}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '12px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: `${color}14`,
            color,
          }}
        >
          <Icon sx={{ fontSize: 22 }} />
        </Box>
        <Delta value={delta} />
      </Box>
      <Typography
        sx={{
          mt: 2.3,
          color: MUTED,
          fontSize: '0.72rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 0.4,
          color: TEXT,
          fontSize: { xs: '1.35rem', lg: '1.45rem' },
          lineHeight: 1.15,
          fontWeight: 900,
          letterSpacing: '-0.04em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </Typography>
      {sub && <Typography sx={{ mt: 0.7, color: MUTED, fontSize: '0.76rem' }}>{sub}</Typography>}
    </Card>
  )
}

function SectionTitle({
  icon: Icon,
  title,
  color = BLUE,
}: {
  icon: IconType
  title: string
  color?: string
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
      <Icon sx={{ color, fontSize: 20 }} />
      <Typography sx={{ color: TEXT, fontSize: '1rem', fontWeight: 900 }}>{title}</Typography>
    </Box>
  )
}

function EmptyState({ text = 'Sem dados no período selecionado.' }: { text?: string }) {
  return (
    <Box sx={{ display: 'grid', minHeight: 180, placeItems: 'center' }}>
      <Typography sx={{ color: MUTED, fontSize: '0.9rem', fontWeight: 700 }}>{text}</Typography>
    </Box>
  )
}

type RevenueSeriesKey = 'faturamento' | 'comissao'

type RevenueSeriesVisibility = Record<RevenueSeriesKey, boolean>

type LineChartTooltipState = {
  x: number
  y: number
  point: DashboardChartPoint
} | null

const revenueSeriesConfig: Record<
  RevenueSeriesKey,
  {
    label: string
    color: string
    strokeWidth: number
  }
> = {
  faturamento: {
    label: 'Faturamento',
    color: BLUE,
    strokeWidth: 4,
  },
  comissao: {
    label: 'Comissão',
    color: GREEN,
    strokeWidth: 3,
  },
}

function LineComparisonChart({
  data,
  visibleSeries,
}: {
  data: DashboardChartPoint[]
  visibleSeries: RevenueSeriesVisibility
}) {
  const [tooltip, setTooltip] = useState<LineChartTooltipState>(null)

  if (!data.length) return <EmptyState />

  const activeSeries = (Object.keys(revenueSeriesConfig) as RevenueSeriesKey[]).filter(
    (key) => visibleSeries[key],
  )
  if (!activeSeries.length) return <EmptyState text="Selecione uma legenda para visualizar o gráfico." />

  const width = 760
  const height = 265
  const left = 58
  const right = 20
  const top = 14
  const bottom = 34
  const max = Math.max(1, ...data.flatMap((point) => activeSeries.map((key) => point[key])))
  const scaleMax = Math.ceil(max / 1000) * 1000
  const ticks = Array.from({ length: 5 }, (_, index) => (scaleMax / 4) * index)

  const getX = (index: number) =>
    left + (data.length === 1 ? 0 : (index / (data.length - 1)) * (width - left - right))
  const getY = (value: number) => top + (1 - value / scaleMax) * (height - top - bottom)
  const pathFor = (key: 'faturamento' | 'comissao') =>
    data
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${getX(index)} ${getY(point[key])}`)
      .join(' ')

  return (
    <Box sx={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="285"
        role="img"
        onMouseLeave={() => setTooltip(null)}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={left}
              x2={width - right}
              y1={getY(tick)}
              y2={getY(tick)}
              stroke={BORDER}
              strokeDasharray="4 5"
            />
            <text x="0" y={getY(tick) + 4} fill="#94a3b8" fontSize="12">
              R${(tick / 1000).toFixed(0)}k
            </text>
          </g>
        ))}
        {data.map((point, index) => (
          <text
            key={point.label}
            x={getX(index)}
            y={height - 8}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="12"
          >
            {point.label}
          </text>
        ))}
        {activeSeries.map((key) => (
          <path
            key={key}
            d={pathFor(key)}
            fill="none"
            stroke={revenueSeriesConfig[key].color}
            strokeWidth={revenueSeriesConfig[key].strokeWidth}
          >
            <title>{revenueSeriesConfig[key].label}</title>
          </path>
        ))}
        {data.map((point, index) => (
          <g key={point.label}>
            {activeSeries.map((key) => (
              <g key={key}>
                <circle
                  cx={getX(index)}
                  cy={getY(point[key])}
                  r={key === 'faturamento' ? '4.5' : '3.7'}
                  fill="#fff"
                  stroke={revenueSeriesConfig[key].color}
                  strokeWidth={key === 'faturamento' ? '3' : '2.5'}
                />
                <circle
                  cx={getX(index)}
                  cy={getY(point[key])}
                  r="14"
                  fill="transparent"
                  style={{ cursor: 'default' }}
                  onMouseEnter={() => setTooltip({ x: getX(index), y: getY(point[key]), point })}
                  onMouseMove={() => setTooltip({ x: getX(index), y: getY(point[key]), point })}
                  onFocus={() => setTooltip({ x: getX(index), y: getY(point[key]), point })}
                  onBlur={() => setTooltip(null)}
                  tabIndex={0}
                  aria-label={`${point.label}: ${activeSeries
                    .map((seriesKey) => `${revenueSeriesConfig[seriesKey].label} ${BRL(point[seriesKey])}`)
                    .join(', ')}`}
                />
              </g>
            ))}
          </g>
        ))}
      </svg>
      {tooltip ? (
        <Box
          sx={{
            position: 'absolute',
            left: `${(tooltip.x / width) * 100}%`,
            top: `${(tooltip.y / height) * 100}%`,
            transform: 'translate(-50%, calc(-100% - 12px))',
            zIndex: 2,
            minWidth: 180,
            borderRadius: '12px',
            bgcolor: '#0f172a',
            color: '#ffffff',
            boxShadow: '0 16px 32px rgba(15, 23, 42, 0.22)',
            p: 1.35,
            pointerEvents: 'none',
          }}
        >
          <Typography sx={{ fontSize: '0.74rem', fontWeight: 900, color: '#cbd5e1' }}>
            {tooltip.point.label}
          </Typography>
          <Box sx={{ display: 'grid', gap: 0.65, mt: 0.85 }}>
            {activeSeries.map((key) => (
              <Box key={key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: 99, bgcolor: revenueSeriesConfig[key].color }} />
                  <Typography sx={{ fontSize: '0.78rem', color: '#e2e8f0' }}>
                    {revenueSeriesConfig[key].label}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 900 }}>
                  {BRL(tooltip.point[key])}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}
    </Box>
  )
}

function DonutChart({
  data,
  hiddenLabels,
  onToggleLabel,
}: {
  data: DashboardMetric[]
  hiddenLabels: string[]
  onToggleLabel: (label: string) => void
}) {
  const visibleData = data.filter((item) => !hiddenLabels.includes(item.label))
  const total = visibleData.reduce((sum, item) => sum + item.value, 0)
  const fullTotal = data.reduce((sum, item) => sum + item.value, 0)
  let offset = 0

  if (!fullTotal) return <EmptyState />

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 285 }}>
      <Box sx={{ position: 'relative', width: 225, height: 225 }}>
        {total ? (
          <svg viewBox="0 0 42 42" width="225" height="225" role="img">
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
            {visibleData.map((item) => {
              const percent = (item.value / total) * 100
              const segment = (
                <Tooltip
                  key={item.label}
                  title={`${item.label}: ${BRL(item.value)} (${percent.toFixed(1).replace('.', ',')}%)`}
                  arrow
                  followCursor
                >
                  <circle
                    cx="21"
                    cy="21"
                    r="15.915"
                    fill="transparent"
                    stroke={item.color ?? BLUE}
                    strokeWidth="8"
                    strokeDasharray={`${percent} ${100 - percent}`}
                    strokeDashoffset={25 - offset}
                    aria-label={`${item.label}: ${BRL(item.value)} (${percent.toFixed(1).replace('.', ',')}%)`}
                    style={{ cursor: 'default', pointerEvents: 'stroke' }}
                  />
                </Tooltip>
              )
              offset += percent
              return segment
            })}
            <circle cx="21" cy="21" r="10" fill="#ffffff" />
          </svg>
        ) : (
          <EmptyState text="Selecione uma legenda para visualizar o gráfico." />
        )}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.2, mt: -1 }}>
        {data.map((item) => {
          const hidden = hiddenLabels.includes(item.label)
          return (
            <Tooltip
              key={item.label}
              title={`${item.label}: ${BRL(item.value)}. Clique para ${hidden ? 'mostrar' : 'ocultar'}.`}
              arrow
            >
              <Box
                onClick={() => onToggleLabel(item.label)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return
                  event.preventDefault()
                  onToggleLabel(item.label)
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  opacity: hidden ? 0.42 : 1,
                  cursor: 'pointer',
                  borderRadius: 999,
                  px: 0.7,
                  py: 0.35,
                  '&:hover': { bgcolor: '#f8fafc' },
                  '&:focus-visible': { outline: `2px solid ${BLUE}55`, outlineOffset: 2 },
                }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: 99, bgcolor: item.color ?? BLUE }} />
                <Typography sx={{ color: MUTED, fontSize: '0.72rem' }}>
                  {item.label} ({BRL(item.value)})
                </Typography>
              </Box>
            </Tooltip>
          )
        })}
      </Box>
    </Box>
  )
}

function WeekdayServicesChart({ data }: { data: DashboardWeekdayMetric[] }) {
  const [tab, setTab] = useState<'quantity' | 'payment'>('quantity')
  const isQuantity = tab === 'quantity'
  const max = Math.max(0, ...data.map((item) => (isQuantity ? item.quantity : item.averageTicket)))
  const bestDay = data.reduce<DashboardWeekdayMetric | null>((best, item) => {
    if (!best) return item
    const currentMetric = isQuantity ? item.quantity : item.averageTicket
    const bestMetric = isQuantity ? best.quantity : best.averageTicket
    return currentMetric > bestMetric ? item : best
  }, null)

  if (!data.some((item) => item.quantity > 0)) return <EmptyState />

  return (
    <Box sx={{ mt: 1.5 }}>
      <Tabs
        value={tab}
        onChange={(_, value: 'quantity' | 'payment') => setTab(value)}
        variant="fullWidth"
        sx={{
          minHeight: 38,
          borderRadius: '12px',
          bgcolor: '#f8fafc',
          border: `1px solid ${BORDER}`,
          '& .MuiTab-root': {
            minHeight: 38,
            textTransform: 'none',
            fontSize: '0.78rem',
            fontWeight: 900,
            color: MUTED,
          },
          '& .Mui-selected': {
            color: isQuantity ? BLUE : GREEN,
          },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: 999,
            bgcolor: isQuantity ? BLUE : GREEN,
          },
        }}
      >
        <Tab value="quantity" label="Mais serviços" />
        <Tab value="payment" label="Pagam melhor" />
      </Tabs>

      {bestDay ? (
        <Box
          sx={{
            mt: 1.5,
            borderRadius: '14px',
            p: 1.4,
            bgcolor: isQuantity ? 'rgba(37, 99, 235, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            border: `1px solid ${isQuantity ? 'rgba(37, 99, 235, 0.18)' : 'rgba(16, 185, 129, 0.18)'}`,
          }}
        >
          <Typography sx={{ color: MUTED, fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase' }}>
            Melhor dia
          </Typography>
          <Typography sx={{ mt: 0.35, color: TEXT, fontSize: '1.05rem', fontWeight: 950 }}>
            {bestDay.label}{' '}
            <Box component="span" sx={{ color: isQuantity ? BLUE : GREEN }}>
              {isQuantity
                ? `${bestDay.quantity} serviço${bestDay.quantity === 1 ? '' : 's'}`
                : `${BRL(bestDay.averageTicket)} por serviço`}
            </Box>
          </Typography>
          <Typography sx={{ mt: 0.25, color: MUTED, fontSize: '0.76rem' }}>
            {bestDay.quantity} atend. no dia, {BRL(bestDay.revenue)} faturados no total
          </Typography>
        </Box>
      ) : null}

      <Box sx={{ display: 'grid', gap: 1.1, mt: 1.8 }}>
        {data.map((item) => {
          const metric = isQuantity ? item.quantity : item.averageTicket
          const width = max ? (metric / max) * 100 : 0
          const tooltip = isQuantity
            ? `${item.label}: ${item.quantity} serviço${item.quantity === 1 ? '' : 's'}, ${BRL(item.revenue)} faturados`
            : `${item.label}: ${BRL(item.averageTicket)} por serviço, ${BRL(item.revenue)} no total`

          return (
            <Tooltip key={item.label} title={tooltip} arrow>
              <Box sx={{ display: 'grid', gridTemplateColumns: '42px 1fr auto', gap: 1, alignItems: 'center' }}>
                <Typography sx={{ color: MUTED, fontSize: '0.78rem', fontWeight: 900 }}>{item.label}</Typography>
                <Box sx={{ height: 18, borderRadius: 999, bgcolor: '#f1f5f9', overflow: 'hidden' }}>
                  <Box
                    sx={{
                      width: `${width}%`,
                      minWidth: metric > 0 ? 12 : 0,
                      height: '100%',
                      borderRadius: 999,
                      bgcolor: isQuantity ? BLUE : GREEN,
                      boxShadow: isQuantity
                        ? '0 6px 12px rgba(37, 99, 235, 0.16)'
                        : '0 6px 12px rgba(16, 185, 129, 0.16)',
                    }}
                  />
                </Box>
                <Typography sx={{ color: TEXT, fontSize: '0.78rem', fontWeight: 900, whiteSpace: 'nowrap' }}>
                  {isQuantity ? item.quantity.toLocaleString('pt-BR') : BRL(item.averageTicket)}
                </Typography>
              </Box>
            </Tooltip>
          )
        })}
      </Box>
    </Box>
  )
}

function HorizontalBarChart({ data }: { data: DashboardMetric[] }) {
  const max = Math.max(0, ...data.map((item) => item.value))

  if (!max) return <EmptyState />

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.3,
        maxHeight: 300,
        overflowY: 'auto',
        pr: 0.8,
        pt: 2,
        scrollbarWidth: 'thin',
        scrollbarColor: `${GREEN} #f1f5f9`,
        '&::-webkit-scrollbar': { width: 8 },
        '&::-webkit-scrollbar-track': { bgcolor: '#f1f5f9', borderRadius: 999 },
        '&::-webkit-scrollbar-thumb': { bgcolor: GREEN, borderRadius: 999 },
      }}
    >
      {data.map((item) => (
        <Box
          key={item.label}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '150px 1fr' },
            gap: 1,
            alignItems: 'center',
          }}
        >
          <Typography
            title={item.label}
            sx={{
              color: MUTED,
              fontSize: '0.82rem',
              fontWeight: 800,
              textAlign: { sm: 'right' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </Typography>
          <Tooltip title={`${item.label}: ${BRL(item.value)}`} arrow>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 1,
                alignItems: 'center',
                cursor: 'default',
              }}
            >
              <Box sx={{ height: 20, borderRadius: 999, bgcolor: '#f1f5f9', overflow: 'hidden' }}>
                <Box
                  sx={{
                    width: `${(item.value / max) * 100}%`,
                    height: '100%',
                    borderRadius: 999,
                    bgcolor: GREEN,
                    boxShadow: '0 8px 16px rgba(16, 185, 129, 0.18)',
                  }}
                />
              </Box>
              <Typography sx={{ color: TEXT, fontSize: '0.78rem', fontWeight: 900, whiteSpace: 'nowrap' }}>
                {BRL(item.value)}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      ))}
    </Box>
  )
}

function RankingList({
  title,
  icon: Icon,
  rows,
  unit = 'serviços',
  showValue = true,
  medalRanks = true,
}: {
  title: string
  icon: IconType
  rows: DashboardRankingRow[]
  unit?: string
  showValue?: boolean
  medalRanks?: boolean
}) {
  const max = Math.max(0, ...rows.map((row) => (showValue ? row.value : row.quantity)))

  return (
    <Card sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.3, mb: 2.2 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '11px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(37, 99, 235, 0.10)',
            color: BLUE,
          }}
        >
          <Icon sx={{ fontSize: 19 }} />
        </Box>
        <Typography sx={{ color: TEXT, fontSize: '0.92rem', fontWeight: 900 }}>{title}</Typography>
      </Box>

      {!rows.length ? (
        <EmptyState />
      ) : (
        <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none', display: 'grid', gap: 1.65 }}>
          {rows.map((row, index) => {
            const metric = showValue ? row.value : row.quantity
            const rankColors = [
              ['#fef3c7', '#b45309'],
              ['#e2e8f0', '#475569'],
              ['#ffedd5', '#c2410c'],
            ][index] ?? ['#f1f5f9', '#64748b']
            const medal = [
              {
                label: 'Ouro',
                background: 'radial-gradient(circle at 32% 28%, #fff7ad 0%, #facc15 34%, #eab308 62%, #a16207 100%)',
                color: '#713f12',
                border: '#f59e0b',
              },
              {
                label: 'Prata',
                background: 'radial-gradient(circle at 32% 28%, #ffffff 0%, #e2e8f0 36%, #94a3b8 68%, #475569 100%)',
                color: '#334155',
                border: '#cbd5e1',
              },
              {
                label: 'Bronze',
                background: 'radial-gradient(circle at 32% 28%, #fed7aa 0%, #fb923c 38%, #c2410c 70%, #7c2d12 100%)',
                color: '#7c2d12',
                border: '#fb923c',
              },
            ][index] ?? {
              label: `Top ${index + 1}`,
              background: 'linear-gradient(135deg, #dbeafe 0%, #60a5fa 55%, #2563eb 100%)',
              color: '#172554',
              border: 'transparent',
            }

            return (
              <Box component="li" key={row.name}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.3, minWidth: 0 }}>
                    {medalRanks ? (
                      <Tooltip title={`${medal.label} - ${index + 1}º lugar`} arrow>
                        <Box
                          sx={{
                            position: 'relative',
                            width: 31,
                            height: 31,
                            borderRadius: '50%',
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: medal.background,
                            color: medal.color,
                            border: `2px solid ${medal.border}`,
                            boxShadow:
                              index === 0
                                ? 'inset 0 2px 2px rgba(255,255,255,0.72), 0 0 0 3px rgba(250, 204, 21, 0.18), 0 8px 16px rgba(161, 98, 7, 0.22)'
                                : index === 1
                                  ? 'inset 0 2px 2px rgba(255,255,255,0.56), 0 6px 13px rgba(71, 85, 105, 0.16)'
                                  : index === 2
                                    ? 'inset 0 2px 2px rgba(255,255,255,0.42), 0 6px 13px rgba(124, 45, 18, 0.16)'
                                    : 'inset 0 1px 0 rgba(255,255,255,0.55), 0 7px 14px rgba(15, 23, 42, 0.12)',
                            fontSize: '0.72rem',
                            fontWeight: 950,
                            flexShrink: 0,
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              bottom: -5,
                              width: 12,
                              height: 8,
                              borderRadius: '0 0 4px 4px',
                              bgcolor: index === 0 ? '#eab308' : index === 1 ? '#94a3b8' : index === 2 ? '#c2410c' : medal.color,
                              opacity: index === 0 ? 0.95 : 0.72,
                              clipPath: 'polygon(0 0, 100% 0, 82% 100%, 50% 64%, 18% 100%)',
                            },
                          }}
                        >
                          {index + 1}
                        </Box>
                      </Tooltip>
                    ) : (
                      <Box
                        sx={{
                          width: 25,
                          height: 25,
                          borderRadius: '8px',
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: rankColors[0],
                          color: rankColors[1],
                          fontSize: '0.72rem',
                          fontWeight: 900,
                          flexShrink: 0,
                        }}
                      >
                        {index + 1}
                      </Box>
                    )}
                    <Typography
                      sx={{
                        color: TEXT,
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.name}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    {showValue ? (
                      <>
                        <Typography sx={{ color: TEXT, fontSize: '0.86rem', fontWeight: 900 }}>
                          {BRL(row.value)}
                        </Typography>
                        <Typography sx={{ color: MUTED, fontSize: '0.72rem' }}>
                          {row.quantity} {unit}
                        </Typography>
                      </>
                    ) : (
                      <Typography sx={{ color: TEXT, fontSize: '0.86rem', fontWeight: 900 }}>
                        {row.quantity} {unit}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ mt: 0.9, height: 6, borderRadius: 999, bgcolor: '#f1f5f9', overflow: 'hidden' }}>
                  <Box
                    sx={{
                      width: `${max ? (metric / max) * 100 : 0}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${BLUE}, ${GREEN})`,
                    }}
                  />
                </Box>
              </Box>
            )
          })}
        </Box>
      )}
    </Card>
  )
}

export default function DashboardPage() {
  const dashboardRef = useRef<HTMLDivElement | null>(null)
  const [period, setPeriod] = useState<DashboardPeriod>('Mês')
  const [data, setData] = useState<DashboardData>(emptyDashboard)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exportingPdf, setExportingPdf] = useState(false)
  const [customStartDate, setCustomStartDate] = useState<Dayjs | null>(() => dayjs().startOf('month'))
  const [customEndDate, setCustomEndDate] = useState<Dayjs | null>(() => dayjs())
  const [selectedKpi, setSelectedKpi] = useState<DashboardKpi | null>(null)
  const [visibleRevenueSeries, setVisibleRevenueSeries] = useState<RevenueSeriesVisibility>({
    faturamento: true,
    comissao: true,
  })
  const [hiddenRevenueServices, setHiddenRevenueServices] = useState<string[]>([])
  const selectedKpiExplanation = selectedKpi ? explanationForKpi(selectedKpi) : null

  function toggleRevenueSeries(key: RevenueSeriesKey) {
    setVisibleRevenueSeries((current) => ({ ...current, [key]: !current[key] }))
  }

  function toggleRevenueService(label: string) {
    setHiddenRevenueServices((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    )
  }

  async function handleExportPdf() {
    const dashboardElement = dashboardRef.current
    if (!dashboardElement || exportingPdf) return

    setExportingPdf(true)
    try {
      const canvas = await html2canvas(dashboardElement, {
        backgroundColor: PAGE_BG,
        scale: 2,
        useCORS: true,
        windowWidth: dashboardElement.scrollWidth,
        windowHeight: dashboardElement.scrollHeight,
      })

      const imageData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const margin = 8
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imageWidth = pageWidth - margin * 2
      const imageHeight = (canvas.height * imageWidth) / canvas.width
      const printableHeight = pageHeight - margin * 2

      let heightLeft = imageHeight
      let position = margin

      pdf.addImage(imageData, 'PNG', margin, position, imageWidth, imageHeight)
      heightLeft -= printableHeight

      while (heightLeft > 0) {
        position = margin - (imageHeight - heightLeft)
        pdf.addPage()
        pdf.addImage(imageData, 'PNG', margin, position, imageWidth, imageHeight)
        heightLeft -= printableHeight
      }

      pdf.save(`relatorio-dashboard-${dayjs().format('YYYY-MM-DD-HHmm')}.pdf`)
    } catch (err) {
      setError(mensagemDeErroCapturado(err, 'Não foi possível exportar o relatório em PDF.'))
    } finally {
      setExportingPdf(false)
    }
  }

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')

    const isCustomPeriod = period === 'Personalizado'
    let customRange: { start: Date; end: Date } | undefined

    if (isCustomPeriod) {
      if (!customStartDate?.isValid() || !customEndDate?.isValid()) {
        setData(emptyDashboard)
        setError('Selecione a data inicial e a data final para filtrar o dashboard.')
        setLoading(false)
        return () => {
          alive = false
        }
      }

      if (customStartDate.isAfter(customEndDate, 'day')) {
        setData(emptyDashboard)
        setError('A data inicial não pode ser maior que a data final.')
        setLoading(false)
        return () => {
          alive = false
        }
      }

      customRange = {
        start: customStartDate.startOf('day').toDate(),
        end: customEndDate.endOf('day').toDate(),
      }
    }

    void (async () => {
      try {
        const dashboard = await getDashboardData(period, customRange)
        if (alive) setData(dashboard)
      } catch (err) {
        if (!alive) return
        setData(emptyDashboard)
        setError(mensagemDeErroCapturado(err, 'Não foi possível carregar os dados do dashboard.'))
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [period, customStartDate, customEndDate])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: PAGE_BG }}>
      <Box ref={dashboardRef} sx={{ maxWidth: 1600, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 3, lg: 4 } }}>
        <Box
          component="header"
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            alignItems: { lg: 'flex-end' },
            justifyContent: 'space-between',
            gap: 2.5,
            pb: 2.4,
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <Box>
            <Typography
              component="h1"
              sx={{
                color: TEXT,
                fontSize: { xs: '1.9rem', md: '2.25rem' },
                fontWeight: 950,
                letterSpacing: '-0.05em',
                lineHeight: 1.08,
              }}
            >
              Dashboard
            </Typography>
            <Typography sx={{ mt: 1, color: MUTED, fontSize: '0.9rem' }}>
              Visão geral de desempenho dos serviços, colaboradores e comissões.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: 'inline-flex',
                flexWrap: 'wrap',
                gap: 0.3,
                border: `1px solid ${BORDER}`,
                bgcolor: '#ffffff',
                p: 0.5,
                borderRadius: '13px',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
              }}
            >
              {dashboardPeriods.map((item) => (
                <Button
                  key={item}
                  size="small"
                  onClick={() => setPeriod(item)}
                  disabled={loading}
                  sx={{
                    minWidth: 0,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: '10px',
                    color: period === item ? '#ffffff' : MUTED,
                    bgcolor: period === item ? BLUE : 'transparent',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    '&:hover': {
                      bgcolor: period === item ? '#1d4ed8' : '#f8fafc',
                    },
                    '&.Mui-disabled': {
                      color: period === item ? '#ffffff' : '#94a3b8',
                      bgcolor: period === item ? BLUE : 'transparent',
                    },
                  }}
                >
                  {item}
                </Button>
              ))}
            </Box>
            {period === 'Personalizado' ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 150px)' },
                  gap: 1,
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                <DatePicker
                  label="Data inicial"
                  format="DD/MM/YYYY"
                  value={customStartDate}
                  onChange={(newValue) => setCustomStartDate(newValue)}
                  disabled={loading}
                  slotProps={{
                    popper: {
                      placement: 'bottom-start',
                    },
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      slotProps: {
                        htmlInput: { placeholder: 'dd/mm/aaaa' },
                      },
                    },
                  }}
                />
                <DatePicker
                  label="Data final"
                  format="DD/MM/YYYY"
                  value={customEndDate}
                  onChange={(newValue) => setCustomEndDate(newValue)}
                  disabled={loading}
                  minDate={customStartDate ?? undefined}
                  slotProps={{
                    popper: {
                      placement: 'bottom-start',
                    },
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      slotProps: {
                        htmlInput: { placeholder: 'dd/mm/aaaa' },
                      },
                    },
                  }}
                />
              </Box>
            ) : null}
            <Button
              variant="contained"
              startIcon={<FileDownloadOutlined />}
              onClick={handleExportPdf}
              disabled={loading || exportingPdf}
              data-html2canvas-ignore="true"
              sx={{
                bgcolor: BLUE,
                borderRadius: '13px',
                px: 2,
                py: 1.12,
                fontSize: '0.85rem',
                fontWeight: 900,
                '&:hover': { bgcolor: '#1d4ed8' },
              }}
            >
              {exportingPdf ? 'Gerando PDF...' : 'Exportar relatório'}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2.5, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2.5, color: MUTED }}>
            <CircularProgress size={20} />
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>
              Carregando dados do banco...
            </Typography>
          </Box>
        )}

        <Box
          component="section"
          sx={{
            mt: 2.5,
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 2,
          }}
        >
          {data.kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} onClick={() => setSelectedKpi(kpi)} />
          ))}
        </Box>

        <Dialog
          open={Boolean(selectedKpi)}
          onClose={() => setSelectedKpi(null)}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                borderRadius: '18px',
                boxShadow:
                  '0 25px 50px -12px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(15, 23, 42, 0.04)',
                maxHeight: '90vh',
              },
            },
            backdrop: {
              sx: {
                backdropFilter: 'blur(6px)',
                bgcolor: 'rgba(15, 23, 42, 0.42)',
              },
            },
          }}
        >
          {selectedKpi && selectedKpiExplanation ? (
            <Box sx={{ p: 3, overflowY: 'auto' }}>
              <Typography sx={{ color: MUTED, fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase' }}>
                Indicador do dashboard
              </Typography>
              <Typography sx={{ mt: 0.6, color: TEXT, fontSize: '1.25rem', fontWeight: 950, lineHeight: 1.2 }}>
                {selectedKpi.label}
              </Typography>
              <Typography sx={{ mt: 0.75, color: selectedKpi.tone === 'blue' ? BLUE : GREEN, fontWeight: 900 }}>
                {selectedKpi.value}
              </Typography>
              {selectedKpi.sub ? (
                <Typography sx={{ mt: 0.25, color: MUTED, fontSize: '0.82rem' }}>{selectedKpi.sub}</Typography>
              ) : null}

              <Box sx={{ mt: 2.4, display: 'grid', gap: 1.2 }}>
                <Box>
                  <Typography sx={{ color: TEXT, fontSize: '0.88rem', fontWeight: 900 }}>O que é analisado</Typography>
                  <Typography sx={{ mt: 0.45, color: MUTED, fontSize: '0.86rem', lineHeight: 1.55 }}>
                    {selectedKpiExplanation.analyzed}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ color: TEXT, fontSize: '0.88rem', fontWeight: 900 }}>
                    De onde sai o número
                  </Typography>
                  <Typography sx={{ mt: 0.45, color: MUTED, fontSize: '0.86rem', lineHeight: 1.55 }}>
                    {selectedKpiExplanation.numberMeaning}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ color: TEXT, fontSize: '0.88rem', fontWeight: 900 }}>Como é calculado</Typography>
                  <Typography sx={{ mt: 0.45, color: MUTED, fontSize: '0.86rem', lineHeight: 1.55 }}>
                    {selectedKpiExplanation.how}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ color: TEXT, fontSize: '0.88rem', fontWeight: 900 }}>
                    Setas e indicador
                  </Typography>
                  <Typography sx={{ mt: 0.45, color: MUTED, fontSize: '0.86rem', lineHeight: 1.55 }}>
                    {selectedKpiExplanation.trendMeaning} Neste card, a variação está em{' '}
                    <Box component="strong" sx={{ color: selectedKpi.delta >= 0 ? '#059669' : '#e11d48' }}>
                      {selectedKpi.delta >= 0 ? '+' : ''}
                      {selectedKpi.delta.toFixed(1).replace('.', ',')}%
                    </Box>
                    .
                  </Typography>
                  <Typography sx={{ mt: 0.45, color: MUTED, fontSize: '0.86rem', lineHeight: 1.55 }}>
                    {selectedKpiExplanation.betterWhen}
                  </Typography>
                </Box>
                <Box sx={{ borderRadius: '12px', bgcolor: '#f8fafc', border: `1px solid ${BORDER}`, p: 1.5 }}>
                  <Typography sx={{ color: TEXT, fontSize: '0.88rem', fontWeight: 900 }}>
                    Memória de cálculo
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.65,
                      color: selectedKpi.tone === 'blue' ? BLUE : GREEN,
                      fontFamily: 'monospace',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      lineHeight: 1.55,
                    }}
                  >
                    {selectedKpiExplanation.formula}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.6 }}>
                <Button
                  variant="contained"
                  onClick={() => setSelectedKpi(null)}
                  sx={{
                    bgcolor: BLUE,
                    borderRadius: '11px',
                    px: 2.4,
                    fontWeight: 800,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#1d4ed8' },
                  }}
                >
                  Entendi
                </Button>
              </Box>
            </Box>
          ) : null}
        </Dialog>

        <Box
          component="section"
          sx={{
            mt: 2.5,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
            gap: 2,
          }}
        >
          <Card sx={{ p: 2.5, minWidth: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 1 }}>
              <Box>
                <Typography sx={{ color: TEXT, fontSize: '0.95rem', fontWeight: 900 }}>
                  Evolução do faturamento
                </Typography>
                <Typography sx={{ color: MUTED, fontSize: '0.78rem' }}>
                  Comparativo com comissões pagas
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, gap: 1 }}>
                {(Object.keys(revenueSeriesConfig) as RevenueSeriesKey[]).map((key) => {
                  const config = revenueSeriesConfig[key]
                  const visible = visibleRevenueSeries[key]

                  return (
                    <Tooltip key={key} title={`Clique para ${visible ? 'ocultar' : 'mostrar'} ${config.label}`} arrow>
                      <Box
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleRevenueSeries(key)}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' && event.key !== ' ') return
                          event.preventDefault()
                          toggleRevenueSeries(key)
                        }}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.8,
                          borderRadius: 999,
                          px: 1,
                          py: 0.55,
                          color: MUTED,
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          opacity: visible ? 1 : 0.4,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#f8fafc' },
                          '&:focus-visible': { outline: `2px solid ${BLUE}55`, outlineOffset: 2 },
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: 99,
                            bgcolor: config.color,
                          }}
                        />
                        {config.label}
                      </Box>
                    </Tooltip>
                  )
                })}
              </Box>
            </Box>
            <LineComparisonChart data={data.revenueSeries} visibleSeries={visibleRevenueSeries} />
          </Card>

          <Card sx={{ p: 2.5, minWidth: 0 }}>
            <Typography sx={{ color: TEXT, fontSize: '0.95rem', fontWeight: 900 }}>
              Receita por serviço
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: '0.78rem' }}>Distribuição do período</Typography>
            <DonutChart
              data={data.revenueByService}
              hiddenLabels={hiddenRevenueServices}
              onToggleLabel={toggleRevenueService}
            />
          </Card>
        </Box>

        <Box
          component="section"
          sx={{
            mt: 2,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 2,
          }}
        >
          <Card sx={{ p: 2.5 }}>
            <Typography sx={{ color: TEXT, fontSize: '0.95rem', fontWeight: 900 }}>
              Serviços realizados
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: '0.78rem' }}>
              Melhores dias por volume e pagamento
            </Typography>
            <WeekdayServicesChart data={data.weekdayServices} />
          </Card>

          <Card sx={{ p: 2.5 }}>
            <Typography sx={{ color: TEXT, fontSize: '0.95rem', fontWeight: 900 }}>
              Comissões por colaborador
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: '0.78rem' }}>
              Todos os colaboradores por maior valor pago
            </Typography>
            <HorizontalBarChart data={data.commissionByEmployee} />
          </Card>
        </Box>

        <Box component="section" sx={{ mt: 3 }}>
          <SectionTitle icon={EmojiEventsOutlined} title="Rankings do período" />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
                xl: 'repeat(3, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            <RankingList
              title="Serviços mais rentáveis"
              icon={WorkspacePremiumOutlined}
              rows={data.rankings.servicesRevenue}
              unit="atend."
            />
            <RankingList
              title="Serviços mais realizados"
              icon={ContentCutOutlined}
              rows={data.rankings.servicesCount}
              unit="atend."
              showValue={false}
            />
            <RankingList
              title="Colaboradores mais ativos"
              icon={GroupsOutlined}
              rows={data.rankings.employeesWork}
              unit="serviços"
              showValue={false}
            />
            <RankingList
              title="Maiores comissões"
              icon={AccountBalanceWalletOutlined}
              rows={data.rankings.employeesCommission}
              unit="serviços"
            />
            <RankingList
              title="Clientes mais fiéis"
              icon={PeopleAltOutlined}
              rows={data.rankings.clients}
              unit="contratos"
              medalRanks
            />

            <Card
              sx={{
                position: 'relative',
                overflow: 'hidden',
                p: 2.5,
                minHeight: 270,
                color: '#ffffff',
                background: `linear-gradient(135deg, ${BLUE}, #4f46e5)`,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  right: -38,
                  top: -38,
                  width: 140,
                  height: 140,
                  borderRadius: 999,
                  bgcolor: 'rgba(255,255,255,0.10)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  left: -30,
                  bottom: -52,
                  width: 145,
                  height: 145,
                  borderRadius: 999,
                  bgcolor: 'rgba(255,255,255,0.06)',
                }}
              />
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <AutoAwesomeOutlined sx={{ fontSize: 26 }} />
                <Typography sx={{ mt: 2, fontSize: '1.2rem', fontWeight: 900 }}>
                  Resumo do período
                </Typography>
                <Typography sx={{ mt: 1, color: 'rgba(255,255,255,0.82)', fontSize: '0.88rem', lineHeight: 1.55 }}>
                  Servify variou <strong>{data.summary.growth}</strong> em faturamento comparado ao período anterior.
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mt: 3 }}>
                  <Box sx={{ borderRadius: '12px', p: 1.5, bgcolor: 'rgba(255,255,255,0.12)' }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.75rem' }}>
                      Clientes atendidos
                    </Typography>
                    <Typography sx={{ mt: 0.5, fontSize: '1.45rem', fontWeight: 950 }}>
                      {data.summary.newClients}
                    </Typography>
                  </Box>
                  <Box sx={{ borderRadius: '12px', p: 1.5, bgcolor: 'rgba(255,255,255,0.12)' }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.75rem' }}>
                      Taxa de retorno
                    </Typography>
                    <Typography sx={{ mt: 0.5, fontSize: '1.45rem', fontWeight: 950 }}>
                      {data.summary.retention}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Box>
        </Box>

        <Box component="section" sx={{ mt: 3 }}>
          <SectionTitle icon={AutoAwesomeOutlined} title="Insights do período" color={GREEN} />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
                xl: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            {data.insights.map((insight) => {
              const Icon = insightIcons[insight.icon]
              return (
                <Card key={insight.text} sx={{ p: 2.5 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: '12px',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: 'rgba(16, 185, 129, 0.10)',
                      color: GREEN,
                    }}
                  >
                    <Icon sx={{ fontSize: 22 }} />
                  </Box>
                  <Typography sx={{ mt: 2, color: TEXT, fontSize: '0.9rem', lineHeight: 1.65 }}>
                    {insight.text}
                  </Typography>
                </Card>
              )
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
