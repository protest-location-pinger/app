import {
  addUser,
  findUserById,
  findUserByUsername,
} from '../users/users.statics';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const mySecret = process.env.SECRET_KEY as string;

export class UsersService {
  constructor() {}

  async getUserById(userId: string) {
    const user = await findUserById(userId);

    if (!user) {
      return {
        status: false,
        message: 'User not found.',
      };
    }

    return {
      status: true,
      message: 'User successfully found.',
      payload: { user },
    };
  }

  async getByUsername(username: string) {
    const user = await findUserByUsername(username);

    if (!user) {
      return {
        status: false,
        message: `User not found.`,
      };
    }

    return {
      status: true,
      message: 'User successfully found.',
      payload: {
        user,
      },
    };
  }

  async authenticateUser(username: string, password: string) {
    const user = await findUserByUsername(username);

    if (!mySecret) {
      return {
        status: false,
        message: `Secret key not set.`,
      };
    }

    if (!user) {
      return {
        status: false,
        message: `User not found.`,
      };
    }

    const isMatch = await bcrypt.compare(password, user.get('password'));

    if (!isMatch) {
      return {
        status: false,
        message: 'Password does not match.',
      };
    }

    const payload = {
      user: {
        id: user._id,
      },
    };

    const myToken = await this.generateJWT(payload);

    return {
      status: true,
      message: 'Successfully authenticated user.',
      payload: { token: myToken },
    };
  }

  async registerUser(username: string, password: string) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const result = await addUser(username, hash);

    if (!result.id) {
      return {
        status: false,
        message: 'Failed registering user.',
      };
    }

    const payload = {
      user: {
        id: result.id,
      },
    };

    const myToken = await this.generateJWT(payload);

    return {
      status: true,
      message: 'Successfully registered user and signed token.',
      payload: { token: myToken },
    };
  }
  /**
 * Signs a payload as a JWT.
 * @param payload The payload.
 * @returns Promise of the signed token.
 */
async generateJWT(payload: {}) {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      mySecret,
      {
        expiresIn: 3600,
      },
      (err, token) => {
        if (err) reject(err);
        else resolve(token);
      }
    );
  });
}
}



interface ReturnResult {
  status: boolean;
  message: string;
  payload?: {};
}
