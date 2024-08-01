import { applyMiddleware, combineReducers, legacy_createStore } from "redux";
import { reducer as authReducer } from "./Auth/reducer";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { thunk } from "redux-thunk";
import postReducer from "./Post/reducer";

const persistConfig = {
  key: "root",
  storage,
  blacklist: ["postReducer"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  postReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);
export const store = legacy_createStore(persistedReducer,applyMiddleware(thunk));
export const persistor = persistStore(store);
