import { expect } from 'chai';
import sinon, { SinonStubbedInstance } from 'sinon';
import { HeapCodeStatistics } from 'v8';
import User from './users.models';
import { UsersService } from './users.service';
import * as statics from './users.statics';
import bcrypt, { compare } from 'bcryptjs';

describe('UsersService', function () {
  let usersService: UsersService;
  let findByUserIdMock: SinonStubbedInstance<typeof statics.findUserById>;
  let findUserByUsernameMock: SinonStubbedInstance<typeof statics.findUserByUsername>;
  let generateJWTMock: SinonStubbedInstance<typeof usersService.generateJWT>;
  let bcryptMock: SinonStubbedInstance<typeof bcrypt.compare>;
  let authenticateUserMock: SinonStubbedInstance<typeof usersService.authenticateUser>;
  //let passwordMock: SinonStubbedInstance<typeof usersService.isMatch>;
  let registeredUserMock: SinonStubbedInstance<typeof usersService.registerUser >;

  beforeEach(() => {
    usersService = new UsersService();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should create', () => {
    expect(usersService).to.be.ok;
  });

  describe('getUserById', () => {
    it('should return error and if no user is found', async () => {
      findByUserIdMock = sinon
        .stub(statics, 'findUserById')
        .callsFake(async () => await null);

      const userId = '6088b864a6c9b94094b43e42';
      const response = await usersService.getUserById(userId);

      expect(response).to.deep.equal({
        status: false,
        message: 'User not found.',
      });
    });
  });

  it('should return user if a user is found', async () => {
    findByUserIdMock = sinon
      .stub(statics, 'findUserById')
      .callsFake(async () => await user);

    const _id = '6088b864a6c9b94094b43e42';
    const user = new User({
      _id,
      username: 'test-automation',
      associatedProtests: [],
    });


    const response = await usersService.getUserById(_id);

    expect(response).to.deep.equal({
      status: true,
      message: 'User successfully found.',
      payload: { user },
    });
  });

  it('should return error if user is not found', async () => {

    findUserByUsernameMock = sinon
      .stub(statics, 'findUserByUsername')
      .callsFake(async () => await null);

    const username = 'test-automation';
    const response = await usersService.getByUsername(username);

    expect(response).to.deep.equal({
      status: false,
      message: 'User not found.',

    });
  });

  it('should return user if user is found', async () => {

    findUserByUsernameMock = sinon
      .stub(statics, "findUserByUsername")
      .callsFake(async () => await user);

    const username = 'test-automation'
    const user = new User({
      _id: '6088b864a6c9b94094b43e42',
      username: 'test-automation',
      associatedProtest: [],
    })
    const response = await usersService.getByUsername
    expect(response).to.deep.equal({
      status: true,
      message: 'user successfully found',
      payload: { user },

    })
  });

    it('should return error if secret key not set', async() => {
      const mockUser = {
        status: false,
        message: `Secret key not set.`
      }
      
      authenticateUserMock = sinon
        .stub(usersService, "authenticateUser")
        .callsFake(async () => await mockUser);

      const response = await usersService.authenticateUser
      expect(response).to.be.equal({
        status: false,
        message: `Secret key not set.`

      });
    });

      it('should return error if user is not found', async () => {

        findUserByUsernameMock = sinon
          .stub(statics, "findUserByUsername")
          .callsFake(async () => await user);

        const username = 'test-automation'
        const user = new User({
          _id: '6088b864a6c9b94094b43e42',
          username: 'test-automation',
          associatedProtest: [],
        });

        const response = await usersService.getByUsername
        expect(response).to.deep.equal({
          status: false,
          message: 'user successfully found',
          payload: { user },
        });

      });

      
    
        it('should return error if passwords do not match', async() => {
          const mockUser = {
            status: false,
            message: `Password does not match `
          }
          
          
          authenticateUserMock = sinon
            .stub(usersService, "authenticateUser")
            .callsFake(async () => await mockUser);
    
          const response = await usersService.authenticateUser
          expect(response).to.be.equal({
            status: false,
            message: `Password does not match`
          });
});
    describe('registerUser',async() => {

      const mockUser = {
        status: false,
      message: `Failed registering user.`
      };
    registeredUserMock = sinon
            .stub(usersService, "registerUser")
            .callsFake(async () => await mockUser);

            const response = await usersService.registerUser
          expect(response).to.be.equal({
            status: false,
            message: `Failed registering user`


      });
});
});
