import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { getBaseUrl } from './helpers/getBaseUrl.js';
import { generateRandomEmail } from './helpers/generateRandomEmail.js';
import { login } from './helpers/login.js';
import faker from 'k6/x/faker';

export let options = {
  //  vus: 10,
  //  duration: '15s',
    thresholds: {
        http_req_duration: ['p(95)<2000'],
        'checkout_duration': ['p(95)<2000'],
    },
    stages: [
        { duration: '3s', target: 10 }, 
        { duration: '15s', target: 10 },  
        { duration: '2s', target: 100 },      
        { duration: '5s', target: 10 },  
        { duration: '5s', target: 0 },  
    ],
};

const checkoutDuration = new Trend('checkout_duration');

export default function () {
    const baseUrl = getBaseUrl();
    const email = generateRandomEmail();
    const password = faker.internet.password();

    let userId;
    let token;

    group('Register User', function () {
        const payload = JSON.stringify({
            name: faker.person.firstName(),
            email: email,
            password: password
        });
        const params = { headers: { 'Content-Type': 'application/json' } };
        const res = http.post(`${baseUrl}/api/users/register`, payload, params);
        check(res, { 'register status 201': (r) => r.status === 201 });
        userId = res.json('id');
    });

    group('Login User', function () {
        token = login(email, password);
    });

    group('Checkout', function () {
        const payload = JSON.stringify({
            items: [{ productId: 1, quantity: 1 }],
            freight: 0,
            paymentMethod: 'boleto'
        });
        const params = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        };
        const start = Date.now();
        const res = http.post(`${baseUrl}/api/checkout`, payload, params);
        checkoutDuration.add(Date.now() - start);
        check(res, { 'checkout status 200': (r) => r.status === 200 });
    });

    sleep(1);
}
