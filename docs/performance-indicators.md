## 5. Indicadores de desempenho

Os indicadores abaixo foram desenhados para mensurar a eficiência operacional e a saúde financeira dos estabelecimentos que utilizam o Servify, utilizando exclusivamente os dados estruturados nos processos de agendamento, serviços e comissões do sistema.

| **Indicador** | **Objetivos** | **Descrição** | **Fonte de dados** | **Fórmula de cálculo** |
| --- | --- | --- | --- | --- |
| **Ticket Médio por Atendimento** | Monitorizar o valor médio gasto pelos clientes por serviço concluído. | Mede o retorno financeiro líquido médio gerado a cada agendamento finalizado no período. | Ficheiro `AgendamentoResponseDTO` (campos `valorFinal` e `status`) | Soma do `valorFinal` de todos os agendamentos com status "CONCLUIDO" / Número total de agendamentos com status "CONCLUIDO" |
| **Índice de Comissionamento Total** | Avaliar o impacto do custo das comissões sobre a faturação líquida da empresa. | Percentagem da faturação total gerada que é destinada ao pagamento de comissões dos profissionais parceiros. | Ficheiro `AgendamentoResponseDTO` (campos `comissao`, `valorFinal` e `status`) | (Soma total do campo `comissao` / Soma total do campo `valorFinal`) * 100 |
| **Taxa de Cancelamento de Agendamentos** | Identificar o volume de desistências e a ociosidade gerada na agenda do estabelecimento. | Percentual de agendamentos que foram desmarcados ou cancelados em relação ao total absoluto criado. | Ficheiro `AgendamentoResponseDTO` (campo `status`) | (Número de agendamentos com status "CANCELADO" / Número total absoluto de agendamentos criados) * 100 |
| **Taxa de Ocupação dos Colaboradores** | Medir a eficiência de tempo e a produtividade da equipa de prestadores cadastrados. | Percentagem de minutos preenchidos na agenda em relação à capacidade útil total de atendimento da equipa. | Ficheiros `AgendamentoResponseDTO` (campo `duracaoMinutos`) e `Usuario` | (Soma do campo `duracaoMinutos` de agendamentos "CONCLUIDO" / Tempo total de disponibilidade útil da equipa em minutos) * 100 |

---

### Memória de Cálculo e Detalhe das Fórmulas

#### 1. Ticket Médio por Atendimento ($TM$)
* **Objetivo:** Avaliar o comportamento de consumo do cliente e o valor médio movimentado por atendimento.
* **Fórmula Matemática:**
  $$TM = \frac{\sum_{i=1}^{n} \text{valorFinal}_i}{N_{\text{concluidos}}}$$
* **Especificação Técnica e Regras de Negócio:**
  * **Filtro Obligatório:** Considera apenas os registos do record `AgendamentoResponseDTO` onde o campo `status` é estritamente igual a `"CONCLUIDO"`.
  * **Dedução:** Utiliza o campo `valorFinal`, que já contabiliza o valor bruto do serviço subtraído do campo `desconto`. Agendamentos com status `"CANCELADO"` ou `"PENDENTE"` são completamente ignorados no cálculo.
* **Exemplo de Aplicação:** Se num determinado dia ocorreram 3 agendamentos concluídos com os valores de `valorFinal` de 50.00, 120.00 e 70.00:
  $$TM = \frac{50.00 + 120.00 + 70.00}{3} = \frac{240.00}{3} = 80.00 \text{ R\$}$$

---

#### 2. Índice de Comissionamento Total ($ICT$)
* **Objetivo:** Funcionar como um termómetro de saúde financeira para o administrador, monitorizando a percentagem de receita repassada à equipa.
* **Fórmula Matemática:**
  $$ICT = \left( \frac{\sum_{i=1}^{n} \text{comissao}_i}{\sum_{i=1}^{n} \text{valorFinal}_i} \right) \times 100$$
* **Especificação Técnica e Regras de Negócio:**
  * **Mapeamento:** Executa o somatório acumulado do campo `comissao` em todos os records `AgendamentoResponseDTO` com status `"CONCLUIDO"` e divide-o pela soma do campo `valorFinal` do mesmo intervalo.
  * **Validação:** Ajuda o gestor a validar se os valores cadastrados na entidade `Comissao` (que aceita taxas entre `0.0000` e `1.0000`) não estão a comprometer a margem de lucro operacional do negócio.
* **Exemplo de Aplicação:** Se no fechamento do mês o somatório do campo `valorFinal` foi de R\$10.000,00 e o somatório das comissões calculadas (`comissao`) para os colaboradores totalizou R\$4.200,00 :
  $$ICT = \left( \frac{4200.00}{10000.00} \right) \times 100 = 0.42 \times 100 = 42\%$$

---

#### 3. Taxa de Cancelamento de Agendamentos ($TCA$)
* **Objetivo:** Quantificar perdas de janelas de tempo e ociosidade oculta causada por desistências.
* **Fórmula Matemática:**
  $$TCA = \left( \frac{N_{\text{cancelados}}}{N_{\text{totais}}} \right) \times 100$$
* **Especificação Técnica e Regras de Negócio:**
  * **Numerador:** Contagem total de records `AgendamentoResponseDTO` onde `status == "CANCELADO"`.
  * **Denominador ($N_{\text{totais}}$):** Volume absoluto de todos os agendamentos registados no sistema para o período avaliado, somando de forma indistinta os estados `"CONCLUIDO"`, `"CANCELADO"` e `"PENDENTE"`.
* **Exemplo de Aplicação:** Se os clientes reservaram 200 horários na plataforma durante a semana e, desse montante, 16 horários mudaram para o status `"CANCELADO"`:
  $$TCA = \left( \frac{16}{200} \right) \times 100 = 0.08 \times 100 = 8\%$$

---

#### 4. Taxa de Ocupação dos Colaboradores ($TOC$)
* **Objetivo:** Analisar a produtividade do tempo útil de trabalho dos prestadores de serviço ativos.
* **Fórmula Matemática:**
  $$TOC = \left( \frac{\sum_{i=1}^{n} \text{duracaoMinutos}_i}{\text{DisponibilidadeTotalMinutos}} \right) \times 100$$
* **Especificação Técnica e Regras de Negócio:**
  * **Numerador:** Soma o tempo em minutos de cada atendimento que foi efetivamente prestado, extraído do campo `duracaoMinutos` de agendamentos concluídos.
  * **Denominador:** Calculado multiplicando a carga horária útil configurada no perfil de colaboradores ativos (ex: 8 horas diárias por profissional) convertida em minutos:
    $$\text{DisponibilidadeTotalMinutos} = \text{Quantidade de Colaboradores Ativos} \times (\text{Jornada em Horas} \times 60)$$
* **Exemplo de Aplicação:** Num estabelecimento com 2 colaboradores com jornada diária de 8 horas cada (Disponibilidade total = $2 \times 480 = 960$ minutos). Se a soma de `duracaoMinutos` dos agendamentos `"CONCLUIDO"` do dia foi de 720 minutos:
  $$TOC = \left( \frac{720}{960} \right) \times 100 = 0.75 \times 100 = 75\%$$
