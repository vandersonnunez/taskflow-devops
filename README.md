# TaskFlow — Sistema de Gerenciamento de Tarefas

Projeto acadêmico de desenvolvimento de um sistema web de gerenciamento de tarefas, aplicando **SCRUM, Git, GitHub, testes automatizados, Docker, integração contínua (CI), implantação contínua (CD) e monitoramento em nuvem**.

O sistema permite criar, consultar, editar, excluir e organizar tarefas por status, prioridade e data de vencimento.

## Acesso ao sistema

**Aplicação publicada no Microsoft Azure:**

https://taskflow-vanderson-devops-2026-fzafepgwhga7g3a8.canadacentral-01.azurewebsites.net/

**Verificação de integridade da API:**

https://taskflow-vanderson-devops-2026-fzafepgwhga7g3a8.canadacentral-01.azurewebsites.net/health

> Projeto desenvolvido para fins acadêmicos. A aplicação publicada é um ambiente de demonstração e não possui autenticação de usuários. Não utilize informações sensíveis ou dados reais importantes.

## 1. Objetivo do projeto

Desenvolver uma aplicação web funcional e aplicar práticas de DevOps durante todo o ciclo de desenvolvimento, desde o planejamento até a publicação automatizada.

**Objetivos principais:**

- Organizar o trabalho utilizando a metodologia SCRUM.
- Utilizar Git e GitHub para versionamento do código.
- Desenvolver frontend, backend e banco de dados.
- Implementar operações CRUD de tarefas.
- Criar e executar testes automatizados.
- Utilizar Docker e Docker Compose no ambiente local.
- Configurar um pipeline CI/CD com GitHub Actions.
- Publicar automaticamente a aplicação no Microsoft Azure.
- Implementar verificações de integridade e disponibilizar logs para monitoramento.

## 2. Equipe

| Integrante | Área de atuação |
|---|---|
| Vanderson Nunes dos Santos | Coordenação, integração e DevOps |
| Gustavo | Frontend |
| Murilo | Backend e banco de dados |

O desenvolvimento foi organizado em atividades relacionadas à implementação, integração, testes, infraestrutura e documentação.

## 3. Tecnologias utilizadas

| Camada | Tecnologias |
|---|---|
| Frontend | HTML5, CSS3 e JavaScript |
| Backend | Node.js 24 e Express |
| Banco de dados | PostgreSQL |
| Testes automatizados | Node.js Test Runner |
| Contêineres | Docker e Docker Compose |
| Versionamento | Git e GitHub |
| CI/CD | GitHub Actions |
| Hospedagem | Microsoft Azure App Service |
| Banco em nuvem | Azure Database for PostgreSQL |
| Gerenciamento do projeto | SCRUM e Trello |
| Monitoramento | Azure Monitor, logs do App Service e endpoint `/health` |

## 4. Funcionalidades

O TaskFlow disponibiliza as seguintes operações:

- Cadastro de novas tarefas.
- Visualização da lista de tarefas.
- Consulta de tarefa por identificador.
- Edição de tarefas cadastradas.
- Exclusão de tarefas.
- Definição de status: pendente, em andamento ou concluída.
- Definição de prioridade: baixa, média ou alta.
- Definição de data de vencimento.
- Filtros para organização das tarefas.
- Validação de dados recebidos pela API.
- Tratamento de erros e respostas HTTP.
- Endpoint de verificação de integridade.

## 5. Arquitetura da aplicação

A solução possui três componentes principais:

**Frontend:** interface utilizada pelo usuário para gerenciar tarefas.

**Backend:** API REST desenvolvida em Node.js e Express, responsável por receber requisições, validar dados e executar as operações.

**Banco de dados:** PostgreSQL, responsável pelo armazenamento persistente das tarefas.

Fluxo da aplicação:

```text
Usuário
   |
   v
Frontend (HTML, CSS e JavaScript)
   |
   | Requisições HTTP
   v
Backend (Node.js + Express)
   |
   | Consultas SQL parametrizadas
   v
PostgreSQL
```

No ambiente de nuvem, o frontend e a API são disponibilizados pelo Azure App Service, enquanto os dados ficam armazenados no Azure Database for PostgreSQL.

## 6. Estrutura do projeto

A estrutura principal do repositório inclui:

```text
taskflow-devops/
|
|-- .github/
|   |-- workflows/
|       |-- ci.yml
|
|-- taskflow-api/
|   |-- db/
|   |   |-- init.sql
|   |   |-- migrations/
|   |
|   |-- public/
|   |   |-- css/
|   |   |-- js/
|   |   |-- index.html
|   |
|   |-- src/
|   |   |-- app.js
|   |   |-- db.js
|   |   |-- server.js
|   |   |-- repositories/
|   |
|   |-- tests/
|   |-- Dockerfile
|   |-- compose.yaml
|   |-- package.json
|   |-- package-lock.json
|   |-- .env.example
|
|-- README.md
```

## 7. Banco de dados

O banco PostgreSQL utiliza a tabela `tarefas`, composta pelos seguintes campos:

| Campo | Tipo | Finalidade |
|---|---|---|
| id | BIGINT | Identificador da tarefa |
| titulo | VARCHAR(150) | Título |
| descricao | TEXT | Descrição |
| status | VARCHAR(20) | Situação atual |
| prioridade | VARCHAR(10) | Grau de prioridade |
| data_vencimento | DATE | Prazo |
| criado_em | TIMESTAMPTZ | Data de criação |
| atualizado_em | TIMESTAMPTZ | Data de atualização |

O esquema possui chave primária, campos obrigatórios e restrições que impedem títulos vazios e valores inválidos de status e prioridade.

O script inicial está localizado em `taskflow-api/db/init.sql`.

## 8. Execução local com Docker

**Pré-requisitos:**

- Git
- Docker
- Docker Compose

Clone o projeto:

```bash
git clone https://github.com/vandersonnunez/taskflow-devops.git
cd taskflow-devops/taskflow-api
```

Crie um arquivo `.env` com base em `.env.example` e configure as variáveis necessárias para o ambiente local.

Depois execute:

```bash
docker compose up --build -d
```

O Docker Compose inicia os serviços necessários para utilizar a aplicação e o banco de dados localmente.

Para consultar os contêineres:

```bash
docker compose ps
```

Para acompanhar os logs:

```bash
docker compose logs -f
```

Para encerrar os serviços:

```bash
docker compose down
```

**Segurança:** o arquivo `.env` não deve ser enviado ao GitHub. Senhas e credenciais devem permanecer fora do código-fonte.

## 9. Testes automatizados

O projeto utiliza o test runner nativo do Node.js.

Para instalar as dependências:

```bash
cd taskflow-api
npm ci
```

Para verificar o build:

```bash
npm run build
```

Para executar os testes:

```bash
npm test
```

Na execução validada em 26/10/2026, foram obtidos os seguintes resultados:

| Indicador | Resultado |
|---|---|
| Testes executados | 23 |
| Testes aprovados | 23 |
| Testes com falha | 0 |
| Build | Aprovado |

Os testes abrangem endpoints da API, validações de entrada, operações CRUD, tratamento de erros, consultas SQL e configurações de conexão ao banco de dados.

## 10. Integração e implantação contínuas — CI/CD

O projeto utiliza **GitHub Actions** por meio do arquivo:

`.github/workflows/ci.yml`

O fluxo é executado automaticamente quando há um push na branch `main` ou um pull request direcionado a ela.

### Etapa CI — Integração contínua

O primeiro job executa:

1. Download do código-fonte.
2. Configuração do Node.js.
3. Instalação das dependências com `npm ci`.
4. Verificação do build.
5. Execução dos testes automatizados.
6. Construção da imagem Docker.

Se alguma dessas verificações falhar, o job de implantação não será executado.

### Etapa CD — Implantação contínua

Quando o CI é aprovado em um push para `main`, o segundo job:

1. Autentica no Microsoft Azure utilizando OpenID Connect (OIDC).
2. Utiliza uma identidade autorizada para implantar no App Service.
3. Publica automaticamente o conteúdo da aplicação.
4. Disponibiliza a nova versão no ambiente de nuvem.

A autenticação OIDC evita a necessidade de armazenar uma senha permanente de implantação no GitHub.

**Execução validada em 26/10/2026:** os jobs de build, testes, Docker e implantação no Azure foram concluídos com sucesso.

## 11. Hospedagem no Microsoft Azure

A infraestrutura utiliza:

**Azure App Service**

- Aplicação: `taskflow-vanderson-devops-2026`
- Sistema operacional: Linux
- Runtime: Node.js 24
- Região: Canada Central
- Plano: Basic B1

**Azure Database for PostgreSQL**

- Servidor: `taskflow-postgres-vanderson-2026`
- Banco lógico: `taskflow`
- Versão do PostgreSQL: 18
- Região: Canada Central

As credenciais de conexão ficam nas configurações de ambiente do App Service, não no repositório.

A aplicação utiliza TLS para a comunicação com o PostgreSQL na nuvem.

## 12. Monitoramento e logs

O projeto possui um endpoint de verificação de integridade:

```http
GET /health
```

Exemplo de resposta quando a aplicação e o banco estão disponíveis:

```json
{
  "status": "ok",
  "database": "ok"
}
```

O Azure App Service está configurado para utilizar `/health` na verificação de integridade.

Também foram habilitados logs da aplicação no sistema de arquivos do App Service. Os registros podem ser consultados pelo recurso **Fluxo de log**, permitindo investigar inicialização, execução e falhas do backend.

O Azure Monitor disponibiliza métricas de requisições, desempenho e saúde da aplicação.

## 13. Metodologia SCRUM

O trabalho foi organizado com práticas da metodologia SCRUM e acompanhamento pelo Trello.

O planejamento contempla:

- Definição do objetivo e escopo.
- Organização do Product Backlog.
- Divisão das atividades em sprints.
- Distribuição de responsabilidades.
- Desenvolvimento e integração das funcionalidades.
- Testes e correções.
- Configuração da infraestrutura e do CI/CD.
- Validação da aplicação publicada.
- Documentação e apresentação.

O Trello é utilizado para acompanhar as tarefas, responsáveis e evolução do projeto.

## 14. Segurança

Foram adotadas as seguintes práticas:

- Utilização de variáveis de ambiente para configurações sensíveis.
- Arquivo `.env` excluído do versionamento.
- Autenticação OIDC entre GitHub Actions e Azure.
- Permissões de implantação limitadas ao App Service.
- Restrições de firewall no PostgreSQL.
- Comunicação TLS com o banco em nuvem.
- Consultas SQL parametrizadas.
- Validação de entradas recebidas pela API.
- Tratamento de erros no backend.

O TaskFlow é um protótipo acadêmico. Funcionalidades como autenticação de usuários, autorização por perfil e políticas adicionais de segurança serão necessárias antes de utilizá-lo como sistema de produção com dados reais.

## 15. Resultados do projeto

O projeto demonstrou o funcionamento integrado de práticas de desenvolvimento e DevOps.

Resultados comprovados durante os testes:

- Aplicação acessível publicamente pela internet.
- Cadastro, edição e exclusão de tarefas funcionando no Azure.
- Banco PostgreSQL conectado à aplicação.
- 23 testes automatizados aprovados.
- Imagem Docker construída pelo pipeline.
- Deploy automático realizado com sucesso pelo GitHub Actions.
- Endpoint `/health` retornando aplicação e banco disponíveis.
- Logs de inicialização do Node.js disponíveis no Azure.

## 16. Melhorias futuras

Possíveis evoluções do TaskFlow incluem:

- Login e autenticação de usuários.
- Permissões e perfis de acesso.
- Associação de tarefas a usuários.
- Notificações de vencimento.
- Dashboard com indicadores.
- Testes de integração adicionais.
- Alertas automáticos de indisponibilidade.
- Histórico de alterações de tarefas.

---

**Projeto acadêmico — TaskFlow**

Equipe: Vanderson, Gustavo e Murilo.

Tecnologias principais: Node.js, Express, PostgreSQL, Docker, GitHub Actions e Microsoft Azure.
