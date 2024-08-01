import { LOGINREQUESTSUCCESS } from "./actionType";

const initialState = {
  token: null,
  user_id: null,
  userdata: null,
};

export const reducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case LOGINREQUESTSUCCESS: {
      return {
        ...state,
        token: payload.token,
        user_id: payload.user_id,
        userdata: {
          user_id: payload.user_id,
          username: payload.username,
          first_name: payload.first_name,
          last_name: payload.last_name,
          email: payload.email,
          type: payload.type,
          preferences: payload.preferences,
          followers_count:payload.followers_count,
          following_count:payload.following_count,
          avatar: payload.avatar,
          picture: payload.picture,
          isverified: payload.isverified,
          status:payload.status,
          role: payload.role?? "",
          name: payload.name,
          connection: payload.connection,
        },
      };
    }

    default:
      return state;
  }
};
