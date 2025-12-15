# Exemplos de conceitos de automação e performance com K6

Este projeto utiliza diversos conceitos importantes em automação de testes de performance com K6. Veja exemplos reais extraídos do código:

### Thresholds
Permitem definir limites de performance para o teste:
```js
export let options = {
  vus: 10,
  duration: '15s',
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% das requisições devem responder em menos de 2s
    'checkout_duration': ['p(95)<2000'],
  },
};
```

### Checks
Validações automáticas do status das respostas:
```js
check(res, { 'register status 201': (r) => r.status === 201 });
check(res, { 'login status 200': (r) => r.status === 200 });
check(res, { 'checkout status 200': (r) => r.status === 200 });
```

### Helpers
Funções utilitárias reaproveitáveis, organizadas em arquivos na pasta `test/k6/helpers`:
```js
// helpers/generateRandomEmail.js
export function generateRandomEmail() {
  const random = Math.random().toString(36).substring(2, 10);
  return `user_${random}@test.com`;
}

// helpers/getBaseUrl.js
export function getBaseUrl() {
  return __ENV.BASE_URL || 'http://localhost:3000';
}

// helpers/login.js
export function login(email, password) {
  // ... faz login e retorna o token JWT
}
```

### Trends
Métrica customizada para monitorar tempos de resposta de um endpoint específico:
```js
import { Trend } from 'k6/metrics';
const checkoutDuration = new Trend('checkout_duration');
// ...
checkoutDuration.add(Date.now() - start);
```

### Faker
Para geração de dados aleatórios e realistas, como nomes e senhas, foi utilizado o faker:
```js
import faker from 'k6/x/faker';
 const password = faker.internet.password();
 name: faker.person.firstName(),
```

### Variável de Ambiente
Permite parametrizar a base URL do teste:
```js
const baseUrl = getBaseUrl(); // Usa __ENV.BASE_URL
// Executa o teste com: k6 run --env BASE_URL=http://localhost:3000 ...
```

### Stages
Para simular diferentes cargas ao longo do tempo, pode-se usar o parâmetro `stages` em options:
```js
export let options = {
  stages: [
    { duration: '5s', target: 5 },
    { duration: '10s', target: 10 },
    { duration: '5s', target: 0 },
  ],
};
```

### Reaproveitamento de Resposta
O token de autenticação obtido no login é reutilizado para o checkout:
```js
let token;
group('Login User', function () {
  token = login(email, password);
});
// ...
group('Checkout', function () {
  // Usa o token obtido no login
  const params = { headers: { Authorization: `Bearer ${token}` } };
});
```

### Uso de Token de Autenticação
O token JWT é passado no header Authorization para endpoints protegidos:
```js
const params = {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }
};
```

### Groups
Organiza o teste em blocos lógicos para melhor leitura e relatórios:
```js
group('Register User', function () { /* ... */ });
group('Login User', function () { /* ... */ });
group('Checkout', function () { /* ... */ });
```

---
Esses conceitos tornam o teste mais robusto, reutilizável, parametrizável e fácil de manter/analisar.
# API Checkout Rest e GraphQL

Se você é aluno da Pós-Graduação em Automação de Testes de Software (Turma 2), faça um fork desse repositório e boa sorte em seu trabalho de conclusão da disciplina.

## Instalação

```bash
npm install express jsonwebtoken swagger-ui-express apollo-server-express graphql
```

## Exemplos de chamadas

### REST

#### Registro de usuário
```bash
curl -X POST http://localhost:3000/api/users/register \
	-H "Content-Type: application/json" \
	-d '{"name":"Novo Usuário","email":"novo@email.com","password":"senha123"}'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/users/login \
	-H "Content-Type: application/json" \
	-d '{"email":"novo@email.com","password":"senha123"}'
```

#### Checkout (boleto)
```bash
curl -X POST http://localhost:3000/api/checkout \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <TOKEN_JWT>" \
	-d '{
		"items": [{"productId":1,"quantity":2}],
		"freight": 20,
		"paymentMethod": "boleto"
	}'
```

#### Checkout (cartão de crédito)
```bash
curl -X POST http://localhost:3000/api/checkout \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <TOKEN_JWT>" \
	-d '{
		"items": [{"productId":2,"quantity":1}],
		"freight": 15,
		"paymentMethod": "credit_card",
		"cardData": {
			"number": "4111111111111111",
			"name": "Nome do Titular",
			"expiry": "12/30",
			"cvv": "123"
		}
	}'
```

### GraphQL

#### Registro de usuário
Mutation:
```graphql
mutation Register($name: String!, $email: String!, $password: String!) {
  register(name: $name, email: $email, password: $password) {
    email
    name
  }
}

Variables:
{
  "name": "Julio",
  "email": "julio@abc.com",
  "password": "123456"
}
```

#### Login
Mutation:
```graphql
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
  }
}

Variables:
{
  "email": "alice@email.com",
  "password": "123456"
}
```


#### Checkout (boleto)
Mutation (envie o token JWT no header Authorization: Bearer <TOKEN_JWT>):
```graphql
mutation Checkout($items: [CheckoutItemInput!]!, $freight: Float!, $paymentMethod: String!, $cardData: CardDataInput) {
  checkout(items: $items, freight: $freight, paymentMethod: $paymentMethod, cardData: $cardData) {
    freight
    items {
      productId
      quantity
    }
    paymentMethod
    userId
    valorFinal
  }
}

Variables:
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 2,
      "quantity": 1
    }
  ],
  "freight": 10,
  "paymentMethod": "boleto"
}
```

#### Checkout (cartão de crédito)
Mutation (envie o token JWT no header Authorization: Bearer <TOKEN_JWT>):
```graphql
mutation {
	checkout(
		items: [{productId: 2, quantity: 1}],
		freight: 15,
		paymentMethod: "credit_card",
		cardData: {
			number: "4111111111111111",
			name: "Nome do Titular",
			expiry: "12/30",
			cvv: "123"
		}
	) {
		valorFinal
		paymentMethod
		freight
		items { productId quantity }
	}
}

Variables:
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 2,
      "quantity": 1
    }
  ],
  "freight": 10,
  "paymentMethod": "credit_card",
  "cardData": {
    "cvv": "123",
    "expiry": "10/04",
    "name": "Julio Costa",
    "number": "1234432112344321"
  }
}
```

#### Consulta de usuários
Query:
```graphql
query Users {
  users {
    email
    name
  }
}
```

## Como rodar

### REST
```bash
node rest/server.js
```
Acesse a documentação Swagger em [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### GraphQL
```bash
node graphql/app.js
```
Acesse o playground GraphQL em [http://localhost:4000/graphql](http://localhost:4000/graphql)

## Endpoints REST
- POST `/api/users/register` — Registro de usuário
- POST `/api/users/login` — Login (retorna token JWT)
- POST `/api/checkout` — Checkout (requer token JWT)

## Regras de Checkout
- Só pode fazer checkout com token JWT válido
- Informe lista de produtos, quantidades, valor do frete, método de pagamento e dados do cartão se necessário
- 5% de desconto no valor total se pagar com cartão
- Resposta do checkout contém valor final

## Banco de dados
- Usuários e produtos em memória (veja arquivos em `src/models`)

## Testes
- Para testes automatizados, importe o `app` de `rest/app.js` ou `graphql/app.js` sem o método `listen()`

## Documentação
- Swagger disponível em `/api-docs`
- Playground GraphQL disponível em `/graphql`
