# Servify

**Arthur Henrique Figueiredo Cayres Burdignon, 1402037@sga.pucminas.br**

**Arthur Jansen Oliveira, 1380769@sga.pucminas.br**

**Bruna Pedrosa Nunes, 1118017@sga.pucminas.br**

**Lucas Gonçalves Sivolella, 685776@sga.pucminas.br**

**Vinicius Ramos Sales, 1221046@sga.pucminas.br**

---

Professores:

**Prof. Cleia Marcia Gomes Amaral**

**Prof. Joana Gabriela Ribeiro de Souza**

---

_Curso de Engenharia de Software_

_Instituto de Informática e Ciências Exatas – Pontifícia Universidade Católica de Minas Gerais (PUC MINAS), Belo Horizonte – MG – Brasil_

---

**Resumo**

Este trabalho apresenta o desenvolvimento de uma solução Web voltada à automação da gestão operacional e financeira de empresas do setor de serviços que utilizam remuneração baseada em comissão. O projeto surge a partir das dificuldades enfrentadas por pequenos negócios que realizam o controle de colaboradores, serviços, clientes, agendamentos e comissões por meio de planilhas e processos manuais. O objetivo principal é modelar e propor um sistema integrado que centralize essas informações, reduza erros operacionais e apoie a tomada de decisão gerencial. Como resultado, foram definidos e modelados processos de negócio utilizando o padrão BPMN, contemplando a gestão de serviços, clientes, colaboradores, agendamentos e comissões, evidenciando ganhos em organização, eficiência e confiabilidade das informações.

---

## 1. Introdução

Este trabalho apresenta a proposta de desenvolvimento de uma solução Web chamada Servify voltada à automação da gestão operacional e financeira de negócios do setor de serviços, com foco em empresas que trabalham com comissionamento por serviço prestado, como barbearias, salões de beleza e estúdios de estética.

### 1.1 Contextualização

O setor de serviços representa uma das principais forças da economia brasileira. Segundo dados do IBGE (2023)<sup>[1.1]</sup>, o setor de serviços corresponde a mais de 70% do PIB nacional, sendo responsável por grande parte da geração de empregos formais e informais no país. Dentro desse contexto, micro e pequenas empresas possuem papel fundamental, representando aproximadamente 99% dos negócios ativos no Brasil (SEBRAE, 2023)<sup>[1.2]</sup>.

O setor de beleza está entre os segmentos que mais crescem no Brasil. Segundo levantamento do Sebrae baseado em dados da Receita Federal, somente em 2023 foram registrados mais de 180 mil novos microempreendedores individuais atuando como cabeleireiros, barbeiros, manicures e demais profissionais da área<sup>[1.3]</sup>. Paralelamente, 3 em cada 4 pequenas empresas brasileiras já utilizam ferramentas digitais para realizar negócios, demonstrando que a transformação digital tornou-se uma necessidade competitiva<sup>[1.4]</sup>. Apesar do crescimento desse segmento, muitos desses empreendedores ainda utilizam ferramentas não especializadas para controle do negócio, como planilhas eletrônicas (ex.: Microsoft Excel) ou anotações manuais e, muitos desses empreendedores ainda administram seus atendimentos por meio de agendas físicas ou aplicativos de mensagens, dificultando o controle de clientes, agendamentos, faturamento e indicadores de desempenho.

Embora essas ferramentas atendam necessidades básicas, elas apresentam limitações relacionadas à escalabilidade, controle de acesso, automação de cálculos, geração de relatórios e segurança das informações. Além disso, a falta de sistemas integrados dificulta o acompanhamento em tempo real do faturamento, da produtividade dos colaboradores e do cálculo correto das comissões.

Diante desse cenário, observa-se uma oportunidade para o desenvolvimento de uma solução Web especializada, que automatize processos operacionais e financeiros de empresas do setor de serviços baseadas em comissionamento e, assim, contribua na redução de erros operacionais, melhora da experiência do cliente e fornecicmento de informações estratégicas que apoiem a tomada de decisão.

Durante o processo de pesquisa de mercado para este projeto, foi realizada uma entrevista com o proprietário de uma barbearia denominada Baixinho Hair. Durante a conversa, foi identificado que grande parte do controle operacional e financeiro do estabelecimento é realizado por meio de planilhas do Microsoft Excel. Segundo o proprietário, esse modelo de gestão apresenta limitações relacionadas à organização das informações, controle de faturamento e acompanhamento das comissões dos colaboradores.

O proprietário relatou ainda que a utilização de um sistema específico para gestão da barbearia poderia aumentar significativamente a eficiência operacional, facilitar o controle financeiro e melhorar o acompanhamento da produtividade dos profissionais.

Diante desse cenário, identificou-se uma oportunidade para o desenvolvimento de uma solução tecnológica que auxilie esse tipo de negócio na organização e automação de seus processos.

### 1.2 Problema

Empresas do setor de serviços que trabalham com comissão por atendimento enfrentam dificuldades na gestão e no controle das operações mensais. O cálculo manual das comissões pode gerar erros, retrabalho, conflitos internos e falta de transparência entre colaboradores e gestores.

Além disso, o uso de planilhas não estruturadas dificulta:

- O controle preciso dos serviços prestados por colaborador;
- A organização da agenda de atendimentos;
- A visualização consolidada do faturamento;
- A separação de permissões de acesso entre gestores e funcionários;
- A geração automatizada de relatórios mensais.

Essa realidade impacta diretamente na eficiência operacional, na tomada de decisão e na escalabilidade do negócio.

Portanto, o problema central tratado neste trabalho é:

Como automatizar o controle de serviços prestados, cálculo de comissões e gestão de agenda em empresas do setor de serviços com modelo de remuneração por comissão, garantindo segurança, organização e eficiência?

### 1.3 Objetivo geral

Desenvolver uma solução Web para automação da gestão operacional e financeira de empresas do setor de serviços que utilizam modelo de remuneração por comissão, permitindo controle de serviços, cálculo automático de comissões, gerenciamento de agenda e definição de níveis de acesso de usuários.

#### 1.3.1 Objetivos específicos

- Modelar os processos operacionais de empresas do setor de serviços comissionados, identificando suas principais necessidades de gestão;
- Desenvolver funcionalidades para cadastro de serviços, colaboradores e parametrização de percentuais de comissão;
- Implementar sistema de agendamento integrado ao controle financeiro;
- Criar mecanismo de cálculo automático de comissões mensais por colaborador;
- Definir níveis de acesso diferenciados (Administrador e Colaborador), garantindo segurança das informações;
- Desenvolver relatórios gerenciais que apoiem a tomada de decisão.
- Desenvolver uma tela de Dúvidas com um chat interativo integrado a uma IA, permitindo que o usuário converse de forma natural e receba respostas baseadas na base de dados do sistema.

---

### 1.4 Justificativas

A proposta se justifica pela relevância econômica do setor de serviços e pela alta incidência de micro e pequenas empresas que ainda operam com processos pouco automatizados.

O desenvolvimento da solução contribui para:

- Redução de erros no cálculo de comissões;
- Aumento da transparência entre gestores e colaboradores;
- Organização da agenda e dos atendimentos;
- Melhoria na gestão financeira do negócio;
- Apoio à tomada de decisão baseada em dados.

Além disso, o projeto possui caráter interdisciplinar, integrando conhecimentos de Engenharia de Software, modelagem de sistemas, banco de dados, experiência do usuário e arquitetura Web.

Como contribuição prática, a solução pode evoluir futuramente para um modelo SaaS (Software as a Service), ampliando sua aplicabilidade para diversos segmentos do mercado de serviços.

O diferencial da proposta está na criação de uma solução mais ampla, que não se restrinja exclusivamente a barbearias, mas que atenda qualquer empresa baseada em:

- Prestação de serviços;
- Remuneração por comissão;
- Gestão de agenda e equipe.

Essa abordagem amplia o potencial de mercado e torna o produto escalável.

## 2. Participantes do processo

A seguir, são apresentados os perfis dos usuários-chave do sistema:

◘ Administrador (Dono ou Gestor do Negócio)

Perfil:

- Idade média: 25 a 50 anos;
- Nível de escolaridade: Ensino médio completo ou superior;
- Conhecimento tecnológico: Básico a intermediário;
- Perfil empreendedor, foco em gestão e crescimento.

Responsabilidades no sistema:

- Cadastro de serviços e definição de valores;
- Cadastro e gestão de colaboradores;
- Parametrização de percentuais de comissão;
- Visualização de faturamento geral;
- Geração de relatórios financeiros;
- Controle de permissões de acesso;
- Acompanhamento da produtividade da equipe.

---

◘ Colaborador (Barbeiro, Manicure, Esteticista, etc.)

Perfil:

- Idade média: 18 a 45 anos;
- Conhecimento tecnológico: Básico;
- Foco principal na execução do serviço.

Responsabilidades no sistema:

- Visualizar sua agenda de atendimentos;
- Registrar serviços realizados (quando aplicável);
- Consultar relatório individual de comissões;
- Acompanhar histórico de atendimentos.

Restrições:

- Não possui acesso ao faturamento global da empresa;
- Não visualiza dados salariais de outros colaboradores;
- Não altera parâmetros financeiros do sistema.

---

◘ Cliente

Perfil:

- Usuário final que utiliza os serviços oferecidos pelo estabelecimento;
- Pode acessar o sistema para agendar serviços ou acompanhar seus atendimentos.

Responsabilidades no sistema:

- Realizar agendamento de serviços;
- Consultar horários disponíveis;
- Visualizar histórico de atendimentos;
- Participar de programas de fidelidade ou bonificação.

Restrições:

- Não possui acesso a informações internas da empresa;
- Não visualiza dados de faturamento ou comissão.

## 3. Modelagem do processo de negócio

### 3.1. Análise da situação atual

Atualmente, empresas do setor de serviços que trabalham com prestação de serviços e remuneração por comissão realizam seus controles operacionais e financeiros, em grande parte, por meio de planilhas, anotações manuais ou ferramentas não integradas. Esse modelo atende necessidades básicas, porém apresenta limitações importantes relacionadas à organização das informações, integração entre processos e confiabilidade dos dados.

Na gestão de serviços, é comum que informações como descrição, valor e duração sejam mantidas de forma informal, o que dificulta a padronização dos atendimentos e o correto vínculo com os processos de agendamento e cálculo de comissão. Já na gestão de clientes, os dados cadastrais e o histórico de atendimentos geralmente não estão centralizados, dificultando o acompanhamento do relacionamento com o cliente e ações de fidelização.

Em relação à gestão de colaboradores, os dados cadastrais costumam estar distribuídos em diferentes controles, o que gera retrabalho, dificuldade de atualização e pouca integração com os demais processos do negócio. Esse cenário impacta diretamente o controle da produtividade e o cálculo das comissões.

No processo de gestão de comissões, a definição de percentuais e seus ajustes são realizados manualmente, muitas vezes sem validações automáticas ou histórico de alterações, aumentando o risco de erros, inconsistências e falta de transparência.
Já a gestão de agendamento normalmente ocorre por meio de agendas físicas, planilhas ou aplicativos de mensagens, o que dificulta a visualização geral da agenda, pode gerar conflitos de horários e não permite integração com os processos financeiros e gerenciais.

Dessa forma, o cenário atual é marcado por processos fragmentados, dependência de controles manuais e baixa integração entre informações, evidenciando a necessidade de uma solução que centralize e organize esses processos de forma integrada.

### 3.2. Descrição geral da proposta de solução

A proposta deste projeto é o desenvolvimento de uma solução Web integrada para apoiar a gestão operacional e financeira de empresas do setor de serviços que utilizam modelo de remuneração por comissão. O objetivo é centralizar informações, automatizar processos e reduzir a dependência de controles manuais.

A solução contempla os processos de Gestão de Serviços, Gestão de Clientes, Gestão de Colaboradores, Gestão de Comissões e Gestão de Agendamentos, permitindo maior organização, integração entre dados e padronização das operações. Os processos são modelados utilizando o padrão BPMN, facilitando o entendimento dos fluxos de negócio e apoiando a implementação do sistema.

Na Gestão de Serviços, o sistema permitirá o cadastro estruturado dos serviços, incluindo informações como valor e duração, que servirão de base para o agendamento e cálculo automático das comissões. A Gestão de Clientes possibilitará o cadastro centralizado e o acompanhamento do histórico de atendimentos, contribuindo para melhoria da experiência do cliente.

A Gestão de Colaboradores permitirá manter os dados cadastrais organizados e integrados aos demais processos, enquanto a Gestão de Comissões possibilitará a parametrização de percentuais com validações automáticas e maior transparência nos cálculos. Já a Gestão de Agendamentos permitirá organizar os atendimentos conforme o perfil de acesso do usuário, evitando conflitos de horários e melhorando a gestão dos recursos do negócio.

Como oportunidades de melhoria, a proposta contribui para a redução de erros operacionais, maior confiabilidade das informações, melhoria da experiência do cliente e apoio à tomada de decisão gerencial, além de permitir a escalabilidade da solução para diferentes tipos de negócios do setor de serviços.

### 3.3. Modelagem dos processos

[PROCESSO 1 - Gestão de Usuário](processo-1-gestao-de-usuario.md "Detalhamento do Processo 1.")

[PROCESSO 2 - Gestão de Serviço](processo-2-gestao-de-servico.md "Detalhamento do Processo 2.")

[PROCESSO 3 - Gestão de Agendamento](processo-3-gestao-de-agendamento.md "Detalhamento do Processo 3.")

[PROCESSO 4 - Gestão de Comissão](processo-4-gestao-de-comissao.md "Detalhamento do Processo 4.")

[PROCESSO 5 - Gestão de Relatório](processo-4-gestao-de-relatório.md "Detalhamento do Processo 5.")

## 4. Projeto da solução

_O documento a seguir apresenta o detalhamento do projeto da solução. São apresentadas duas seções que descrevem, respectivamente: modelo relacional e tecnologias._

[Projeto da solução](solution-design.md "Detalhamento do projeto da solução: modelo relacional e tecnologias.")

## 5. Indicadores de desempenho

_O documento a seguir apresenta os indicadores de desempenho dos processos._

[Indicadores de desempenho dos processos](performance-indicators.md)

## 6. Interface do sistema

_A sessão a seguir apresenta a descrição do produto de software desenvolvido._

[Documentação da interface do sistema](interface.md)

## 7. Conclusão

O desenvolvimento do Servify permitiu demonstrar como a aplicação de tecnologias voltadas à gestão pode contribuir para a modernização de empresas do setor de serviços que utilizam remuneração baseada em comissão. Ao longo deste trabalho, foi possível identificar as principais dificuldades enfrentadas por esses empreendimentos, como a utilização de planilhas eletrônicas, agendas físicas e processos manuais para controle de clientes, colaboradores, serviços, agendamentos e comissões, fatores que comprometem a eficiência operacional e dificultam a tomada de decisões.

A partir da análise desse cenário e da modelagem dos processos de negócio, foi proposta uma solução Web capaz de integrar essas atividades em uma única plataforma. O sistema desenvolvido contempla funcionalidades como gerenciamento de clientes, colaboradores, serviços, agendamentos, cálculo automatizado de comissões e disponibilização de indicadores gerenciais por meio de dashboards interativos, proporcionando maior organização, confiabilidade das informações e redução de erros operacionais.

Os resultados obtidos demonstram que a solução atende aos objetivos propostos, oferecendo uma ferramenta capaz de apoiar a gestão operacional e financeira de pequenos negócios prestadores de serviços. Além de automatizar processos antes realizados manualmente, o Servify fornece informações estratégicas que auxiliam gestores na análise do desempenho da empresa e na tomada de decisões fundamentadas em dados.

Como perspectivas para trabalhos futuros, destacam-se a implementação de novas funcionalidades, como notificações automáticas por WhatsApp ou e-mail, integração com meios de pagamento, controle de estoque, emissão de relatórios financeiros mais avançados e aplicativo para dispositivos móveis. Essas evoluções ampliariam ainda mais o potencial da plataforma e sua aplicabilidade em diferentes segmentos do setor de serviços.

Conclui-se, portanto, que o Servify representa uma solução tecnológica viável e escalável para empresas prestadoras de serviços, contribuindo para a transformação digital de pequenos negócios, promovendo maior eficiência operacional, transparência na gestão e apoio ao crescimento sustentável das organizações.

# REFERÊNCIAS

**[1.1]** - _BRASIL. Empresa Brasil de Comunicação. Setor de serviços cresce 1,2% em julho e mantém recuperação. Rio de Janeiro: Agência Brasil, 2024. Disponível em: <https://agenciabrasil.ebc.com.br/radioagencia-nacional/economia/audio/2024-09/setor-de-servicos-cresce-12-em-julho-e-mantem-recuperacao>. Acesso em: 16 mar. 2026._

**[1.2]** - _SERVIÇO BRASILEIRO DE APOIO ÀS MICRO E PEQUENAS EMPRESAS (SEBRAE). Pequenos negócios em números. São Paulo: SEBRAE, 2023. Disponível em: <https://sebrae.com.br/sites/PortalSebrae/ufs/sp/sebraeaz/pequenos-negocios-em-numeros,12e8794363447510VgnVCM1000004c00210aRCRD>. Acesso em: 16 mar. 2026. [sebrae.com.br]_

**[1.3]** - _REDAÇÃO AGÊNCIA SEBRAE. Mercado aquecido: setor de beleza somou mais de 180 mil novos microempreendedores individuais em 2023. ASN Nacional, 08 fev. 2024. Disponível em: <https://agenciasebrae.com.br/economia-e-politica/mercado-aquecido-setor-de-beleza-somou-mais-de-180-mil-novos-microempreendedores-individuais-em-2023/>. Acesso em: 28 jun. 2026._

**[1.4]** - _REDAÇÃO AGÊNCIA SEBRAE. 3 em cada 4 pequenas empresas usam ferramentas digitais para fazer negócios. ASN Nacional, 13 set. 2023. Disponível em: <https://agenciasebrae.com.br/dados/3-em-cada-4-pequenas-empresas-usam-ferramentas-digitais-para-fazer-negocios/>. Acesso em: 28 jun. 2026._

# APÊNDICES

## Apêndice A - Código fonte

[Código do front-end](../src/front) -- repositório do código do front-end

[Código do back-end](../src/back) -- repositório do código do back-end

## Apêndice B - Apresentação final

[Slides da apresentação final](presentations/)

[Vídeo da apresentação final](video/)
