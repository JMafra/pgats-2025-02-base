const request = require('supertest');
const {expect}  = require('chai')


describe('Checkout GraphQL', ()=>{
    it('GraphQL: Quando o checkout é realizado com sucesso, retorna 200', async ()=>{
       const resposta = await request('http://localhost:4000')
             .post('/graphql')
             .send({
                query: `
                      mutation Mutation($email: String!, $password: String!) { 
                         login(email: $email, password: $password) {
                            token 
                        }
                      }`,
                variables:{  
                    email: 'alice@email.com',
                    password: '123456'
                }
             });     

      const respostaCheckout  = await request('http://localhost:4000')
           .post('/graphql')
           .set('Authorization', `Bearer ${resposta.body.data.login.token}` )
           .send({
               query: ` 
                 mutation Checkout($items: [CheckoutItemInput!]!, $freight: Float!, $paymentMethod: String!) {
                checkout(items: $items, freight: $freight, paymentMethod: $paymentMethod) {
                    freight
                    items {
                    quantity
                    productId
                    }
                 }
                }
               `,
               variables: {
                  items: [{ productId: 1, quantity: 2 }],
                  freight: 10,
                  paymentMethod: 'boleto'
               }
           });

           expect(respostaCheckout.status).to.equal(200)
    });
});
