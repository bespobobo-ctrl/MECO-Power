export class AuthService {
  async login(login: string, pass: string) {
    // Strict admin login validation (username: admin, pass: meco3997)
    if (login === 'admin' && pass === 'meco3997') {
      return {
        token: 'meco-admin-jwt-token-3997',
        user: {
          id: 'admin-1',
          name: 'MECO Admin Uzbekistan',
          username: login,
          role: 'SUPER_ADMIN',
        },
      };
    }

    throw { statusCode: 401, message: "Login yoki parol noto'g'ri!" };
  }

  async register(data: any) {
    return {
      message: "Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi.",
      user: data,
    };
  }
}
