export class AuthService {
  async login(login: string, pass: string) {
    // Admin login validation (username: 123 or admin, pass: 123)
    if ((login === '123' || login === 'admin') && pass === '123') {
      return {
        token: 'meco-admin-jwt-token-123',
        user: {
          id: 'admin-1',
          name: 'MECO Admin Uzbekistan',
          username: login,
          role: 'SUPER_ADMIN',
        },
      };
    }

    throw { statusCode: 401, message: "Login yoki parol noto'g'ri! (Login: 123, Parol: 123)" };
  }

  async register(data: any) {
    return {
      message: "Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi.",
      user: data,
    };
  }
}
