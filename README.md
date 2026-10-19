# Hunter x Hunter API

API REST para cadastro e consulta de personagens de Hunter x Hunter. O projeto usa Node.js, Express, TypeScript, Prisma e SQLite.

## Requisitos

- Node.js 20 ou superior
- npm

## Configuração

No PowerShell, instale as dependências e crie seu arquivo local de ambiente:

```powershell
npm install
Copy-Item .env.example .env
```

Edite `.env` e substitua `JWT_SECRET` por um valor aleatório com pelo menos 32 caracteres. Defina também o usuário e a senha que serão criados pelo seed; use essa mesma combinação nas variáveis da coleção Postman.

Prepare o banco e crie o usuário:

```powershell
npm run db:generate
npm run db:migrate
npm run seed
```

Inicie a API:

```powershell
npm run dev
```

Por padrão, o servidor fica disponível em `http://localhost:8080`. A aplicação usa `DATABASE_URL` ou, se omitida, `file:./data/hxh.db`.

## Modelo de dados

- **Usuario**: `id`, `username` único, `passwordHash` e `createdAt`. A senha é armazenada com hash bcrypt.
- **Personagem**: `id`, `nome`, `apelido`, `tipoNen`, `afiliacao`, `idade`, `descricao`, `imagemUrl`, `createdAt` e `updatedAt`.

## Rotas

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/` | Público | Verifica se a API está ativa |
| `POST` | `/login` | Público | Autentica um usuário e retorna um JWT |
| `GET` | `/personagens` | Público | Lista os personagens |
| `GET` | `/personagens/:id` | Público | Busca um personagem pelo ID |
| `POST` | `/personagens` | JWT | Cadastra um personagem |
| `PUT` | `/personagens/:id` | JWT | Atualiza um personagem |
| `DELETE` | `/personagens/:id` | JWT | Exclui um personagem |

Envie `username` e `password` no corpo JSON de `/login`. Para criar, atualizar ou excluir, envie o token retornado no cabeçalho `Authorization: Bearer <token>`.

Exemplo de personagem:

```json
{
  "nome": "Gon Freecss",
  "apelido": "Gon",
  "tipoNen": "Reforço",
  "afiliacao": "Associação Hunter",
  "idade": 12,
  "descricao": "Hunter em treinamento",
  "imagemUrl": "https://example.com/gon.jpg"
}
```

## Verificação no Postman

Importe [`postman/Hunter-x-Hunter.postman_collection.json`](./postman/Hunter-x-Hunter.postman_collection.json) no Postman. Na coleção, ajuste `username` e `password` para os valores configurados no `.env`; `baseUrl` já está definido como `http://localhost:8080`.

Com o servidor ativo e o seed executado, use **Run collection** e execute as requisições na ordem apresentada. Os testes verificam a saúde da API, login válido e inválido, rotas públicas, bloqueio sem JWT e o ciclo de criação, consulta, atualização e exclusão de um personagem. O login salva o token automaticamente para as requisições protegidas.
