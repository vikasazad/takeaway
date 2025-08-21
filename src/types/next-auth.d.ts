import "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    email?: string;
    password?: string;
    image?: string;
    role?: string;
    newUser: boolean;
    isverified?: string;
    canForgotPassword?: boolean;
    staff: [
      {
        email?: string;
        password?: string;
        role?: string;
        canForgotPassword?: boolean;
        contact?: string;
        newUser?: boolean;
        shiftDetails: {
          end?: string;
          start?: string;
        };
      }
    ];
  }
  interface Session {
    user: {
      id?: string;
      email?: string;
      password?: string;
      image?: string;
      role?: string;
      newUser: boolean;
      isverified?: string;
      canForgotPassword?: boolean;
      staff: [
        {
          name?: string;
          email?: string;
          password?: string;
          role?: string;
          canForgotPassword?: boolean;
          contact?: string;
          newUser?: boolean;
          status?: boolean;
          shiftDetails: {
            end?: string;
            start?: string;
          };
        }
      ];
    };
  }
}
