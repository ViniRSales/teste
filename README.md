# Servify


TESTE TESTE TESTE
Este trabalho apresenta a proposta de desenvolvimento de uma solução Web chamada Servify voltada à automação da gestão operacional e financeira de negócios do setor de serviços, com foco em empresas que trabalham com comissionamento por serviço prestado, como barbearias, salões de beleza e estúdios de estética.

## Integrantes

- Arthur Henrique Figueiredo Cayres Burdignon
- Arthur Jansen Oliveira
- Bruna Pedrosa Nunes
- Lucas Gonçalves Sivolella
- Vinicius Ramos Sales

## Professor

- Cleia Marcia Gomes Amaral
- Joana Gabriela Ribeiro de Souza

## Instruções de utilização

### 1. Visão Geral

Esta aplicação é composta por duas camadas principais:

- Frontend: desenvolvido em React utilizando Vite
- Backend: desenvolvido em Java com o framework Spring Boot

O sistema segue uma arquitetura cliente-servidor, onde o frontend consome APIs REST expostas pelo backend.

Link de acesso do deploy da ferramenta: https://plf-es-2026-1-ti2-1381100-grupo3-servify.onrender.com/

---

### 2. Pré-requisitos

#### Frontend

- Node.js (versão xx ou superior)
- npm

#### Backend

- Java (JDK xx ou superior recomendado)
- Maven ou Gradle

---

### 3. Estrutura do Projeto

    /src
      /back/src
      /front/servify

---

### 4. Executando o Backend

```bash
cd src/back/src
mvn spring-boot:run
```

A aplicação será iniciada em: http://localhost:8080

### 5. Executando o Frontend

```bash
cd src/front/servify
npm install
npm run dev
```

A aplicação estará disponível em: http://localhost:5173

## Histórico de versões

- 0.1.1
  - CHANGE: Atualização das documentações. Código permaneceu inalterado.
- 0.1.0
  - Implementação da funcionalidade X pertencente ao processo P.
- 0.0.1
  - Trabalhando na modelagem do processo de negócio.
