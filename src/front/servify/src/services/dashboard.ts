import { getAgendamentos, type Agendamento } from './agendamentos'

export const dashboardPeriods = ['Hoje', 'Semana', 'Mês', 'Ano', 'Personalizado'] as const

export type DashboardPeriod = (typeof dashboardPeriods)[number]

export type DashboardKpiIcon =
  | 'money'
  | 'wallet'
  | 'check'
  | 'receipt'
  | 'crown'
  | 'trend'
  | 'trophy'
  | 'award'

export type DashboardKpi = {
  label: string
  value: string
  delta: number
  icon: DashboardKpiIcon
  tone: 'blue' | 'green'
  sub?: string
}

export type DashboardChartPoint = {
  label: string
  faturamento: number
  comissao: number
}

export type DashboardMetric = {
  label: string
  value: number
  color?: string
}

export type DashboardWeekdayMetric = {
  label: string
  quantity: number
  revenue: number
  averageTicket: number
}

export type DashboardRankingRow = {
  name: string
  quantity: number
  value: number
}

export type DashboardInsightIcon = 'crown' | 'trophy' | 'wallet' | 'trend'

export type DashboardInsight = {
  icon: DashboardInsightIcon
  text: string
}

export type DashboardData = {
  kpis: DashboardKpi[]
  revenueSeries: DashboardChartPoint[]
  categoryServices: DashboardMetric[]
  weekdayServices: DashboardWeekdayMetric[]
  revenueByService: DashboardMetric[]
  commissionByEmployee: DashboardMetric[]
  rankings: {
    servicesRevenue: DashboardRankingRow[]
    servicesCount: DashboardRankingRow[]
    employeesWork: DashboardRankingRow[]
    employeesCommission: DashboardRankingRow[]
    clients: DashboardRankingRow[]
  }
  summary: {
    growth: string
    newClients: string
    retention: string
  }
  insights: DashboardInsight[]
}

type PeriodRange = {
  start: Date
  end: Date
}

export type DashboardCustomRange = {
  start: Date
  end: Date
}

type AggregatedMetrics = {
  revenue: number
  commission: number
  count: number
  averageTicket: number
  servicesRevenue: DashboardRankingRow[]
  servicesCount: DashboardRankingRow[]
  employeesWork: DashboardRankingRow[]
  employeesCommission: DashboardRankingRow[]
  clients: DashboardRankingRow[]
}

const COLORS = ['#2563eb', '#10b981', '#6366f1', '#f59e0b', '#94a3b8']

const BRL = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })

function toApiDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
}

function getPeriodRange(period: DashboardPeriod, now = new Date()): PeriodRange {
  if (period === 'Hoje') {
    return { start: startOfDay(now), end: endOfDay(now) }
  }

  if (period === 'Semana') {
    const day = now.getDay() || 7
    const start = startOfDay(new Date(now))
    start.setDate(now.getDate() - day + 1)
    const end = endOfDay(new Date(start))
    end.setDate(start.getDate() + 6)
    return { start, end }
  }

  if (period === 'Mês') {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    }
  }

  return {
    start: new Date(now.getFullYear(), 0, 1, 0, 0, 0),
    end: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
  }
}

function getPreviousRange(range: PeriodRange): PeriodRange {
  const duration = range.end.getTime() - range.start.getTime()
  const end = new Date(range.start.getTime() - 1000)
  const start = new Date(end.getTime() - duration)
  return { start, end }
}

function usableAppointments(appointments: Agendamento[]): Agendamento[] {
  return appointments.filter((appointment) => appointment.status === 'CONCLUIDO')
}

function finalValue(appointment: Agendamento): number {
  return Number.isFinite(appointment.valorFinal) ? appointment.valorFinal : 0
}

function commissionValue(appointment: Agendamento): number {
  const value = finalValue(appointment)
  const commission = Number.isFinite(appointment.comissao) ? appointment.comissao : 0
  if (commission <= 1) return value * commission
  if (commission <= 100) return value * (commission / 100)
  return commission
}

function delta(current: number, previous: number): number {
  if (!previous && !current) return 0
  if (!previous) return 100
  return ((current - previous) / previous) * 100
}

function percentText(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1).replace('.', ',')}%`
}

function aggregateRows(
  appointments: Agendamento[],
  getKey: (appointment: Agendamento) => string,
  getValue: (appointment: Agendamento) => number,
): DashboardRankingRow[] {
  const map = new Map<string, DashboardRankingRow>()

  for (const appointment of appointments) {
    const key = getKey(appointment)
    const current = map.get(key) ?? { name: key, quantity: 0, value: 0 }
    current.quantity += 1
    current.value += getValue(appointment)
    map.set(key, current)
  }

  return Array.from(map.values())
}

function topRows(rows: DashboardRankingRow[], by: 'value' | 'quantity', limit = 5): DashboardRankingRow[] {
  return [...rows].sort((a, b) => b[by] - a[by]).slice(0, limit)
}

function summarize(appointments: Agendamento[]): AggregatedMetrics {
  const revenue = appointments.reduce((sum, appointment) => sum + finalValue(appointment), 0)
  const commission = appointments.reduce((sum, appointment) => sum + commissionValue(appointment), 0)
  const count = appointments.length
  const averageTicket = count ? revenue / count : 0
  const serviceRows = aggregateRows(appointments, (a) => a.servicoNome, finalValue)
  const employeeRevenueRows = aggregateRows(appointments, (a) => a.colaboradorNome, finalValue)
  const employeeCommissionRows = aggregateRows(appointments, (a) => a.colaboradorNome, commissionValue)
  const clientRows = aggregateRows(appointments, (a) => a.clienteNome, finalValue)

  return {
    revenue,
    commission,
    count,
    averageTicket,
    servicesRevenue: topRows(serviceRows, 'value'),
    servicesCount: topRows(serviceRows, 'quantity'),
    employeesWork: topRows(employeeRevenueRows, 'quantity'),
    employeesCommission: topRows(employeeCommissionRows, 'value'),
    clients: topRows(clientRows, 'value'),
  }
}

function findMetric(
  rows: DashboardRankingRow[],
  name: string | undefined,
  metric: 'value' | 'quantity',
): number {
  if (!name) return 0
  return rows.find((row) => row.name === name)?.[metric] ?? 0
}

function buildCategoryServices(appointments: Agendamento[]): DashboardMetric[] {
  const rows = aggregateRows(
    appointments,
    (appointment) => appointment.servicoNome || '(Sem serviço)',
    () => 1,
  )

  return rows
    .sort((a, b) => b.quantity - a.quantity)
    .map((row) => ({
      label: row.name,
      value: row.quantity,
    }))
}

function buildWeekdayServices(appointments: Agendamento[]): DashboardWeekdayMetric[] {
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const rows = weekdays.map((label) => ({
    label,
    quantity: 0,
    revenue: 0,
    averageTicket: 0,
  }))

  for (const appointment of appointments) {
    const date = new Date(appointment.dataHora || `${appointment.data}T${appointment.horarioInicio}`)
    const row = rows[date.getDay()]
    if (!row) continue

    row.quantity += 1
    row.revenue += finalValue(appointment)
  }

  return rows.map((row) => ({
    ...row,
    averageTicket: row.quantity ? row.revenue / row.quantity : 0,
  }))
}

function buildRevenueByService(rows: DashboardRankingRow[]): DashboardMetric[] {
  return rows.slice(0, 5).map((row, index) => ({
    label: row.name,
    value: row.value,
    color: COLORS[index % COLORS.length],
  }))
}

function buildCommissionByEmployee(rows: DashboardRankingRow[]): DashboardMetric[] {
  return [...rows]
    .sort((a, b) => b.value - a.value)
    .map((row) => ({
      label: row.name,
      value: row.value,
    }))
}

function buildChartBuckets(period: DashboardPeriod, range: PeriodRange): DashboardChartPoint[] {
  if (period === 'Hoje') {
    return ['00h', '04h', '08h', '12h', '16h', '20h'].map((label) => ({
      label,
      faturamento: 0,
      comissao: 0,
    }))
  }

  if (period === 'Semana') {
    return ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((label) => ({
      label,
      faturamento: 0,
      comissao: 0,
    }))
  }

  if (period === 'Mês') {
    return ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'].map((label) => ({
      label,
      faturamento: 0,
      comissao: 0,
    }))
  }

  return Array.from({ length: 12 }, (_, index) => ({
    label: new Intl.DateTimeFormat('pt-BR', { month: 'short' })
      .format(new Date(range.start.getFullYear(), index, 1))
      .replace('.', ''),
    faturamento: 0,
    comissao: 0,
  }))
}

function bucketIndex(period: DashboardPeriod, date: Date): number {
  if (period === 'Hoje') return Math.min(5, Math.floor(date.getHours() / 4))
  if (period === 'Semana') return (date.getDay() + 6) % 7
  if (period === 'Mês') return Math.min(4, Math.floor((date.getDate() - 1) / 7))
  return date.getMonth()
}

function buildRevenueSeries(
  period: DashboardPeriod,
  range: PeriodRange,
  appointments: Agendamento[],
): DashboardChartPoint[] {
  const buckets = buildChartBuckets(period, range)

  for (const appointment of appointments) {
    const date = new Date(appointment.dataHora || `${appointment.data}T${appointment.horarioInicio}`)
    const index = bucketIndex(period, date)
    if (!buckets[index]) continue
    buckets[index].faturamento += finalValue(appointment)
    buckets[index].comissao += commissionValue(appointment)
  }

  return buckets
}

function buildInsights(current: AggregatedMetrics): DashboardInsight[] {
  const topService = current.servicesRevenue[0]
  const topEmployee = current.employeesWork[0]
  const topGrowthService = current.servicesCount[0]
  const commissionPercent = current.revenue ? (current.commission / current.revenue) * 100 : 0

  return [
    {
      icon: 'crown',
      text: topService
        ? `${topService.name} foi o serviço mais rentável, representando ${Math.round(
          (topService.value / Math.max(current.revenue, 1)) * 100,
        )}% do faturamento total.`
        : 'Ainda não há serviços realizados no período selecionado.',
    },
    {
      icon: 'trophy',
      text: topEmployee
        ? `${topEmployee.name} realizou ${topEmployee.quantity} atendimentos no período selecionado.`
        : 'Ainda não há colaboradores com atendimentos no período selecionado.',
    },
    {
      icon: 'wallet',
      text: `As comissões representaram ${Math.round(commissionPercent)}% do faturamento total do período.`,
    },
    {
      icon: 'trend',
      text: topGrowthService
        ? `${topGrowthService.name} foi o serviço mais realizado no período.`
        : 'Ainda não há volume suficiente para identificar o serviço mais realizado.',
    },
  ]
}

async function fetchAppointments(range: PeriodRange): Promise<Agendamento[]> {
  return usableAppointments(
    await getAgendamentos({
      inicio: toApiDateTime(range.start),
      fim: toApiDateTime(range.end),
    }),
  )
}

export async function getDashboardData(
  period: DashboardPeriod,
  customRange?: DashboardCustomRange,
): Promise<DashboardData> {
  const range = period === 'Personalizado' && customRange ? customRange : getPeriodRange(period)
  const previousRange = getPreviousRange(range)
  const [currentAppointments, previousAppointments] = await Promise.all([
    fetchAppointments(range),
    fetchAppointments(previousRange),
  ])

  const current = summarize(currentAppointments)
  const previous = summarize(previousAppointments)
  const topRevenueService = current.servicesRevenue[0]
  const topCountService = current.servicesCount[0]
  const topWorkEmployee = current.employeesWork[0]
  const topCommissionEmployee = current.employeesCommission[0]
  const clientCounts = new Map<string, number>()

  for (const appointment of currentAppointments) {
    clientCounts.set(appointment.clienteId || appointment.clienteNome, (clientCounts.get(appointment.clienteId || appointment.clienteNome) ?? 0) + 1)
  }

  const returningClients = Array.from(clientCounts.values()).filter((count) => count > 1).length
  const retention = clientCounts.size ? Math.round((returningClients / clientCounts.size) * 100) : 0
  const revenueDelta = delta(current.revenue, previous.revenue)

  return {
    kpis: [
      {
        label: 'Faturamento total',
        value: BRL(current.revenue),
        delta: revenueDelta,
        icon: 'money',
        tone: 'blue',
      },
      {
        label: 'Comissões pagas',
        value: BRL(current.commission),
        delta: delta(current.commission, previous.commission),
        icon: 'wallet',
        tone: 'green',
      },
      {
        label: 'Serviços realizados',
        value: current.count.toLocaleString('pt-BR'),
        delta: delta(current.count, previous.count),
        icon: 'check',
        tone: 'blue',
      },
      {
        label: 'Ticket médio',
        value: BRL(current.averageTicket),
        delta: delta(current.averageTicket, previous.averageTicket),
        icon: 'receipt',
        tone: 'green',
      },
      {
        label: 'Serviço mais rentável',
        value: topRevenueService?.name ?? 'Sem dados',
        delta: delta(
          topRevenueService?.value ?? 0,
          findMetric(previous.servicesRevenue, topRevenueService?.name, 'value'),
        ),
        icon: 'crown',
        tone: 'blue',
        sub: topRevenueService ? BRL(topRevenueService.value) : undefined,
      },
      {
        label: 'Serviço mais vendido',
        value: topCountService?.name ?? 'Sem dados',
        delta: delta(
          topCountService?.quantity ?? 0,
          findMetric(previous.servicesCount, topCountService?.name, 'quantity'),
        ),
        icon: 'trend',
        tone: 'green',
        sub: topCountService ? `${topCountService.quantity} atendimentos` : undefined,
      },
      {
        label: 'Colaborador mais ativo',
        value: topWorkEmployee?.name ?? 'Sem dados',
        delta: delta(
          topWorkEmployee?.quantity ?? 0,
          findMetric(previous.employeesWork, topWorkEmployee?.name, 'quantity'),
        ),
        icon: 'trophy',
        tone: 'blue',
        sub: topWorkEmployee ? `${topWorkEmployee.quantity} serviços` : undefined,
      },
      {
        label: 'Top em comissão',
        value: topCommissionEmployee?.name ?? 'Sem dados',
        delta: delta(
          topCommissionEmployee?.value ?? 0,
          findMetric(previous.employeesCommission, topCommissionEmployee?.name, 'value'),
        ),
        icon: 'award',
        tone: 'green',
        sub: topCommissionEmployee ? BRL(topCommissionEmployee.value) : undefined,
      },
    ],
    revenueSeries: buildRevenueSeries(period, range, currentAppointments),
    categoryServices: buildCategoryServices(currentAppointments),
    weekdayServices: buildWeekdayServices(currentAppointments),
    revenueByService: buildRevenueByService(current.servicesRevenue),
    commissionByEmployee: buildCommissionByEmployee(current.employeesCommission),
    rankings: {
      servicesRevenue: current.servicesRevenue,
      servicesCount: current.servicesCount,
      employeesWork: current.employeesWork,
      employeesCommission: current.employeesCommission,
      clients: current.clients,
    },
    summary: {
      growth: percentText(revenueDelta),
      newClients: `+${clientCounts.size.toLocaleString('pt-BR')}`,
      retention: `${retention}%`,
    },
    insights: buildInsights(current),
  }
}
