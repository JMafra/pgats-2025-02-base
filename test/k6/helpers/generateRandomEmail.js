export function generateRandomEmail() {
    const random = Math.random().toString(36).substring(2, 10);
    return `user_${random}@test.com`;
}
