# TaskFlow API

API em Node.js + Express para consultar, cadastrar, alterar e excluir tarefas no PostgreSQL.

## Abrir no VS Code

Abra a pasta `taskflow-api` no VS Code. No terminal integrado, copie `.env.example` para `.env`:

```powershell
Copy-Item .env.example .env
```

Se quiser, edite as portas e a senha de desenvolvimento no `.env`.

Tenha o Docker Desktop instalado e aberto. No terminal integrado do VS Code, dentro desta pasta, rode:

```sh
docker compose up --build
```

Na primeira execução, o Compose cria o PostgreSQL, inicializa `public.tarefas` e inicia a API depois que o banco estiver pronto. A API fica em `http://localhost:3000`; o PostgreSQL fica na porta `5433` do computador. Esta instância do Compose é separada do PostgreSQL local que você já abriu no pgAdmin.

Para parar os serviços, use `Ctrl+C` no terminal. Os dados ficam no volume `postgres_data` e continuam lá quando os contêineres são iniciados novamente.

## Conectar pelo pgAdmin

Cadastre uma conexão de servidor com estes dados do `.env` de exemplo:

| Campo | Valor |
| --- | --- |
| Host name/address | `localhost` |
| Port | `5433` |
| Maintenance database | `taskflow` |
| Username | `taskflow` |
| Password | `local-dev-password` |

Se você alterou valores no `.env`, use os valores atuais do arquivo.

## Rotas

Todas as requisições e respostas usam JSON. O campo `titulo` é obrigatório, não pode ficar em branco e aceita até 150 caracteres. `descricao` é opcional ou pode ser `null`.

| Método | Caminho | Resultado |
| --- | --- | --- |
| `GET` | `/health` | Confirma se a API e o PostgreSQL estão disponíveis; retorna `503` se o banco estiver indisponível |
| `GET` | `/api/tarefas` | Lista as tarefas, mais recentes primeiro |
| `GET` | `/api/tarefas/:id` | Consulta uma tarefa; retorna `404` se não existir |
| `POST` | `/api/tarefas` | Cadastra uma tarefa e retorna `201` |
| `PUT` | `/api/tarefas/:id` | Altera título e descrição; retorna `404` se não existir |
| `DELETE` | `/api/tarefas/:id` | Exclui uma tarefa e retorna `204`; retorna `404` se não existir |

Erros do servidor são registrados em formato JSON nos logs do serviço `api`, sem expor detalhes internos na resposta HTTP. Para acompanhá-los no terminal:

```sh
docker compose logs -f api
```

### Exemplos no PowerShell

Verificar a API e o banco:

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/health'
```

Cadastrar:

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/api/tarefas' -Method Post -ContentType 'application/json' -Body '{"titulo":"Revisar projeto","descricao":"Conferir as tarefas"}'
```

Listar:

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/api/tarefas'
```

Alterar a tarefa de ID `1`:

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/api/tarefas/1' -Method Put -ContentType 'application/json' -Body '{"titulo":"Revisar API","descricao":"Atualizar a documentação"}'
```

Excluir a tarefa de ID `1`:

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/api/tarefas/1' -Method Delete
```

## Rodar os testes

Com Node.js instalado, execute na pasta do projeto:

```sh
npm install
npm test
```
