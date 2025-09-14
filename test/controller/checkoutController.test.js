const request = require('supertest');
const sinon = require('sinon');
const { expect } = require('chai');
const app = require('../../rest/app');
const jwt = require('jsonwebtoken');

const checkoutService = require('../../src/services/checkoutService');

// Gera o token dinamicamente
const payload = { id: 1, name: 'Alice', email: 'alice@email.com', password: '123456' }; // dados do usuário
const secret = 'supersecret'; // deve ser a mesma usada na sua aplicação
const token = jwt.sign(payload, secret, { expiresIn: '1h' });

describe('Checkout Controller', () => {
    describe('POST /checkout', () => {
       it('Quando o token é inválido, retorna 401', async () => {
          const resposta = await request(app)
               .post('/api/checkout')
               .set('Authorization', 'Bearer token_invalido') // simula envio de token inválido
               .send({
                   items: [{ productId: 1, quantity: 2 }],
                   freight: 10, 
                     paymentMethod: 'credit_card',
                     cardData: { number: '1234-5678-9012-3456', expiry: '12/25', cvv: '123' },
                });

            expect(resposta.status).to.equal(401);      
            expect(resposta.body).to.deep.equal({ error: 'Token inválido'});
         });

     it('Quando os dados do checkout são inválidos, retorna 400', async () => {
        const resposta = await request(app)
            .post('/api/checkout')
            .set('Authorization', `Bearer ${token}`)
            .send({
                // Dados incompletos ou inválidos-sem items
                freight: 10,
                paymentMethod: 'credit_card',
                cardData: { number: '1234-5678-9012-3456', expiry: '12/25', cvv: '123' },
            });

        expect(resposta.status).to.equal(400);
        expect(resposta.body).to.have.property('error');
    });

it('Quando o checkout é realizado com sucesso, retorna 200', async () => {
        const resposta = await request(app)
            .post('/api/checkout')
            .set('Authorization', `Bearer ${token}`)
            .send({
                items: [{ productId: 1, quantity: 2 }],
                freight: 10,
                paymentMethod: 'credit_card',
                cardData: { number: '1234-5678-9012-3456', expiry: '12/25', cvv: '123' },
            });

        expect(resposta.status).to.equal(200);  
        expect(resposta.body).to.have.property('valorFinal');       
        expect(resposta.body).to.have.property('items');
        expect(resposta.body).to.have.property('freight');
        expect(resposta.body).to.have.property('paymentMethod');
        expect(resposta.body).to.have.property('total');       
       
    });
    
    });
  });